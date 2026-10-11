import fs from 'node:fs/promises';
import path from 'node:path';
import {CaseStore,NOTE_KINDS,NOTE_STATES} from './cases.mjs';
import * as navigation from './navigation.mjs';
import {loadHQConfig,saveHQPolicy} from './config.mjs';
import {ActionStore, executeAction, reviewText, validatePolicy} from './actions.mjs';
import {findSessions, consultSession} from './sessions.mjs';
import {assert,atomic,readJSON,hash,contentText,clone,mkdir} from './util.mjs';

const reply = data => ({content:[{type:'text',text:JSON.stringify(data,null,2)}],details:data,...(data?.usage?{usage:data.usage}:{})});
function sid(ctx) { return ctx.sessionManager.getSessionId(); }
// Preserve legacy generated records on disk, but never present them as deliberate notes.
function splitNotes(notes) {
  return {own:notes.filter(n=>!['checkpoint','session-consultation'].includes(n.kind))};
}
const BANNER={
 engineering:['   ▄██▄▄██▄   ',' ▄█▀▀    ▀▀█▄ ',' ██  ▄██▄  ██ ',' ▀█▄▄    ▄▄█▀ ','   ▀██▀▀██▀   '],
 coordination:[' ▄▀▀▀▀▀▀▀▄    ',' █ ▪ ▪ ▪ █    ',' ▀▄▄▄▄▄▄▀█▄   ','     ▄▀▀▀▀▀▀▄ ','     ▀▄▄▄▄▄▄▀ ']};
export function introBanner(config,caseKey) {
  const home=process.env.HOME,where=home&&config.hq.startsWith(home+path.sep)?'~'+config.hq.slice(home.length):config.hq;
  const side=config.role==='engineering'
    ?['CONSULTANT B · ENGINEERING','plan · review · debug · optimise · test · UX · docs',`HQ    ${where}`,`Case  ${caseKey??'none yet: name a project to open one'}`,'/hq · /consult · /case-recap · /close-consultation']
    :['CONSULTANT C · COORDINATION','steer · prioritise · commit · communicate · hand off',`HQ    ${where}`,`Case  ${caseKey??'none yet: name a project to open one'}`,'Ordinary Pi authority · /hq for status and optional outbox'];
  return BANNER[config.role].map((art,i)=>`${art}   ${side[i]}`);
}

