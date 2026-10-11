import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {host} from './helpers.mjs';

// Requirements: omissions have recovery pointers, undisplayed creation candidates
// cannot authorize creation, and every batch/page accounts for all requested work.
const office = t => host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});
const ref = {system:'tracker',namespace:'synthetic-org',key:'ISSUE/42'};
const serialized = value => JSON.stringify(value).length;
const navigate = async (h,p) => (await h.call('hq_navigate',p)).details;
async function seed(h,project,extra={}) {
 const dir=h.state.cases.directory('synthetic',project);
 await fs.mkdir(dir,{recursive:true});
 const c={version:2,client:'synthetic',project,title:project,revision:0,brief:'',workspaces:[],sessions:[],notes:[],papers:[],engagements:[],workRefs:[],createdAt:'2026-10-01T00:00:00Z',updatedAt:'2026-10-01T00:00:00Z',navigation:{purpose:'Synthetic retrieval fixture',aliases:[],revision:1},...extra};
 await fs.writeFile(path.join(dir,'case.json'),JSON.stringify(c));
 return `synthetic/${project}`;
}

test('Oversized index metadata is explicitly omitted, pointed to, and paged without losing cases',async t=>{
 const h=await office(t);const keys=[];
 for(const project of ['a-x','a_x','z'])keys.push(await seed(h,project,{navigation:{purpose:'x'.repeat(30000),aliases:[],revision:1}}));
 const seen=[];let after;
 for(let pages=0;;pages++){
  assert.ok(pages<keys.length+1,'index cursor must make progress');
  const r=await navigate(h,{operation:'index',limit:1,...(after?{after}:{})});
  assert.equal(r.totalMatches,keys.length);assert.equal(r.outcome,'matched');
  assert.ok(serialized(r)<24000,'oversized metadata must not escape into output');
  assert.equal(r.entries.length,1);
  const entry=r.entries[0];assert.equal(entry.status,'metadata-too-large');
  assert.deepEqual(entry.pointer,{caseKey:entry.caseKey,section:'overview'});
  assert.ok(entry.next,'metadata omission needs recovery guidance');
  assert.equal((await navigate(h,{operation:'get',...entry.pointer})).navigation.purpose.length,30000);
  seen.push(entry.caseKey);if(!r.next)break;
  assert.equal(r.next,entry.caseKey);after=r.next;
 }
 assert.deepEqual(seen,keys.sort());assert.equal(new Set(seen).size,keys.length);
});

test('Index aggregate budget paginates individually valid metadata without silent omission',async t=>{
 const h=await office(t);const keys=[];
 for(let i=0;i<5;i++)keys.push(await seed(h,`page-${i}`,{
  navigation:{purpose:'p'.repeat(1200),aliases:Array.from({length:12},(_,j)=>`${j}`+'a'.repeat(118)),revision:1},
  engagements:Array.from({length:3},(_,j)=>({id:`e-${j}`,objective:'o'.repeat(2000),state:'open'}))
 }));
 const seen=[];let after;
 for(let pages=0;;pages++){
  assert.ok(pages<keys.length+1);
  const r=await navigate(h,{operation:'index',limit:30,...(after?{after}:{})});
  assert.ok(r.entries.length>0&&r.entries.length<keys.length);
  assert.ok(r.entries.reduce((n,e)=>n+serialized(e),0)<=16000);
  assert.ok(serialized(r)<24000);
  assert.equal(r.totalMatches,keys.length);
  seen.push(...r.entries.map(e=>e.caseKey));if(!r.next)break;
  assert.equal(r.next,r.entries.at(-1).caseKey);after=r.next;
 }
 assert.deepEqual(seen,keys);
});

