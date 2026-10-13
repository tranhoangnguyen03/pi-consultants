import path from 'node:path';
import fs from 'node:fs/promises';
import {assert, atomic, locked, id, now, text, hash, redact, safeReal, slug}  from './util.mjs';

const recordKey=x=>`${x.at??x.createdAt??x.updatedAt??''}/${x.id}`;
const referenceEqual=(a,b)=>a.system===b.system&&a.namespace===b.namespace&&a.key===b.key;
function validReference(r){for(const field of ['system','namespace','key'])text(r[field],field,200);return r;}
const cleanNotes = c => c.notes.filter(n => !['checkpoint','session-consultation'].includes(n.kind));
const pointer = (c, section, recordId) => ({caseKey:`${c.client}/${c.project}`,section,...(recordId?{id:recordId}:{})});
export function keyParts(key) {
  assert(typeof key==='string' && key.split('/').length===2,'Use the caseKey returned by index: client/project');
  return key.split('/').map((part,i)=>slug(part,i?'project':'client'));
}
export function validateOperation(p) {
 const fields={batch:['pointers'],index:['query','limit','after'],get:['caseKey','section','id','offset','length','after','expectedRevision','contentRevision','query','scope','engagementId'],select:['caseKey'],create:['client','project','title','purpose','reviewToken','distinction','workspace','workRefs'],curate:['caseKey','expectedRevision','purpose','aliases','related'],reference:['caseKey','system','namespace','key','source'],resolve:['system','namespace','key','after','limit']};
 assert(fields[p.operation],`Unknown operation ${JSON.stringify(p.operation)}; use index, get, select, create, curate, reference or resolve`);
 const hint=p.operation==='reference'?'; use {operation:"reference",caseKey,system,namespace,key,source}, one reference per call; workRefs is for create':'';
 for(const key of Object.keys(p))assert(key==='operation'||fields[p.operation].includes(key),`${p.operation} does not accept ${key}; remove it or use the appropriate operation${hint}`);
 const required={batch:['pointers'],index:[],get:['caseKey','section'],select:['caseKey'],create:['client','project','title','purpose'],curate:['caseKey','expectedRevision','purpose'],reference:['caseKey','system','namespace','key','source'],resolve:['system','namespace','key']};
 for(const key of required[p.operation])assert(p[key]!==undefined&&p[key]!==null&&p[key]!=='',`${p.operation} requires ${key}${key==='caseKey'?'; id identifies a record inside caseKey, not the case itself':''}${hint}`);
}
export async function batch(store,{pointers}) {
 assert(Array.isArray(pointers)&&pointers.length>0&&pointers.length<=8,'batch requires 1..8 get pointers');
 assert(JSON.stringify(pointers).length<=4000,'Batch pointers exceed 4000 characters; use shorter valid locators or individual reads');
 for(const p of pointers){assert(p&&typeof p==='object'&&!Array.isArray(p),'Each pointer must be an object');assert(p.operation===undefined,'Pointers omit operation');validateOperation({...p,operation:'get'});}
 const results=[];let size=0;
 for(let i=0;i<pointers.length;i++){
  const p=pointers[i];let result;
  try{result={index:i,pointer:p,data:await get(store,p)};}
  catch{result={index:i,pointer:p,status:'unavailable',next:'Read this pointer individually for validation or recovery guidance.'};}
  const chars=JSON.stringify(result).length;
  if(chars>24000){result={index:i,pointer:p,status:'too-large',next:'Read this pointer individually with a narrower section or range.'};}
  if(size+JSON.stringify(result).length>24000)return {results,nextIndex:i,remaining:pointers.slice(i),coverage:'partial',reason:'aggregate-output-budget'};
  results.push(result);size+=JSON.stringify(result).length;
 }
 return {results,nextIndex:null,coverage:results.some(r=>r.status||['missing','unavailable','changed','too-large'].includes(r.data?.status))?'partial':'complete',consistency:'Independent reads, not an atomic snapshot; selection is unchanged.'};
}
export async function index(store,{query='',limit=12,after}={}) {
  assert(Number.isInteger(limit)&&limit>0&&limit<=30,'limit must be 1..30');
  const all=await store.list(); const entries=[];const warnings=[];
  for(const item of all) {
    if(item.error){warnings.push(item);continue;}
    try {
      const c=await store.read(item.client,item.project);
      const key=`${c.client}/${c.project}`;
      const fields={title:c.title,caseKey:key,purpose:c.navigation?.purpose??'',aliases:(c.navigation?.aliases??[]).join(' '),references:(c.workRefs??[]).map(r=>`${r.system} ${r.namespace} ${r.key}`).join(' '),workspaces:(c.workspaces??[]).join(' ')};
      const terms=query.toLowerCase().split(/\s+/).filter(Boolean);
      const matchedFields=Object.keys(fields).filter(k=>terms.some(t=>fields[k].toLowerCase().includes(t)));
      if(terms.length&&!matchedFields.length)continue;
      entries.push({caseKey:key,title:c.title,navigation:c.navigation??null,uncurated:!c.navigation,matchedFields,
        notes:cleanNotes(c).length,papers:(c.papers??[]).length,
        unfinished:(c.engagements??[]).filter(e=>e.state!=='closed').slice(0,3).map(e=>({objective:e.objective,state:e.state,pointer:pointer(c,'engagement',e.id)})),pointer:pointer(c,'overview')});
    }catch{warnings.push({caseKey:`${item.client}/${item.project}`,error:'unreadable'});}
  }
  entries.sort((a,b)=>a.caseKey<b.caseKey?-1:a.caseKey>b.caseKey?1:0);
  const page=[];let size=0;
  for(const entry of entries.filter(e=>!after||e.caseKey>after)){let e=entry;if(JSON.stringify(e).length>14000)e={caseKey:entry.caseKey,title:entry.title.slice(0,500),status:'metadata-too-large',pointer:entry.pointer,next:'Read this case overview explicitly; index metadata was not included.'};const bytes=JSON.stringify(e).length;if(page.length&&(page.length>=limit||size+bytes>16000))break;page.push(e);size+=bytes;}
  return {coverage:warnings.length?'partial':'complete',outcome:entries.length?'matched':all.length?'no_match':'empty',scanned:all.length,totalMatches:entries.length,entries:page,warnings:warnings.slice(0,30),warningCount:warnings.length,next:page.length&&entries.some(e=>e.caseKey>page.at(-1).caseKey)?page.at(-1).caseKey:null};
}
export async function overview(store,key) {
  const c=await store.read(...keyParts(key));
  return {caseKey:key,title:c.title,version:c.version,navigation:c.navigation??null,workRefs:(c.workRefs??[]).slice(0,4).map(r=>({id:r.id,system:r.system,namespace:r.namespace,key:r.key,pointer:pointer(c,'reference',r.id)})),workRefCount:(c.workRefs??[]).length,
    brief:{revision:c.revision,pointer:pointer(c,'brief')},directories:{references:pointer(c,'references'),notes:pointer(c,'notes'),papers:pointer(c,'papers'),engagements:pointer(c,'engagements')},

    engagementCount:(c.engagements??[]).length,
    engagements:(c.engagements??[]).slice(-12).map(e=>({id:e.id,objective:e.objective.slice(0,240),shortened:e.objective.length>240,state:e.state,pointer:pointer(c,'engagement',e.id)})),
    recordCount:cleanNotes(c).length,
    records:cleanNotes(c).slice(-12).map(n=>({kind:n.kind,state:n.state,at:n.at,attribution:n.attribution??null,engagementId:n.engagementId??null,supersedes:n.supersedes??null,preview:n.text.slice(0,160),shortened:n.text.length>160,pointer:pointer(c,'note',n.id)})),
    paperCount:(c.papers??[]).length,
    papers:(c.papers??[]).slice(-12).map(p=>({title:p.title,purpose:p.purpose,revision:p.revision,characters:p.body?.length??null,pointer:pointer(c,'paper',p.id)}))};
}
async function change(store,key,fn) {
 const [client,project]=keyParts(key);const dir=store.directory(client,project);
 return locked(dir,async()=>{const c=await store.read(client,project);assert(c.version===2,'Read-only legacy case: explicit upgrade required before new writes');const result=await fn(c);c.updatedAt=now();await atomic(path.join(dir,'case.json'),c);return result;});
}
export async function create(store,p) {
 text(p.purpose,'purpose',1200);text(p.title,'title',500);
 const key=`${p.client}/${p.project}`;store.directory(p.client,p.project);
 const refs=p.workRefs??[];assert(Array.isArray(refs)&&refs.length<=30,'Use at most 30 workRefs');refs.forEach(r=>{validReference(r);text(r.source,'source',2000);});
 if(p.workspace!==undefined)assert(path.isAbsolute(p.workspace),'workspace must be an absolute path');
 let workspace=null;
 if(p.workspace)try{workspace=await fs.realpath(p.workspace);}catch{throw new Error('Workspace must exist and be readable; omit workspace if not established');}
 return locked(store.root,async()=>{
  const listing=await index(store,{limit:30});const all=await store.list();const candidates=[];
  for(const a of all){if(a.error)continue;
   try{const c=await store.read(a.client,a.project);if(c.project===p.project||c.title.toLowerCase()===p.title.toLowerCase()||(c.navigation?.aliases??[]).some(x=>x.toLowerCase()===p.title.toLowerCase())||(workspace&&(c.workspaces??[]).includes(workspace))||refs.some(r=>(c.workRefs??[]).some(old=>referenceEqual(old,r)))) candidates.push({caseKey:`${c.client}/${c.project}`,title:c.title,purpose:c.navigation?.purpose??null,revision:c.navigation?.revision??0,workRefs:c.workRefs??[],workspaces:c.workspaces});}
   catch{listing.warnings.push({caseKey:`${a.client}/${a.project}`,error:'unreadable'});listing.coverage='partial';}
  }
  const warnings=new Map(all.filter(x=>x.error).map(x=>[x.caseKey,x]));
  for(const warning of listing.warnings)warnings.set(warning.caseKey,warning);
  listing.warnings=[...warnings.values()].sort((a,b)=>a.caseKey<b.caseKey?-1:1);listing.warningCount=listing.warnings.length;
  const token=hash({key,title:p.title,purpose:p.purpose,workspace,refs,candidates,warnings:listing.warnings});
  if(JSON.stringify({candidates,warnings:listing.warnings}).length>24000)return {created:false,status:'review_too_large',candidateCount:candidates.length,warningCount:listing.warningCount??listing.warnings.length,coverage:'partial',next:'Browse the paged index/reference matches and resolve overlap or unreadable cases before creating. No review token is issued for an undisplayed candidate set.'};
  if(candidates.some(c=>c.caseKey===key))return {created:false,status:'exists',candidates};
  if(p.distinction!==undefined)text(p.distinction,'distinction',2000);
  if((candidates.length||listing.warnings.length)&&(p.reviewToken!==token||!p.distinction?.trim()))return {created:false,status:'review_candidates',candidates,coverage:listing.coverage,warnings:listing.warnings,reviewToken:token,next:'Open an existing case, or repeat create with reviewToken and a meaningful distinction.'};
  return locked(store.directory(p.client,p.project),async()=>{
    try {await store.read(p.client,p.project);return {created:false,status:'exists',caseKey:key};}
    catch(e){if(!e.message.startsWith('No case '))throw e;}
    const c={version:2,client:p.client,project:p.project,title:p.title,revision:0,brief:'',workspaces:workspace?[workspace]:[],sessions:[],notes:[],createdAt:now(),updatedAt:now(),navigation:{purpose:p.purpose,aliases:[],revision:1,curatedAt:now()},workRefs:refs.map(r=>({...r,id:id(),at:now()})),engagements:[],papers:[],creationReview:{candidates,warnings:listing.warnings,distinction:p.distinction??null}};
    await atomic(path.join(store.directory(p.client,p.project),'case.json'),c);
    return {created:true,caseKey:key,pointer:pointer(c,'overview')};
  });
 });
}
export async function resolve(store,p) {
 validReference(p);const matches=[],warnings=[];
 const limit=p.limit??12;assert(Number.isInteger(limit)&&limit>0&&limit<=30,'limit must be 1..30');
 for(const item of await store.list()){
  if(item.error){warnings.push(item);continue;}
  try{const c=await store.read(item.client,item.project);if((c.workRefs??[]).some(r=>referenceEqual(r,p)))matches.push({caseKey:`${c.client}/${c.project}`,title:c.title,pointer:pointer(c,'overview')});}
  catch{warnings.push({caseKey:`${item.client}/${item.project}`,error:'unreadable'});}
 }
 matches.sort((a,b)=>a.caseKey<b.caseKey?-1:a.caseKey>b.caseKey?1:0);
 const available=matches.filter(m=>!p.after||m.caseKey>p.after),page=[];let chars=0;
 for(const match of available){const size=JSON.stringify(match).length;if(page.length&&(page.length>=limit||chars+size>16000))break;page.push(match);chars+=size;}
 return {coverage:warnings.length?'partial':'complete',totalMatches:matches.length,matches:page,next:available.length>page.length?page.at(-1).caseKey:null,warnings:warnings.slice(0,30),warningCount:warnings.length,meaning:'Exact system/namespace/key matches; no case was selected. Multiple matches require explicit selection.'};
}
export async function reference(store,p) {return change(store,p.caseKey,c=>{
 text(p.system,'system',100);text(p.namespace,'namespace',200);text(p.key,'key',200);text(p.source,'source',2000);c.workRefs??=[];
 const existing=c.workRefs.find(r=>r.system===p.system&&r.namespace===p.namespace&&r.key===p.key);
 if(existing)return existing;const ref={id:id(),system:p.system,namespace:p.namespace,key:p.key,source:p.source,at:now()};c.workRefs.push(ref);return ref;
});}
export async function curate(store,p,sessionId) {return change(store,p.caseKey,c=>{
 const revision=c.navigation?.revision??0;
 assert(p.expectedRevision===revision,`Navigation conflict: current revision ${revision}; get overview before retrying`);
 text(p.purpose,'purpose',1200);const aliases=p.aliases??c.navigation?.aliases??[];assert(Array.isArray(aliases)&&aliases.length<=12,'Use at most 12 aliases');aliases.forEach(a=>text(a,'alias',120));
 const related=p.related??c.navigation?.related??[];assert(Array.isArray(related)&&related.length<=12,'Use at most 12 related cases');related.forEach(r=>{keyParts(r.caseKey);text(r.reason,'related reason',300);});
 if(sessionId&&!c.sessions.includes(sessionId))c.sessions.push(sessionId);
 c.navigation={purpose:p.purpose,aliases,related,sessionId:sessionId??null,revision:revision+1,curatedAt:now()};return c.navigation;
});}
export async function get(store,p) {
 assert(typeof p.caseKey==='string'&&p.caseKey.length>0,`get requires caseKey (client/project); received caseKey=${JSON.stringify(p.caseKey)}, id=${JSON.stringify(p.id)}. id locates a record inside a case. Example: {operation:"get",caseKey:"demo/atlas",section:"overview"}`);
 assert(['overview','brief','references','reference','notes','papers','engagements','note','paper','engagement'].includes(p.section),'get requires section: overview, brief, notes, papers, engagements, note, paper or engagement');
 if(['note','paper','engagement','reference'].includes(p.section))assert(typeof p.id==='string'&&p.id.trim().length>0,`get section ${p.section} requires id from its returned pointer; caseKey alone is not a record ID`);
 if(p.section!=='notes')assert(p.scope===undefined&&p.engagementId===undefined,'scope and engagementId filters require section:"notes"');
 if(!['note','paper','engagement','reference'].includes(p.section))assert(p.id===undefined,`${p.section} does not accept id; use a singular record section for an ID`);
 assert(p.scope===undefined||['all','case','engagement'].includes(p.scope),'Note filter scope must be all, case or engagement');
 if(p.scope==='engagement')assert(typeof p.engagementId==='string'&&p.engagementId.trim().length>0,'Note filter scope:"engagement" requires engagementId');
 else assert(p.engagementId===undefined,'engagementId filter requires scope:"engagement"');
 const c=await store.read(...keyParts(p.caseKey));
 if(p.scope==='engagement')assert(c.engagements?.some(e=>e.id===p.engagementId),'engagementId filter is not an objective in this case');
 if(p.section==='overview')return overview(store,p.caseKey);
 if(['notes','papers','engagements','references'].includes(p.section)){
  const list=[...(p.section==='notes'?cleanNotes(c):p.section==='references'?c.workRefs??[]:c[p.section]??[])].sort((a,b)=>recordKey(a)<recordKey(b)?-1:recordKey(a)>recordKey(b)?1:0);
  const matches=list.filter(x=>(p.scope!=='case'||x.engagementId==null)&&(p.scope!=='engagement'||x.engagementId===p.engagementId)&&(!p.query||JSON.stringify(x).toLowerCase().includes(p.query.toLowerCase())));
  assert(!(p.after!==undefined&&p.offset!==undefined),'Use after OR offset, not both');
  const ordered=p.after?matches.filter(x=>`${x.at??x.createdAt??x.updatedAt??''}/${x.id}`>p.after):matches;
  const offset=p.offset??0,length=p.length??12;assert(Number.isInteger(offset)&&offset>=0&&Number.isInteger(length)&&length>0&&length<=30,'Directory range: offset >= 0, length 1..30');
  let used=0;const page=[];
  for(const x of ordered.slice(offset,offset+length)){const n=JSON.stringify(x.title??x.objective??x.text?.slice(0,160)??x.key??'').length+JSON.stringify(x.attribution??'').length+JSON.stringify(x.purpose??'').length+800;if(page.length&&used+n>16000)break;page.push(x);used+=n;}
  const count=page.length;
  return {scope:p.scope??'all',engagementId:p.engagementId??null,total:matches.length,consistency:'Per-case snapshot; subsequent pages may change. Refresh to see inserts before the cursor.',items:page.map(x=>({id:x.id,engagementId:x.engagementId??null,title:x.title??x.objective??x.text?.slice(0,160)??`${x.system}/${x.namespace}/${x.key}`,state:x.state,at:x.at??x.createdAt??x.updatedAt,attribution:x.attribution??null,supersedes:x.supersedes??null,shortened:!!x.text&&x.text.length>160,purpose:x.purpose,pointer:pointer(c,p.section==='notes'?'note':p.section==='papers'?'paper':p.section==='references'?'reference':'engagement',x.id)})),nextAfter:p.offset===undefined&&offset+count<ordered.length?recordKey(page.at(-1)):null,nextOffset:p.offset!==undefined&&offset+count<ordered.length?offset+count:null};
 }
 if(p.section==='brief'){
  const offset=p.offset??0,length=p.length??4000;assert(Number.isInteger(offset)&&offset>=0&&Number.isInteger(length)&&length>0&&length<=16000,'Brief range: offset >= 0, length 1..16000');
  if(p.expectedRevision!==undefined&&p.expectedRevision!==c.revision)return {status:'changed',revision:c.revision,next:{caseKey:p.caseKey,section:'brief',offset:0,expectedRevision:c.revision}};
  return {text:c.brief.slice(offset,offset+length),revision:c.revision,sources:c.briefSources??[],shortened:offset>0||offset+length<c.brief.length,nextOffset:offset+length<c.brief.length?offset+length:null};
 }
 const collection=p.section==='reference'?c.workRefs??[]:p.section==='note'?cleanNotes(c):p.section==='paper'?c.papers??[]:p.section==='engagement'?c.engagements??[]:null;
 assert(collection,'section must be overview, brief, note, paper or engagement');const record=collection.find(r=>r.id===p.id);
 if(!record)return {status:'missing',pointer:p,next:{caseKey:p.caseKey,section:'overview'}};
 if(p.section==='engagement')return {...record,records:{caseKey:p.caseKey,section:'notes',scope:'engagement',engagementId:record.id},caseGuidance:{caseKey:p.caseKey,section:'notes',scope:'case'}};
 if(p.section!=='paper')return record;
 let body=record.body,contentRevision=record.revision;
 if(record.file){
  try{const file=await safeReal(path.resolve(store.directory(c.client,c.project),record.file),[store.directory(c.client,c.project)]);const stat=await fs.stat(file);assert(stat.size<=1000000,'Private paper exceeds 1 MB read limit');body=redact(await fs.readFile(file,'utf8'));contentRevision=hash(body);}
  catch{return {status:'unavailable',pointer:pointer(c,'paper',record.id),reason:'Private file missing, unreadable, oversized or outside case directory'};}
 }
 const offset=p.offset??0,length=p.length??4000;assert(Number.isInteger(offset)&&offset>=0&&Number.isInteger(length)&&length>0&&length<=12000,'Invalid paper range');
 if(p.expectedRevision!==undefined&&p.expectedRevision!==record.revision)return {status:'changed',revision:record.revision,next:{...p,offset:0,expectedRevision:record.revision}};
 if(p.contentRevision!==undefined&&p.contentRevision!==contentRevision)return {status:'changed',revision:record.revision,contentRevision,next:{...p,offset:0,contentRevision}};
 const outline=[...body.matchAll(/^#{1,6} .+$/gm)].slice(0,40).map(m=>({heading:m[0].slice(0,160),offset:m.index}));
 return {...record,contentRevision,outline,body:body.slice(offset,offset+length),shortened:offset>0||offset+length<body.length,nextOffset:offset+length<body.length?offset+length:null};
}
export async function paper(store,p,sessionId) {return change(store,p.caseKey,async c=>{
 text(p.title,'title',200);text(p.purpose,'purpose',500);
 assert((p.body!==undefined)!==(p.file!==undefined),'Provide exactly one of body or private relative file');
 if(p.file!==undefined){text(p.file,'file',1000);assert(!p.file.split(/[\\/]/).some(x=>x.startsWith('.')||x==='case.json'||x.endsWith('.tmp')),'Paper file cannot name case storage or hidden paths');assert(!path.isAbsolute(p.file),'Paper file must be relative to its case directory');await safeReal(path.resolve(store.directory(c.client,c.project),p.file),[store.directory(c.client,c.project)]);}
 else text(p.body,'body',30000);c.papers??=[];
 const old=p.id?c.papers.find(x=>x.id===p.id):null;assert(!p.id||old,'Paper not found');assert(!old||p.expectedRevision===old.revision,`Paper conflict: current revision ${old?.revision}`);
 assert(c.papers.reduce((n,x)=>n+(x.body?.length??0),0)-(old?.body?.length??0)+(p.body?.length??0)<=150000,'Embedded paper budget exceeded; retain large working documents as private files instead');
 if(sessionId&&!c.sessions.includes(sessionId))c.sessions.push(sessionId);
 const value={id:old?.id??id(),title:p.title,purpose:p.purpose,...(p.file!==undefined?{file:p.file}:{body:redact(p.body)}),revision:(old?.revision??0)+1,sessionId,updatedAt:now()};
 if(old){delete old.body;delete old.file;Object.assign(old,value);}else c.papers.push(value);return {saved:pointer(c,'paper',value.id),revision:value.revision};
});}
export async function engage(store,p,sessionId) {return change(store,p.caseKey,c=>{
 c.engagements??=[];
 if(sessionId&&!c.sessions.includes(sessionId))c.sessions.push(sessionId);
 const workRefIds=p.workRefIds??[];assert(Array.isArray(workRefIds)&&workRefIds.length<=30,'Use at most 30 workRefIds');workRefIds.forEach(ref=>assert(c.workRefs.some(r=>r.id===ref),'Unknown workRefId in this case'));
 if(p.operation==='start') {text(p.objective,'objective',2000);if(p.doneCondition!==undefined)text(p.doneCondition,'doneCondition',2000);const e={id:id(),objective:redact(p.objective),mandate:redact(p.mandate===undefined?'':text(p.mandate,'mandate',2000)),doneCondition:p.doneCondition?redact(p.doneCondition):null,state:'open',workRefIds,sessions:[sessionId],createdAt:now()};c.engagements.push(e);return e;}
 const e=c.engagements.find(e=>e.id===p.id);assert(e,'Engagement not found');
 if(p.operation==='resume'){assert(e.state!=='closed','Closed work stays historical; start a new engagement');if(!e.sessions.includes(sessionId))e.sessions.push(sessionId);return e;}
 text(p.basis,'basis',4000);p={...p,basis:redact(p.basis)};assert(e.state!=='closed','Engagement already closed');
 if(!e.sessions.includes(sessionId))e.sessions.push(sessionId);
 const noteCount=c.notes.length;
 if(p.operation==='amend'){
  assert(e.state==='open','Use rework with the revision request before amending delivered work');
  assert(p.objective!==undefined||p.doneCondition!==undefined||p.mandate!==undefined||p.workRefIds!==undefined,'amend requires changed objective, mandate, doneCondition or workRefIds');
  const before={objective:e.objective,doneCondition:e.doneCondition,mandate:e.mandate,workRefIds:e.workRefIds??[]};
  if(p.workRefIds!==undefined)e.workRefIds=workRefIds;
  for(const field of ['objective','doneCondition','mandate'])if(p[field]!==undefined)e[field]=redact(text(p[field],field,2000));
  c.notes.push({id:id(),at:now(),kind:'decision',state:'observed',text:redact(`Scope amendment: ${JSON.stringify(before)} → ${JSON.stringify({objective:e.objective,doneCondition:e.doneCondition,mandate:e.mandate,workRefIds:e.workRefIds??[]})}`),sources:[p.basis],attribution:'consultant recorded scope change',writer:'consultant',sessionId,engagementId:e.id});
 }else if(p.operation==='rework'){assert(e.state==='delivered','Rework requires a delivered engagement');e.state='open';e.rework={basis:p.basis,at:now()};}
 else if(p.operation==='deliver'){e.state='delivered';e.delivery={basis:p.basis,at:now()};}
 else if(p.operation==='close'){assert(['met','user-stopped'].includes(p.outcome),'Closure requires met or user-stopped');if(p.outcome==='met')assert(e.doneCondition,'Successful closure requires a recorded done-condition');e.state='closed';e.closure={outcome:p.outcome,basis:p.basis,at:now()};}
 else throw new Error('Use start, resume, amend, rework, deliver or close');
 if(['deliver','rework','close'].includes(p.operation))c.notes.push({id:id(),at:now(),kind:'finding',state:'observed',text:`Engagement ${p.operation}: ${p.basis}`,sources:[p.basis],attribution:'consultant recorded lifecycle transition',writer:'consultant',sessionId:sessionId??null,engagementId:e.id});
 return {...e,...(c.notes.length>noteCount?{recorded:pointer(c,'note',c.notes.at(-1).id)}:{})};
});}
