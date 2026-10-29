import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {host} from './helpers.mjs';

const call=async(h,name,p)=>(await h.call(name,p)).details;
async function setup(t){
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});
 for(const project of ['one','two'])await call(h,'hq_navigate',{operation:'create',client:'demo',project,title:project,purpose:`Synthetic ${project}`});
 return h;
}
test('Find shares legacy search, pagination and coverage without changing state',async t=>{
 const h=await setup(t);
 assert.deepEqual(Object.keys(h.tools.get('hq_find').parameters.properties),['query','limit','after']);
 for(const selection of ['none','explicit','restored']){
  if(selection==='explicit')await call(h,'hq_engagement',{operation:'start',caseKey:'demo/one',objective:'Synthetic'});
  if(selection==='restored')await h.emit('session_start',{});
  const before=await Promise.all(['one','two'].map(p=>fs.readFile(path.join(h.state.cases.directory('demo',p),'case.json'),'utf8')));
  const entries=structuredClone(h.entries);
  const p={query:'two',limit:1};
  const found=await call(h,'hq_find',p);
  assert.deepEqual(found,await call(h,'hq_navigate',{operation:'index',...p}));
  assert.deepEqual(found.entries.map(e=>e.caseKey),['demo/two']);
  assert.equal(found.context.targetCaseKey,null);
  assert.equal(found.context.selectionSource,selection);
  assert.equal(found.context.caseKey,selection==='none'?null:'demo/one');
  assert.deepEqual(h.entries,entries);
  assert.deepEqual(await Promise.all(['one','two'].map(p=>fs.readFile(path.join(h.state.cases.directory('demo',p),'case.json'),'utf8'))),before);
  assert.deepEqual(p,{query:'two',limit:1});
 }
 const first=await call(h,'hq_find',{limit:1});
 const second=await call(h,'hq_find',{limit:1,after:first.next});
 assert.deepEqual([...first.entries,...second.entries].map(e=>e.caseKey),['demo/one','demo/two']);
 assert.equal((await call(h,'hq_find',{query:'absent'})).outcome,'no_match');
});
test('Discovery and batch targets are separate from selection; addressed reads retain their target',async t=>{
 const h=await setup(t);await call(h,'hq_navigate',{operation:'select',caseKey:'demo/one'});
 for(const p of [{operation:'resolve',system:'fixture',namespace:'demo',key:'missing'},{operation:'batch',pointers:[{caseKey:'demo/two',section:'overview'}]}]){
  const r=await call(h,'hq_navigate',p);assert.equal(r.context.targetCaseKey,null);assert.equal(r.context.caseKey,'demo/one');
 }
 const r=await call(h,'hq_navigate',{operation:'get',caseKey:'demo/two',section:'overview'});
 assert.equal(r.context.targetCaseKey,'demo/two');assert.equal(r.context.caseKey,'demo/one');
});
test('Legacy padding is rejected together with recovery; find never discards meaningful extras',async t=>{
 const h=await setup(t);
 const padded={operation:'index',query:'synthetic',caseKey:'',aliases:[],scope:'case',includeSuperseded:false,offset:0,length:1000,expectedRevision:0};
 const before=structuredClone(padded);
 await assert.rejects(h.call('hq_navigate',padded),e=>{
  for(const field of ['caseKey','aliases','scope','includeSuperseded','offset','length','expectedRevision'])assert.ok(e.message.includes(field));
  assert.match(e.message,/hq_find/);assert.match(e.message,/no search was performed/);return true;
 });
 assert.deepEqual(padded,before);
 for(const extra of [{caseKey:''},{caseKey:'demo/one'},{scope:'case'},{unknown:''},{aliases:[]},{offset:0}])await assert.rejects(h.call('hq_find',{query:'synthetic',...extra}));
 for(const limit of [0,31,1.5])await assert.rejects(h.call('hq_find',{limit}),/limit must be/);
 await assert.rejects(h.call('hq_navigate',{operation:'curate',caseKey:'demo/one',expectedRevision:1,purpose:'Updated',workRefs:[]}),/workRefs/);
 await assert.rejects(h.call('hq_navigate',{operation:'get',caseKey:'demo/one',section:'overview',id:''}),/does not accept id/);
});
