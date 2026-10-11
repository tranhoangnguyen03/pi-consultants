import test from 'node:test';
import assert from 'node:assert/strict';
import {host} from './helpers.mjs';
const note={kind:'feedback',state:'observed',text:'Synthetic feedback',sources:['user: fixture'],attribution:'driver'};
async function setup(t){const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});await h.call('hq_navigate',{operation:'create',client:'demo',project:'atlas',title:'Atlas',purpose:'Synthetic scope exercise'});const e=(await h.call('hq_engagement',{operation:'start',caseKey:'demo/atlas',objective:'Synthetic objective'})).details.engagement;return {h,e};}

test('Explicit case and engagement scopes persist the requested target without changing selection',async t=>{
 const {h,e}=await setup(t);
 const a=(await h.call('hq_note',{...note,scope:'case'})).details;
 assert.equal(a.engagementId,null);assert.equal(a.context.engagementId,e.id);
 const b=(await h.call('hq_note',{...note,scope:'engagement',engagementId:e.id})).details;
 assert.equal(b.engagementId,e.id);assert.equal(b.context.engagementId,e.id);
 await h.call('hq_engagement',{operation:'close',caseKey:'demo/atlas',id:e.id,outcome:'user-stopped',basis:'Synthetic user stop'});
 const before=await h.state.cases.read('demo','atlas');
 await assert.rejects(h.call('hq_note',note),/require scope/);
 assert.deepEqual(await h.state.cases.read('demo','atlas'),before);
 assert.equal((await h.call('hq_note',{...note,scope:'case'})).details.engagementId,null);
});
test('Invalid targeting fails before any record or association changes',async t=>{
 const {h,e}=await setup(t);const before=await h.state.cases.read('demo','atlas');
 for(const args of [{engagementId:'null'},{engagementId:'undefined'},{engagementId:''},{caseKey:''},{scope:'case',engagementId:e.id},{scope:'engagement'},{scope:'engagement',engagementId:'other-case-id'},{}]){
  await assert.rejects(h.call('hq_note',{...note,...args}));assert.deepEqual(await h.state.cases.read('demo','atlas'),before);
 }
 await assert.rejects(h.state.cases.note('demo','atlas',{...note,engagementId:''}),/Invalid engagementId/);
 await h.call('hq_engagement',{operation:'close',caseKey:'demo/atlas',id:e.id,outcome:'user-stopped',basis:'Synthetic user stop'});
 await assert.rejects(h.call('hq_note',{...note,scope:'engagement',engagementId:e.id}),/closed/);
});
test('Restored explicit scope preserves target checks; v2 null without scope is refused',async t=>{
 const {h,e}=await setup(t);await h.emit('session_start',{reason:'resume'});
 await assert.rejects(h.call('hq_note',{...note,scope:'case'}),/Restored case/);
 const a=(await h.call('hq_note',{...note,caseKey:'demo/atlas',scope:'case'})).details;assert.equal(a.engagementId,null);assert.equal(a.context.engagementId,e.id);
 await assert.rejects(h.call('hq_note',{...note,caseKey:'demo/atlas',engagementId:null}),/require scope/);
});
test('Get distinguishes incomplete pointers from valid missing-record lookups',async t=>{
 const {h,e}=await setup(t);
 await assert.rejects(h.call('hq_navigate',{operation:'get',id:'demo/atlas'}),/requires caseKey/);
 await assert.rejects(h.call('hq_navigate',{operation:'get',caseKey:'demo/atlas'}),/requires section/);
 await assert.rejects(h.call('hq_navigate',{operation:'get',caseKey:'demo/atlas',section:'engagement'}),/requires id/);
 assert.equal((await h.call('hq_navigate',{operation:'get',caseKey:'demo/atlas',section:'engagement',id:e.id})).details.id,e.id);
 assert.equal((await h.call('hq_navigate',{operation:'get',caseKey:'demo/atlas',section:'engagement',id:'missing'})).details.status,'missing');
});

test('Note directories filter case and engagement scope with usable pointers',async t=>{
 const {h,e}=await setup(t);
 await h.call('hq_note',{...note,scope:'case'});
 await h.call('hq_note',{...note,scope:'engagement',engagementId:e.id});
 for(const scope of ['case','engagement','all']){
  const r=(await h.call('hq_navigate',{operation:'get',caseKey:'demo/atlas',section:'notes',scope,...(scope==='engagement'?{engagementId:e.id}:{})})).details;
  assert.equal(r.total,scope==='all'?2:1);assert.equal(r.context.engagementId,e.id);
  for(const item of r.items){const saved=(await h.call('hq_navigate',{operation:'get',...item.pointer})).details;assert.equal(saved.id,item.id);if(scope==='case')assert.equal(saved.engagementId,null);if(scope==='engagement')assert.equal(saved.engagementId,e.id);}
 }
});
test('Invalid navigation combinations fail without changing selected context',async t=>{
 const {h,e}=await setup(t);
 for(const p of [{operation:'select',caseKey:'demo/atlas',query:'wrong'},{operation:'get',caseKey:'demo/atlas',section:'overview',id:e.id},{operation:'get',caseKey:'demo/atlas',section:'notes',scope:'engagement'},{operation:'get',caseKey:'demo/atlas',section:'papers',scope:'case'}])await assert.rejects(h.call('hq_navigate',p));
 const r=(await h.call('hq_navigate',{operation:'get',caseKey:'demo/atlas',section:'overview'})).details;assert.equal(r.context.caseKey,'demo/atlas');assert.equal(r.context.engagementId,e.id);
});