for(const shape of ['one oversized candidate','many bounded candidates'])test(`Creation refuses ${shape} without a token or a case write`,async t=>{
 const h=await office(t);const count=shape.startsWith('one')?1:25;
 for(let i=0;i<count;i++)await seed(h,`candidate-${i}`,{title:'Shared identity',navigation:{purpose:'p'.repeat(count===1?30000:1200),aliases:[],revision:1}});
 const input={operation:'create',client:'synthetic',project:'new-case',title:'Shared identity',purpose:'A distinct synthetic proposal'};
 for(const attempt of [input,{...input,reviewToken:'an-undisplayed-set-cannot-be-approved',distinction:'Different synthetic scope'}]){
  const r=await navigate(h,attempt);
  assert.equal(r.status,'review_too_large');assert.equal(r.created,false);
  assert.equal(r.candidateCount,count);assert.equal(r.coverage,'partial');
  assert.equal(Object.hasOwn(r,'reviewToken'),false);
  assert.equal(Object.hasOwn(r,'candidates'),false);
  assert.ok(r.next);assert.ok(serialized(r)<24000);
  await assert.rejects(fs.access(path.join(h.state.cases.directory('synthetic','new-case'),'case.json')),{code:'ENOENT'});
  assert.equal((await h.state.cases.list()).length,count);
 }
});

test('Oversized creation review reports the full unreadable-case count',async t=>{
 const h=await office(t);
 await seed(h,'candidate',{title:'Shared identity',navigation:{purpose:'p'.repeat(30000),aliases:[],revision:1}});
 for(let i=0;i<35;i++){
  const dir=h.state.cases.directory('synthetic',`unreadable-${i}`);await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'case.json'),'{invalid synthetic JSON');
 }
 const r=await navigate(h,{operation:'create',client:'synthetic',project:'new-case',title:'Shared identity',purpose:'Synthetic proposal'});
 assert.equal(r.status,'review_too_large');assert.equal(r.created,false);assert.equal(r.candidateCount,1);
 assert.equal(Object.hasOwn(r,'reviewToken'),false);
 assert.equal(r.warningCount,35,'bounded warning details must not reduce the reported coverage gap');
});

test('Batch aggregate budget preserves order and every remaining pointer across retries',async t=>{
 const h=await office(t);const key=await seed(h,'batch');
 await navigate(h,{operation:'select',caseKey:key});
 const pointers=[];
 for(let i=0;i<4;i++){
  const n=(await h.call('hq_note',{scope:'case',kind:'finding',state:'observed',text:`${i}:`+'x'.repeat(14900),sources:[],attribution:'synthetic'})).details;
  pointers.push({caseKey:key,section:'note',id:n.id});
 }
 const seen=[];let pending=pointers;
 for(let calls=0;pending.length;calls++){
  assert.ok(calls<pointers.length+1,'batch continuation must make progress');
  const r=await navigate(h,{operation:'batch',pointers:pending});
  assert.ok(r.results.length>0);
  assert.ok(r.results.reduce((n,x)=>n+serialized(x),0)<=24000);
  assert.equal(r.context.caseKey,key);assert.equal(r.context.selectionSource,'explicit');
  r.results.forEach((result,i)=>{
   assert.equal(result.index,i);assert.deepEqual(result.pointer,pending[i]);
   assert.equal(result.data.id,pending[i].id);seen.push(result.data.id);
  });
  if(r.remaining){
   assert.equal(r.coverage,'partial');assert.equal(r.reason,'aggregate-output-budget');
   assert.equal(r.nextIndex,r.results.length);assert.deepEqual(r.remaining,pending.slice(r.nextIndex));
  }else{assert.equal(r.coverage,'complete');assert.equal(r.nextIndex,null);}
  pending=r.remaining??[];
 }
 assert.deepEqual(seen,pointers.map(p=>p.id));
});

test('One oversized batch result is explicit and does not block later readable pointers',async t=>{
 const h=await office(t);const key=await seed(h,'large-note');
 await navigate(h,{operation:'select',caseKey:key});
 const note=(await h.call('hq_note',{scope:'case',kind:'finding',state:'observed',text:'Synthetic finding',sources:Array.from({length:13},(_,i)=>`${i}:`+'s'.repeat(1990)),attribution:'synthetic'})).details;
 const pointers=[{caseKey:key,section:'note',id:note.id},{caseKey:key,section:'brief'}];
 const r=await navigate(h,{operation:'batch',pointers});
 assert.equal(r.coverage,'partial');assert.equal(r.results.length,2);assert.equal(r.nextIndex,null);
 assert.equal(r.results[0].status,'too-large');assert.deepEqual(r.results[0].pointer,pointers[0]);
 assert.equal(Object.hasOwn(r.results[0],'data'),false);assert.ok(r.results[0].next);
 assert.equal(r.results[1].data.text,'');assert.ok(serialized(r)<24000);
});

