import test from 'node:test';
import assert from 'node:assert/strict';
import {host} from './helpers.mjs';

const base={scope:'case',kind:'decision',state:'observed',sources:['fixture'],attribution:'user: synthetic'};
async function office(t){
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});
 await h.call('hq_navigate',{operation:'create',client:'demo',project:'atlas',title:'atlas',purpose:'Synthetic case'});
 await h.call('hq_navigate',{operation:'select',caseKey:'demo/atlas'});
 const ids=[];for(const text of ['Old A','Old B','Keep C'])ids.push((await h.call('hq_note',{...base,text})).details.id);
 return {h,ids};
}
const get=(h,p)=>h.call('hq_navigate',{operation:'get',caseKey:'demo/atlas',...p}).then(r=>r.details);

test('One consolidation note supersedes several; default views hide them, history and pointers keep them',async t=>{
 const {h,ids:[a,b,c]}=await office(t);
 const n=(await h.call('hq_note',{...base,text:'Consolidated A+B',supersedes:[a,b]})).details;
 assert.deepEqual(n.supersedes,[a,b]);
 const list=await get(h,{section:'notes'});
 assert.deepEqual(list.items.map(x=>x.id).sort(),[c,n.id].sort());assert.equal(list.includeSuperseded,false);
 const all=await get(h,{section:'notes',includeSuperseded:true});
 assert.equal(all.total,4);assert.deepEqual(all.items.find(x=>x.id===a).supersededBy,[n.id]);
 const ov=await get(h,{section:'overview'});
 assert.equal(ov.recordCount,2);assert.equal(ov.supersededCount,2);assert.equal(ov.history.includeSuperseded,true);
 assert(!ov.records.some(r=>[a,b].includes(r.pointer.id)));
 const old=await get(h,{section:'note',id:a});
 assert.equal(old.text,'Old A');assert.deepEqual(old.supersededBy,[n.id]);
 const idx=(await h.call('hq_navigate',{operation:'index'})).details.entries.find(e=>e.caseKey==='demo/atlas');
 assert.equal(idx.notes,2);
 const stored=await h.state.cases.read('demo','atlas');assert.equal(stored.notes.length,4);
});

test('Single supersession keeps the original string format and existing callers work',async t=>{
 const {h,ids:[a]}=await office(t);
 const n=(await h.call('hq_note',{...base,text:'Replaces A',supersedes:a})).details;
 assert.equal(n.supersedes,a);
 assert(!(await get(h,{section:'notes'})).items.some(x=>x.id===a));
});

test('Invalid supersession is refused before writing',async t=>{
 const {h,ids:[a]}=await office(t);
 for(const supersedes of [['missing'],[a,a],[''],[42]])
  await assert.rejects(h.call('hq_note',{...base,text:'Bad',supersedes}));
 assert.equal((await h.state.cases.read('demo','atlas')).notes.length,3);
 await assert.rejects(get(h,{section:'overview',includeSuperseded:true}));
 await assert.rejects(get(h,{section:'notes',includeSuperseded:'yes'}));
});
