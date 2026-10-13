import fs from 'node:fs/promises';
import path from 'node:path';
import {assert,object,text,canonical,clone,hash,id,now,atomic,locked,readJSON,pointer,resultData,checkAssertions,replaceReceiptTokens,safeReal} from './util.mjs';

const FINAL = new Set(['verified','acknowledged','unknown','blocked','rejected','not_applied']);
export function validatePolicy(policy) {
  object(policy,'tool policy');
  for(const [name,rule] of Object.entries(policy)) {
    text(name,'tool name',300); assert(name.startsWith('mcp__'),'Only native MCP tool names may enter the external policy; shell and internal tools cannot be granted through it'); object(rule);
    assert(['read','write','deny'].includes(rule.effect), `Invalid effect for ${name}`);
    if(rule.effect!=='deny') { text(rule.service,'service',100);text(rule.account,'account',200); }
    if(rule.constraints) {
      object(rule.constraints);
      for(const [p,values] of Object.entries(rule.constraints)) { pointer({},p);assert(Array.isArray(values)&&values.length,'Constraint must enumerate allowed exact values'); }
    }
  }
  return policy;
}
export function ruleFor(policy,tool,args,effect) {
  const r=policy[tool]; assert(r && r.effect===effect, `${tool} is not explicitly classified as ${effect}`);
  for(const [p,allowed] of Object.entries(r.constraints??{})) {
    const v=pointer(args,p); assert(v!==undefined && allowed.some(a=>canonical(a)===canonical(v)), `Argument policy failed at ${p}`);
  }
  return r;
}
function checkSpec(spec,policy) {
  if(!spec) return;
  object(spec);object(spec.args,'readback args');ruleFor(policy,spec.tool,spec.args,'read');
  assert(Array.isArray(spec.assertions)&&spec.assertions.length,'Preflight/verification requires explicit assertions');
  for(const a of spec.assertions) { pointer({},a.path);assert(Object.hasOwn(a,'equals'),'Missing expected readback value'); }
}
export function actionDigest(a) {
  return hash({tool:a.tool,args:a.args,service:a.service,account:a.account,policy:a.policy,
    preflight:a.preflight??null,verify:a.verify??null,files:a.files??[]});
}