test('Batch reports unavailable case reads as partial and still reads subsequent pointers',async t=>{
 const h=await office(t);const key=await seed(h,'available');
 const pointers=[{caseKey:'synthetic/missing',section:'overview'},{caseKey:key,section:'brief'}];
 const r=await navigate(h,{operation:'batch',pointers});
 assert.equal(r.coverage,'partial');assert.equal(r.results.length,2);
 assert.equal(r.results[0].status,'unavailable');assert.deepEqual(r.results[0].pointer,pointers[0]);
 assert.equal(r.results[1].data.text,'');assert.equal(r.nextIndex,null);
});

test('Batch accepts eight small pointers and rejects empty or over-limit batches',async t=>{
 const h=await office(t);const key=await seed(h,'eight');
 const pointer={caseKey:key,section:'brief'};
 const r=await navigate(h,{operation:'batch',pointers:Array(8).fill(pointer)});
 assert.equal(r.results.length,8);assert.equal(r.coverage,'complete');assert.equal(r.nextIndex,null);
 assert.deepEqual(r.results.map(x=>x.index),[0,1,2,3,4,5,6,7]);
 for(const pointers of [[],Array(9).fill(pointer)])await assert.rejects(navigate(h,{operation:'batch',pointers}),/1\.\.8/);
});

test('An oversized batch pointer cannot cause a retry with no progress',async t=>{
 const h=await office(t);const key=await seed(h,'large-pointer');let r;
 // Rejecting an oversized input is also acceptable; endlessly requeueing it is not.
 try{r=await navigate(h,{operation:'batch',pointers:[{caseKey:key,section:'note',id:'x'.repeat(25000)}]});}
 catch(e){assert.match(e.message,/pointer|\bid\b|large|length|limit|budget/i);return;}
 assert.ok(r.results.length>0||!r.remaining?.length,'one pointer must either finish or be rejected, not return unchanged at nextIndex 0');
 assert.ok(serialized(r)<=24000,'oversized input must not be echoed outside the shared output budget');
});

test('Batch with a missing record does not claim complete retrieval',async t=>{
 const h=await office(t);const key=await seed(h,'missing-record');
 const r=await navigate(h,{operation:'batch',pointers:[{caseKey:key,section:'note',id:'not-a-record'},{caseKey:key,section:'brief'}]});
 assert.equal(r.results[0].data.status,'missing');assert.equal(r.results[1].data.text,'');
 assert.equal(r.coverage,'partial','a missing record is not complete retrieval');
});

test('Batch with an unavailable private paper does not claim complete retrieval',async t=>{
 const h=await office(t);const key=await seed(h,'missing-paper',{papers:[{id:'paper-one',title:'Synthetic paper',purpose:'Synthetic missing file',file:'absent.md',revision:1}]});
 const r=await navigate(h,{operation:'batch',pointers:[{caseKey:key,section:'paper',id:'paper-one'},{caseKey:key,section:'brief'}]});
 assert.equal(r.results[0].data.status,'unavailable');assert.equal(r.results[1].data.text,'');
 assert.equal(r.coverage,'partial','an unreadable paper is not complete retrieval');
});

