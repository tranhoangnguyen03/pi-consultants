import test from 'node:test';
import assert from 'node:assert/strict';
import {host} from './helpers.mjs';
test('Reference errors teach the full shape without writing; lifecycle returns exact recorded pointers',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});const caseKey='demo/one';
 await h.call('hq_navigate',{operation:'create',client:'demo',project:'one',title:'One',purpose:'Synthetic'});
 const before=await h.state.cases.read('demo','one');
 for(const input of [{workRefs:[]},{}])await assert.rejects(h.call('hq_navigate',{operation:'reference',caseKey,...input}),/caseKey,system,namespace,key,source/);
 assert.deepEqual(await h.state.cases.read('demo','one'),before);
 const e=(await h.call('hq_engagement',{operation:'start',caseKey,objective:'Synthetic'})).details.engagement;
 for(const operation of ['deliver','rework','close']){
  const r=(await h.call('hq_engagement',{operation,caseKey,id:e.id,basis:`synthetic ${operation}`,...(operation==='close'?{outcome:'user-stopped'}:{})})).details;
  const n=(await h.call('hq_navigate',{operation:'get',...r.recorded})).details;
  assert.equal(n.engagementId,e.id);assert.deepEqual(n.sources,[`synthetic ${operation}`]);assert.equal(r.engagement.recorded,undefined);
 }
});