export class ActionStore {
  constructor(root,{ttlMs=30*60*1000,clock=()=>Date.now(),fileRoots=[]}={}) {
    assert(path.isAbsolute(root),'Outbox root must be absolute');this.root=root;this.file=path.join(root,'outbox.json');this.ttlMs=ttlMs;this.clock=clock;this.fileRoots=fileRoots;
  }
  async state() { const s=await readJSON(this.file,{version:1,actions:[]});assert(s.version===1 && Array.isArray(s.actions),'Unsupported outbox');return s; }
  async tx(fn) { return locked(this.root,async()=>{const s=await this.state();const result=await fn(s);await atomic(this.file,s);return clone(result);}); }
  async get(actionId) { const a=(await this.state()).actions.find(a=>a.id===actionId);assert(a,'Action not found');return a; }
  async list({caseKey,ownerSession}={}) { return (await this.state()).actions.filter(a=>(!caseKey||a.caseKey===caseKey)&&(!ownerSession||a.ownerSession===ownerSession)); }
  async prepare({tool,args,purpose,destination,caseKey,ownerSession,preflight,verify,repeatOf},policy) {
    object(args,'tool arguments');text(purpose,'communication purpose',2000);text(destination,'destination',2000);text(caseKey,'caseKey',200);text(ownerSession,'session',200);
    assert(canonical(args).length<200000,'Action payload too large for full human review');
    const rule=ruleFor(policy,tool,args,'write');checkSpec(preflight,policy);checkSpec(verify,policy);
    const files=[];
    for(const p of rule.filePointers??[]) {
      const name=pointer(args,p);text(name,'attachment path',4000);
      const real=await safeReal(name,this.fileRoots);const stat=await fs.stat(real);
      assert(stat.isFile() && stat.size<=128*1024*1024,'Attachment not a regular bounded file');
      files.push({pointer:p,path:real,sha256:hash(await fs.readFile(real)),bytes:stat.size});
    }
    const policyBinding={write:clone(rule),preflight:preflight?clone(policy[preflight.tool]):null,verify:verify?clone(policy[verify.tool]):null};
    const draft={id:id(),createdAt:now(),status:'draft',tool,args:clone(args),purpose,destination,caseKey,ownerSession,
      service:rule.service,account:rule.account,policy:policyBinding,files,preflight:preflight??null,verify:verify??null,history:[]};
    draft.digest=actionDigest(draft);
    return this.tx(s=>{
      const previous=s.actions.filter(a=>a.caseKey===caseKey && a.digest===draft.digest).at(-1);
      if(previous) {
        if(!repeatOf) return {...previous,duplicate:true};
        assert(previous.id===repeatOf,'repeatOf must identify the last identical action');
        assert(['verified','acknowledged','not_applied','blocked','rejected'].includes(previous.status),'Cannot repeat an unresolved or in-flight action');
        draft.repeatOf=repeatOf;
      }
      draft.history.push({event:'prepared',at:now()});s.actions.push(draft);return draft;
    });
  }
  async approve(ids,ownerSession,evidence) {
    assert(evidence==='interactive-human-review','Approval requires the human review boundary');
    assert(Array.isArray(ids)&&ids.length&&new Set(ids).size===ids.length,'Invalid approval batch');
    return this.tx(s=>{
      const actions=ids.map(i=>{const a=s.actions.find(x=>x.id===i);assert(a?.status==='draft','Only an unchanged draft can be approved');assert(a.ownerSession===ownerSession,'Approval belongs to another consultation');assert(a.digest===actionDigest(a),'Draft changed');return a;});
      for(const a of actions){a.status='approved';a.approvedAt=new Date(this.clock()).toISOString();a.expiresAt=new Date(this.clock()+this.ttlMs).toISOString();a.history.push({event:'human-approved',at:a.approvedAt,digest:a.digest});}
      return actions;
    });
  }
  async reject(ids,ownerSession) { return this.tx(s=>ids.map(i=>{const a=s.actions.find(x=>x.id===i);assert(a&&a.ownerSession===ownerSession,'Wrong action owner');assert(['draft','approved'].includes(a.status),'Cannot reject an executed action');a.status='rejected';a.history.push({event:'human-rejected',at:now()});return a;})); }
  async begin(actionId,ownerSession,policy) {
    return this.tx(s=>{
      const a=s.actions.find(x=>x.id===actionId);assert(a,'Unknown action');
      assert(a.status==='approved','Action is not approved or has already been consumed; no automatic replay');
      assert(a.ownerSession===ownerSession,'Approval cannot transfer to another session');
      assert(Date.parse(a.expiresAt)>this.clock(),'Approval expired; prepare a revised action');
      assert(a.digest===actionDigest(a),'Approved action was changed');
      const current={write:ruleFor(policy,a.tool,a.args,'write'),preflight:a.preflight?policy[a.preflight.tool]:null,verify:a.verify?policy[a.verify.tool]:null};
      assert(canonical(current)===canonical(a.policy),'Tool/account policy changed after approval');
      a.status='in_flight';a.startedAt=now();a.history.push({event:'execution-claimed',at:a.startedAt});return a;
    });
  }
  async finish(actionId,status,receipt) {
    assert(FINAL.has(status),'Invalid action outcome');
    return this.tx(s=>{const a=s.actions.find(x=>x.id===actionId);assert(a?.status==='in_flight','Action has no active claim');
      a.status=status;a.receipt=clone(receipt);a.finishedAt=now();a.history.push({event:status,at:a.finishedAt});return a;});
  }
  async reconcile(actionId,verdict,evidence,ownerSession) {
    assert(['verified','not_applied'].includes(verdict),'Unsupported reconciliation');text(evidence,'reconciliation evidence',8000);
    assert(/^[a-zA-Z0-9_-]+$/.test(actionId),'Invalid action ID');
    return locked(path.join(this.root,`execution-${actionId}`),()=>this.tx(s=>{const a=s.actions.find(x=>x.id===actionId);assert(a && a.ownerSession===ownerSession,'Wrong action owner');assert(['unknown','in_flight','acknowledged'].includes(a.status),'Nothing uncertain to reconcile');
      a.status=verdict;a.history.push({event:'human-reconciled',at:now(),verdict,evidence});return a;}));
  }
}