/** Thin Pi adapter: all durable and security-sensitive state transitions are in tested core modules. */
export async function registerHQ(pi,{Type:T,configPath,answer}={}) {
  assert(configPath && path.isAbsolute(configPath),'Load the local HQ extension from .pi/extensions/consultant.ts; it supplies its own configuration path');
  let config=await loadHQConfig(configPath);
  assert([1,2].includes(config.version) && ['engineering','coordination'].includes(config.role),'Invalid consultant configuration');
  assert(path.isAbsolute(config.hq),'HQ must be absolute');
  config.policy=validatePolicy(config.policy??{});
  const stateRoot=config.stateDir??config.hq;
  const cases=new CaseStore(path.join(stateRoot,'cases'));
  const actions=new ActionStore(path.join(stateRoot,'outbox'),{fileRoots:config.attachmentRoots??[]});
  let selected=null;
  let engagement=null;
  let selectionSource='none';
  const own=new Set();
  function tool(name,description,parameters,execute) {
    own.add(name);pi.registerTool({name,label:name.replaceAll('_',' '),description,parameters,execute:async(callId,params,signal,onUpdate,ctx)=>{
      const data=await execute(params,ctx,{callId,signal,onUpdate});if(config.version===1)return reply(data);
      const target=params.caseKey??(params.client&&params.project?`${params.client}/${params.project}`:selected?`${selected.client}/${selected.project}`:null);
      const context={targetCaseKey:target,caseKey:selected?`${selected.client}/${selected.project}`:null,engagementId:engagement,selectionSource,...(selected&&engagement?{engagementPointer:{caseKey:`${selected.client}/${selected.project}`,section:'engagement',id:engagement}}:{})};
      if(data?.engagements&&data.caseKey)data.engagements=data.engagements.map(e=>({...e,selected:data.caseKey===context.caseKey&&e.id===engagement}));
      return reply({... (Array.isArray(data)?{items:data}:data),context:{...context,meaning:selected?'Selection is the default write target, not permission. Pointer reads do not change it.':'No write target selected. Pointer reads do not select a case.',...(selected?{}:{next:{tool:'hq_navigate',operation:'select',caseKey:'Use the caseKey returned by discovery'}})}});
    }});
  }
  function needCase(){assert(selected,'No case selected. Find it with hq_navigate index, then use hq_navigate select with its caseKey.');return selected;}
  const caseKey=()=>`${needCase().client}/${needCase().project}`;
  function writeTarget(asserted){const s=needCase();const key=`${s.client}/${s.project}`;if(asserted!==undefined){assert(typeof asserted==='string'&&asserted.trim().length>0,'caseKey must be a nonempty client/project key; omit it only for explicit selection');assert(asserted===key,`Selected case is ${key}; use hq_navigate select for the intended target`);}else assert(selectionSource==='explicit',`Restored case ${key}: use hq_navigate select or supply caseKey`);return s;}
  async function requireWritable(key) {
    const state=await cases.read(...navigation.keyParts(key));cases.writable(state);
    assert(config.version===1||state.version===2,'Legacy case is read-only: explicit upgrade required before writes');return state;
  }
  async function associate(client,project,sessionId) {
    const state=await cases.read(client,project);cases.writable(state);
    if(config.version===1||state.version===2)return cases.open({client,project,sessionId});
    return state;
  }
  async function record(ctx,note) {
    const s=writeTarget(note.caseKey);
    const stored=await requireWritable(`${s.client}/${s.project}`);
    assert(stored.version!==2||['case','engagement'].includes(note.scope),'V2 notes require scope:"case" or scope:"engagement"; scope never defaults after closure');
    const hasId=Object.hasOwn(note,'engagementId');
    if(hasId&&note.engagementId!==null)assert(typeof note.engagementId==='string'&&note.engagementId.trim()===note.engagementId&&note.engagementId.length>0&&!['null','undefined','none'].includes(note.engagementId.toLowerCase()),`Invalid engagementId ${JSON.stringify(note.engagementId)}; use scope:"case" without engagementId, or scope:"engagement" with a returned ID`);
    assert(note.scope===undefined||['case','engagement'].includes(note.scope),'scope must be case or engagement');
    let target;
    if(note.scope==='case'){
      assert(!hasId||note.engagementId===null,'scope:"case" conflicts with engagementId; omit the ID');target=null;
    }else if(note.scope==='engagement'){
      assert(hasId&&typeof note.engagementId==='string','scope:"engagement" requires engagementId returned by start/resume');target=note.engagementId;
    }else if(hasId){target=note.engagementId;}
    else {assert(!engagement,'An objective is selected: specify scope:"case" or scope:"engagement" with its ID');target=null;}
    return cases.note(s.client,s.project,{...note,engagementId:target,sessionId:sid(ctx)});
  }
  function restore(ctx,{preserveExplicit=false}={}) {
    const prior={selected,engagement,selectionSource};
    selected=null; engagement=null; selectionSource='none';
    for(const entry of ctx.sessionManager.getBranch()) {
      if(entry.type==='custom'&&entry.customType==='consultant-hq-case-v1'){selected=entry.data;engagement=null;selectionSource='restored';}
      if(entry.type==='custom'&&entry.customType==='consultant-hq-engagement-v2'&&selected&&entry.data.caseKey===`${selected.client}/${selected.project}`)engagement=entry.data.id;
    }
    if(preserveExplicit&&prior.selectionSource==='explicit'&&prior.selected?.client===selected?.client&&prior.selected?.project===selected?.project&&prior.engagement===engagement)selectionSource='explicit';
  }
  pi.on('session_start',async(e,ctx)=>{await mkdir(path.join(stateRoot,'cases'));await mkdir(path.join(stateRoot,'outbox'));restore(ctx);ctx.ui?.setStatus?.('consultant-hq',`${config.role}${selected?` · ${selected.client}/${selected.project}`:''}`);
    if(e?.reason!=='reload')ctx.ui?.setWidget?.('consultant-hq-intro',introBanner(config,selected&&`${selected.client}/${selected.project}`));});
  pi.on('session_tree',async(_e,ctx)=>restore(ctx));
  pi.on('before_agent_start',async(_e,ctx)=>{ctx.ui?.setWidget?.('consultant-hq-intro',undefined);restore(ctx,{preserveExplicit:true});});

  tool('hq_navigate','Discover and curate cases. index finds descriptions; get reads a returned pointer without selecting it; batch reads 1..8 pointers with a shared output budget and explicit remaining pointers; select explicitly sets a case as the write target and clears the selected engagement (use hq_engagement resume for an objective); create checks candidate duplicates; curate revises identity; reference registers one reference with top-level caseKey, system, namespace, key, source (workRefs is only for create). This experimental navigation tool does not grant authority.',T.Object({
    operation:T.Union(['index','get','batch','select','create','curate','reference','resolve'].map(x=>T.Literal(x))),caseKey:T.Optional(T.String({description:'Case locator client/project; required for get/select/curate/reference. Copy caseKey from a returned pointer.'})),query:T.Optional(T.String()),after:T.Optional(T.String()),limit:T.Optional(T.Number()),
    client:T.Optional(T.String()),project:T.Optional(T.String()),title:T.Optional(T.String()),purpose:T.Optional(T.String()),aliases:T.Optional(T.Array(T.String())),related:T.Optional(T.Array(T.Object({caseKey:T.String(),reason:T.String()}))),
    pointers:T.Optional(T.Array(T.Object({caseKey:T.String(),section:T.String(),id:T.Optional(T.String()),scope:T.Optional(T.String()),engagementId:T.Optional(T.String()),offset:T.Optional(T.Number()),length:T.Optional(T.Number()),after:T.Optional(T.String()),expectedRevision:T.Optional(T.Number()),contentRevision:T.Optional(T.Union([T.Number(),T.String()]))}))),
    workspace:T.Optional(T.String()),workRefs:T.Optional(T.Array(T.Object({system:T.String(),namespace:T.String(),key:T.String(),source:T.String()}))),
    system:T.Optional(T.String()),namespace:T.Optional(T.String()),key:T.Optional(T.String()),source:T.Optional(T.String()),
    scope:T.Optional(T.Union(['all','case','engagement'].map(x=>T.Literal(x)))),engagementId:T.Optional(T.String({description:'Only for get section:notes scope:engagement; use a returned objective ID.'})),
    section:T.Optional(T.String({description:'get section: overview, brief, notes, papers, engagements, references, or singular note/paper/engagement/reference.'})),id:T.Optional(T.String({description:'Record ID inside caseKey; required for singular note/paper/engagement/reference get. Does not replace caseKey.'})),offset:T.Optional(T.Number()),length:T.Optional(T.Number()),expectedRevision:T.Optional(T.Number()),contentRevision:T.Optional(T.Union([T.Number(),T.String()])),reviewToken:T.Optional(T.String()),distinction:T.Optional(T.String())
  }),async(p,ctx)=>{
    navigation.validateOperation(p);
    if(p.operation==='select'){
      const [client,project]=navigation.keyParts(p.caseKey);
      await cases.read(client,project);
      await associate(client,project,sid(ctx));
      selected={client,project};engagement=null;selectionSource='explicit';
      pi.appendEntry('consultant-hq-case-v1',selected);
      ctx.ui?.setStatus?.('consultant-hq',`${config.role} · ${p.caseKey}`);
      return navigation.overview(cases,p.caseKey);
    }
    if(p.operation==='index')return navigation.index(cases,p);
    if(p.operation==='get')return navigation.get(cases,p);
    if(p.operation==='batch')return navigation.batch(cases,p);
    if(p.operation==='create')return navigation.create(cases,p);
    if(p.operation==='curate')return navigation.curate(cases,p,sid(ctx));
    if(p.operation==='reference')return navigation.reference(cases,p);
    if(p.operation==='resolve')return navigation.resolve(cases,p);
    throw new Error('Use index, get, select, create, curate, reference or resolve');
  });
  tool('hq_paper','Write a bounded private working paper, not a confirmed finding. Explicit caseKey required; edits require current expectedRevision.',T.Object({caseKey:T.String(),title:T.String(),purpose:T.String(),body:T.Optional(T.String()),file:T.Optional(T.String()),id:T.Optional(T.String()),expectedRevision:T.Optional(T.Number())}),async(p,ctx)=>navigation.paper(cases,p,sid(ctx)));
  tool('hq_engagement','Record a bounded objective. start/resume explicitly select its case. resume does not change lifecycle state: use rework with a basis to reopen delivered work. amend preserves old/new terms in an engagement-linked note; read the returned records pointer. deliver is not completion; close requires met or user-stopped and an evidence basis. Historical mandate never grants current permission.',T.Object({operation:T.Union(['start','resume','amend','rework','deliver','close'].map(x=>T.Literal(x))),caseKey:T.String(),id:T.Optional(T.String()),objective:T.Optional(T.String()),workRefIds:T.Optional(T.Array(T.String({description:'ID returned by hq_navigate reference in this case; register system/namespace/key/source first. Not the ticket key.'}))),mandate:T.Optional(T.String()),doneCondition:T.Optional(T.String()),basis:T.Optional(T.String()),outcome:T.Optional(T.String())}),async(p,ctx)=>{
    const {recorded,...result}=await navigation.engage(cases,p,sid(ctx));
    const [client,project]=navigation.keyParts(p.caseKey);
    if(['start','resume'].includes(p.operation)){
      selected={client,project};engagement=result.id;selectionSource='explicit';
      pi.appendEntry('consultant-hq-case-v1',selected);pi.appendEntry('consultant-hq-engagement-v2',{caseKey:p.caseKey,id:result.id});
    }else if(p.operation==='close'&&selected?.client===client&&selected?.project===project&&engagement===result.id){
      engagement=null;pi.appendEntry('consultant-hq-engagement-v2',{caseKey:p.caseKey,id:null});
    }
    await associate(client,project,sid(ctx));return {engagement:result,...(recorded?{recorded}:{}),records:{caseKey:p.caseKey,section:'notes',scope:'engagement',engagementId:result.id},...(p.operation==='resume'?{meaning:'Reselected without changing lifecycle state.',...(result.state==='delivered'?{next:{tool:'hq_engagement',operation:'rework',caseKey:p.caseKey,id:result.id,basis:'Supply the current revision request; delivered is not closed.'}}:{})}:{})};
  });

  tool('hq_case','Legacy compatibility interface; for v2 use hq_navigate index/get/select/create. Open, read or list private project cases. open: client + project for an existing case (legacy v1 configuration also permits creation with title); selects the case for hq_note/hq_brief. read: client + project, or the open case. list: all cases. Ordinary consultation is the entry point; identify the real project rather than forcing a form.',T.Object({
    operation:T.Union([T.Literal('open'),T.Literal('read'),T.Literal('list')]),client:T.Optional(T.String()),project:T.Optional(T.String()),title:T.Optional(T.String()),workspace:T.Optional(T.String()),query:T.Optional(T.String()),limit:T.Optional(T.Number())
  }),async(p,ctx)=>{
    if(p.operation==='list')return cases.list();
    if(p.operation==='read'){if(p.client||p.project)assert(p.client&&p.project,'read needs both client and project, or neither to read the open case');const s=p.client?{client:p.client,project:p.project}:needCase();const c=await cases.read(s.client,s.project);const limit=p.limit??8;assert(Number.isInteger(limit)&&limit>0&&limit<=30,'Case read limit must be 1..30');const {own,...past}=splitNotes(c.notes,p.query);const matches=own.filter(n=>!p.query||n.text.toLowerCase().includes(p.query.toLowerCase()));return {client:c.client,project:c.project,title:c.title,brief:c.brief,revision:c.revision,workspaces:c.workspaces,notes:matches.slice(-limit),totalNotes:own.length,matchedNotes:matches.length,...past};}
    assert(p.client&&p.project,'Open needs client and project (and a title when creating a new case); use list to find existing cases');
    try {await cases.read(p.client,p.project);} catch(e){if(config.version===1&&p.title)await cases.open({...p,sessionId:sid(ctx)});else if(e.message.startsWith('No case '))return {status:'missing',next:'Use hq_navigate index to find a case, or create with a purpose; open never creates.'};else throw e;}
    if(p.workspace)await requireWritable(`${p.client}/${p.project}`);
    const state=p.workspace?await cases.open({...p,sessionId:sid(ctx)}):await associate(p.client,p.project,sid(ctx));selected={client:p.client,project:p.project};engagement=null;selectionSource='explicit';
    pi.appendEntry('consultant-hq-case-v1',selected);ctx.ui?.setStatus?.('consultant-hq',`${config.role} · ${caseKey()}`);
    if(config.version===1)return {caseKey:caseKey(),revision:state.revision,brief:state.brief,workspaces:state.workspaces,recentNotes:splitNotes(state.notes).own.slice(-8)};
    return navigation.overview(cases,caseKey());
  });
  tool('hq_note','Record a significant finding, decision, feedback, proposal or unresolved question. V2 requires attribution and explicit scope on every write, including after closure. Use scope:case for case-level notes, or scope:engagement with a returned engagementId. Never send string null. After restoration confirm caseKey or select/resume first. Preserve evidence state and source links.',T.Object({
    kind:T.Union(NOTE_KINDS.map(x=>T.Literal(x))),state:T.Union(NOTE_STATES.map(x=>T.Literal(x))),text:T.String(),sources:T.Array(T.String()),supersedes:T.Optional(T.String()),caseKey:T.Optional(T.String()),attribution:T.String({description:'Whose statement or observation this records; writer/session identity is recorded separately.'}),scope:T.Union([T.Literal('case'),T.Literal('engagement')]),engagementId:T.Optional(T.String({description:'Nonempty ID returned by start/resume. Omit for scope:case; required for scope:engagement. Never send null or undefined strings.'}))
  }),async(p,ctx)=>{assert(!['checkpoint','session-consultation','action-receipt'].includes(p.kind),'Legacy generated note kinds cannot be written; choose a deliberate finding or decision');return record(ctx,p);});
  tool('hq_brief','Update the selected case brief using its current revision. Do not create a competing task tracker.',T.Object({
    expectedRevision:T.Number(),brief:T.String(),sources:T.Array(T.String()),caseKey:T.Optional(T.String())
  }),async(p,ctx)=>{const s=writeTarget(p.caseKey);await requireWritable(caseKey());return cases.brief(s.client,s.project,p.expectedRevision,p.brief,p.sources,sid(ctx));});
  tool('session_find','Find relevant saved Pi sessions within explicitly configured source roots. No recipient extension or live broker is required.',T.Object({
    query:T.Optional(T.String()),sessionId:T.Optional(T.String()),limit:T.Optional(T.Number())
  }),async(p)=>{
    const sessionIds=selected?(await cases.read(selected.client,selected.project)).sessions:undefined;
    return findSessions(config,{...p,client:selected?.client,sessionIds});
  });
  tool('session_consult','Ask ONE bounded question against a saved session checkpoint in a tool-free model call. Never changes or messages the source session.',T.Object({
    file:T.String(),checkpoint:T.Optional(T.String()),question:T.String()
  }),async(p,ctx,{signal})=>{
    const adapter=answer??(async({system,prompt,signal})=>{
      assert(ctx.model && typeof ctx.modelRegistry?.complete==='function','This host lacks the targeted modelRegistry.complete API; use the supported Pi baseline');
      const res=await ctx.modelRegistry.complete(ctx.model,{systemPrompt:system,messages:[{role:'user',content:prompt,timestamp:Date.now()}]},
        {signal,cacheRetention:'none',maxTokens:2500});
      assert(res.stopReason!=='error' && !res.content?.some(c=>c.type==='toolCall'),'Consultation did not complete as a tool-free answer');
      return {text:contentText(res.content),usage:res.usage};
    });
    const result=await consultSession(config,p,adapter,{signal});
    return result;
  });
  tool('hq_tools','Inspect actual registered tool schemas before mapping existing MCP services. Never guess connector tool names or argument schemas.',T.Object({name:T.Optional(T.String())}),async(p)=>{
    const all=pi.getAllTools();
    if(p.name){const t=all.find(x=>x.name===p.name);assert(t,'Tool is not registered');return t;}
    return all.map(t=>({name:t.name,description:t.description?.slice(0,220),namespace:t.namespace,annotations:t.annotations,
      classification:config.policy[t.name]?.effect??(own.has(t.name)?'internal':'unclassified')}));
  });
  tool('hq_policy_propose','Propose exact external-tool read/write/deny classifications for human review. This does NOT activate the policy.',T.Object({policy:T.Record(T.String(),T.Unknown())}),async(p)=>{
    validatePolicy(p.policy);const names=new Set(pi.getAllTools().map(t=>t.name));
    for(const n of Object.keys(p.policy))assert(names.has(n),`Tool not registered: ${n}`);
    await atomic(path.join(stateRoot,'policy-proposal.json'),p.policy);
    return {status:'proposed-only',next:'Human: /hq policy-review. Verify service/account labels, mixed-operation constraints and attachment filePointers.'};
  });
  tool('hq_actions','Prepare a communication/action draft, or inspect the outbox. Preparation is not approval. Exact MCP arguments, destination and content are reviewed together.',T.Object({
    operation:T.Union([T.Literal('prepare'),T.Literal('list')]),tool:T.Optional(T.String()),args:T.Optional(T.Record(T.String(),T.Unknown())),
    caseKey:T.Optional(T.String()),purpose:T.Optional(T.String()),destination:T.Optional(T.String()),preflight:T.Optional(T.Unknown()),verify:T.Optional(T.Unknown()),repeatOf:T.Optional(T.String())
  }),async(p,ctx)=>{
    assert(config.role==='coordination','External actions belong to the coordination consultant');
    if(p.operation==='list')return actions.list({caseKey:caseKey(),ownerSession:sid(ctx)});
    assert(pi.getAllTools().some(t=>t.name===p.tool),'Target tool is not registered');
    writeTarget(p.caseKey);
    await requireWritable(caseKey());
    await cases.open({...selected,sessionId:sid(ctx)});
    const a=await actions.prepare({...p,caseKey:caseKey(),ownerSession:sid(ctx)},config.policy);
    return {id:a.id,status:a.status,digest:a.digest,duplicate:a.duplicate??false,preview:reviewText([a]),next:`Human review: /hq approve ${a.id}. Execution follows approval without another confirmation.`};
  });
  tool('hq_execute','Execute only exact, unexpired human-approved actions. Uses the existing authenticated MCP tool pipeline; never retries ambiguous writes.',T.Object({ids:T.Array(T.String())}),async(p,ctx,{signal})=>{
    assert(config.role==='coordination','Wrong consultant');assert(typeof ctx.executeTool==='function','Host lacks pipeline-aware ctx.executeTool');
    assert(p.ids.length>0&&p.ids.length<=20,'Execute 1..20 approved actions');
    const outcomes=[];
    for(const actionId of p.ids){
      let result,dispatchAttempted=false;
      try {
        const planned=await actions.get(actionId);await requireWritable(planned.caseKey);
        result=await executeAction(actions,actionId,sid(ctx),config.policy,
          (name,args)=>ctx.executeTool(name,args,{signal}),{signal,onClaim:()=>{dispatchAttempted=true;}});
      }catch(e){
        const current=await actions.get(actionId).catch(()=>null);
        const uncertain=dispatchAttempted;
        outcomes.push({id:actionId,status:uncertain?'unknown':'not-started',error:e.message,...(uncertain?{recovery:'Action may have been sent. Inspect the outbox and reconcile; do not retry.'}:{})});break;
      }
      outcomes.push(result);
      const [client,project]=result.caseKey.split('/');
      try {await cases.receipt(client,project,{actionId:result.id,digest:result.digest,status:result.status,tool:result.tool,sessionId:sid(ctx)});}
      catch {result.receiptError='Private receipt could not be saved; inspect the durable outbox journal. Do not retry the external action.';break;}
      if(result.status==='unknown'||result.status==='blocked')break; // Stop the batch: no dependent blind writes.
    }
    return {outcomes,remainingIds:p.ids.slice(outcomes.length),note:'A batch is not atomic. Verified, acknowledged, blocked and unknown are different outcomes.'};
  });

  // Both roles inherit ordinary Pi authority. The optional outbox validates its own actions.


  async function humanReview(ctx,title,preview){
    assert(ctx.hasUI,'Human review requires an interactive Pi session; headless approval is denied');
    const returned=await ctx.ui.editor(`${title} — inspect; do not edit. Cancel to reject.`,preview);
    if(returned===undefined)return false;
    assert(returned===preview,'Preview changed. Revise the draft through the consultant and review the new version.');
    return ctx.ui.confirm(title,'Approve exactly the reviewed content and destinations?');
  }
  pi.registerCommand('hq',{description:'Consultant status, human approval and configuration review',handler:async(args,ctx)=>{
    try {
      const [op,...rest]=args.trim().split(/\s+/);
      if(op==='approve'){
        const pending=rest.length?await Promise.all(rest.map(i=>actions.get(i))):(await actions.list({ownerSession:sid(ctx)})).filter(a=>a.status==='draft');
        assert(pending.length,'No drafts to approve');
        if(!await humanReview(ctx,'Approve communication actions',reviewText(pending)))return;
        const approved=await actions.approve(pending.map(a=>a.id),sid(ctx),'interactive-human-review');
        // Only the consultant receives this result; source daily-driver sessions are never messaged.
        pi.sendUserMessage(`Human approved these exact actions: ${approved.map(a=>a.id).join(', ')}. Execute with hq_execute, verify and record. Do not ask again unless something material changes.`,{deliverAs:'followUp'});
      }else if(op==='reject'){
        assert(rest.length,'Specify action IDs');await actions.reject(rest,sid(ctx));ctx.ui.notify('Rejected. No external action was executed.','info');
      }else if(op==='policy-review'){
        const proposal=validatePolicy(await readJSON(path.join(stateRoot,'policy-proposal.json')));
        const preview=`Existing policy:\n${JSON.stringify(config.policy,null,2)}\n\nREPLACEMENT policy:\n${JSON.stringify(proposal,null,2)}\n\nRead classifications grant future reads without per-call approval. Verify exact names, accounts, mixed-operation constraints and filePointers. Writes still require approval.`;
        if(!await humanReview(ctx,'Approve connector policy',preview))return;
        config={...config,policy:proposal};await saveHQPolicy(configPath,proposal);ctx.ui.notify('Exact connector policy activated. No external calls were made.','info');
      }else if(op==='reconcile'){
        assert(rest.length===1,'Specify one uncertain action ID');const a=await actions.get(rest[0]);
        assert(ctx.hasUI,'Interactive human evidence required');const verdict=await ctx.ui.select('After checking remote evidence, what happened?',['leave unknown','verified','not_applied']);
        if(!verdict||verdict==='leave unknown')return;
        const evidence=await ctx.ui.editor('Paste remote evidence / link and your conclusion','');if(!evidence?.trim())return;
        if(await humanReview(ctx,'Reconcile uncertain outcome',`${a.id}\n${verdict}\n${evidence}`))await actions.reconcile(a.id,verdict,evidence,sid(ctx));
      }else{
        ctx.ui.notify(`Consultant: ${config.role}\nHQ: ${config.hq}\nPrivate records: ${stateRoot}\nStartup: local HQ resources; no role launcher required\nCase: ${selected?caseKey():'not yet selected'}\nSources: ${(config.sessionRoots??[]).length} explicit roots\n/hq approve [ids] · /hq reject <ids> · /hq policy-review · /hq reconcile <id>\nSaved-history consultation only. Both roles inherit ordinary Pi authority; the outbox is optional.`,'info');
      }
    }catch(e){ctx.ui?.notify?.(e.message,'error');}
  }});
  return {cases,actions,getConfig:()=>clone(config)};
}