test('Exact-reference pages cover every match once, respect identity, and leave selection unchanged',async t=>{
 const h=await office(t);const expected=[];
 for(const project of ['a-x','a_x','b','c','d','e','f'])expected.push(await seed(h,project,{workRefs:[{...ref,id:'r1'},{...ref,id:'r2'}]}));
 for(const [field,value] of [['system','other'],['namespace','other'],['key','ISSUE/420']])await seed(h,`near-${field}`,{workRefs:[{...ref,[field]:value}]});
 await navigate(h,{operation:'select',caseKey:expected[0]});
 const seen=[];let after;
 for(let pages=0;;pages++){
  assert.ok(pages<expected.length+1,'reference cursor must make progress');
  const r=await navigate(h,{operation:'resolve',...ref,limit:2,...(after?{after}:{})});
  assert.equal(r.coverage,'complete');assert.equal(r.totalMatches,expected.length);
  assert.ok(r.matches.length>0&&r.matches.length<=2);assert.ok(serialized(r)<24000);
  assert.equal(r.context.caseKey,expected[0]);assert.equal(r.context.selectionSource,'explicit');
  for(const match of r.matches){seen.push(match.caseKey);assert.deepEqual(match.pointer,{caseKey:match.caseKey,section:'overview'});}
  if(!r.next)break;assert.equal(r.next,r.matches.at(-1).caseKey);after=r.next;
 }
 assert.deepEqual(seen,expected.sort());assert.equal(new Set(seen).size,expected.length);
 const tail=await navigate(h,{operation:'resolve',...ref,after:seen.at(-1),limit:2});
 assert.deepEqual(tail.matches,[]);assert.equal(tail.next,null);assert.equal(tail.totalMatches,expected.length);
});

test('Reference pages disclose all unreadable-case counts even when warning details are bounded',async t=>{
 const h=await office(t);
 for(const project of ['one','two','three'])await seed(h,project,{workRefs:[ref]});
 for(let i=0;i<35;i++){
  const dir=h.state.cases.directory('synthetic',`unreadable-${i}`);await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'case.json'),'{invalid synthetic JSON');
 }
 let after;let count=0;
 for(let pages=0;;pages++){
  assert.ok(pages<4);
  const r=await navigate(h,{operation:'resolve',...ref,limit:1,...(after?{after}:{})});
  assert.equal(r.coverage,'partial');assert.equal(r.warningCount,35);assert.equal(r.warnings.length,30);
  assert.equal(r.totalMatches,3);count+=r.matches.length;assert.ok(serialized(r)<24000);
  if(!r.next)break;after=r.next;
 }
 assert.equal(count,3);
});

test('Creation review token changes when an unreadable case beyond thirty is added',async t=>{
 const h=await office(t);
 for(let i=0;i<35;i++){const dir=h.state.cases.directory('synthetic',`bad-${i}`);await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'case.json'),'{broken');}
 const request={operation:'create',client:'synthetic',project:'new',title:'New',purpose:'Synthetic'};
 const before=await navigate(h,request);assert.equal(before.warnings.length,35);
 const dir=h.state.cases.directory('synthetic','bad-extra');await fs.mkdir(dir);await fs.writeFile(path.join(dir,'case.json'),'{broken');
 const after=await navigate(h,{...request,reviewToken:before.reviewToken,distinction:'Explicit uncertainty'});
 assert.equal(after.created,false);assert.notEqual(after.reviewToken,before.reviewToken);assert.equal(after.warnings.length,36);
});
test('Maximal ordinary objectives and references remain paged and individually retrievable',async t=>{
 const h=await office(t);const key=await seed(h,'large');
 for(let i=0;i<12;i++)await h.call('hq_engagement',{operation:'start',caseKey:key,objective:'x'.repeat(2000)});
 for(let i=0;i<50;i++)await navigate(h,{operation:'reference',caseKey:key,system:'s'.repeat(100),namespace:'n'.repeat(200),key:`${i}`+'k'.repeat(190),source:'s'.repeat(2000)});
 const overview=await navigate(h,{operation:'get',caseKey:key,section:'overview'});assert.equal(overview.workRefCount,50);assert.ok(serialized(overview)<24000);
 for(const section of ['engagements','references']){let after;const seen=new Set();do{const page=await navigate(h,{operation:'get',caseKey:key,section,length:30,...(after?{after}:{})});assert.ok(serialized(page)<24000);for(const item of page.items){assert.equal(seen.has(item.id),false);seen.add(item.id);assert.equal((await navigate(h,{operation:'get',...item.pointer})).id,item.id);}after=page.nextAfter;}while(after);assert.equal(seen.size,section==='references'?50:12);}
});