export function reviewText(actions) {
  return actions.map((a,i)=>`ACTION ${i+1} / ${actions.length}\nID: ${a.id}\nPurpose: ${a.purpose}\nDestination (human label): ${a.destination}\nActual account: ${a.account}\nService: ${a.service}\nTool: ${a.tool}\nCase: ${a.caseKey}\nSHA256: ${a.digest}\n\nEXACT ARGUMENTS (authoritative destination and content):\n${JSON.stringify(a.args,null,2)}\n\nATTACHMENT FINGERPRINTS (not copied bytes):\n${JSON.stringify(a.files,null,2)}\n\nPREFLIGHT:\n${JSON.stringify(a.preflight,null,2)}\n\nVERIFICATION:\n${JSON.stringify(a.verify,null,2)}\n${a.repeatOf?`\nIntentional repeat of ${a.repeatOf}\n`:''}`).join('\n\n==============================\n\n');
}

/** Only this executor makes approved writes. Host integration supplies a pipeline-aware invoke(). */
export async function executeAction(store,actionId,ownerSession,policy,invoke,{signal,onClaim}={}) {
  assert(/^[a-zA-Z0-9_-]+$/.test(actionId),'Invalid action ID');
  return locked(path.join(store.root,`execution-${actionId}`),async()=>{
  const a=await store.begin(actionId,ownerSession,policy);onClaim?.();
  let wrote=false;let raw;
  try {
    for(const file of a.files){assert(hash(await fs.readFile(file.path))===file.sha256,'Attachment changed after approval');}
    if(signal?.aborted) throw new Error('Cancelled before execution');
    if(a.preflight){const r=await invoke(a.preflight.tool,a.preflight.args,'read',a);assert(!r?.isError,'Preflight read failed');const checks=checkAssertions(resultData(r),a.preflight.assertions);assert(checks.every(x=>x.passed),'Current state no longer matches approved preconditions');}
    wrote=true;
    raw=await invoke(a.tool,a.args,'write',a);
    if(raw?.isError) throw new Error('Provider returned an error; side effects must be checked before retrying');
    const data=resultData(raw);
    const receipt={providerResult:data,providerResultHash:hash(data),verification:'not-configured'};
    if(!a.verify) return await store.finish(a.id,'acknowledged',receipt);
    const args=replaceReceiptTokens(a.verify.args,data);
    const readback=await invoke(a.verify.tool,args,'read',a);assert(!readback?.isError,'Readback returned an error');
    const evidence=resultData(readback);const checks=checkAssertions(evidence,a.verify.assertions);
    receipt.verification=checks.every(c=>c.passed)?'passed':'mismatch';receipt.checks=checks;receipt.readback=evidence;
    return await store.finish(a.id,checks.every(c=>c.passed)?'verified':'unknown',receipt);
  } catch(e) {
    return store.finish(a.id,wrote?'unknown':'blocked',{error:e.message,providerResult:raw?resultData(raw):null,
      instruction:wrote?'Do not retry automatically. Inspect remote state, then reconcile.':'No write invoked. Resolve the condition, prepare again, and obtain approval.'});
  }
  });
}
