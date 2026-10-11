import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {host} from './helpers.mjs';
import {ActionStore,executeAction} from '../src/actions.mjs';
import {policy,draft} from './helpers.mjs';
import {loadHQConfig} from '../src/config.mjs';
test('Reconciliation cannot change state during active provider execution',async t=>{
 const h=await host(t);const store=new ActionStore(path.join(h.root,'race'));const a=await store.prepare(draft,policy);await store.approve([a.id],draft.ownerSession,'interactive-human-review');
 let release,started;const gate=new Promise(r=>release=r),ready=new Promise(r=>started=r);
 const executing=executeAction(store,a.id,draft.ownerSession,policy,async()=>{started();await gate;return {content:[{type:'text',text:'sent'}]};});await ready;
 await assert.rejects(store.reconcile(a.id,'not_applied','Synthetic racing reconciliation',draft.ownerSession),/Store locked/);
 release();assert.equal((await executing).status,'acknowledged');assert.equal((await store.get(a.id)).status,'acknowledged');
});
test('Physical private-state containment rejects symlink escape',async t=>{
 const h=await host(t);await fs.symlink(h.project,path.join(h.root,'hq','escape'));
 await fs.writeFile(h.configPath,JSON.stringify({version:2,role:'engineering',hq:'hq',stateDir:'hq/escape/new'}));
 await assert.rejects(loadHQConfig(h.configPath),/outside/);
});
test('Purpose-only curation preserves aliases and repeated lifecycle cycles retain bases',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});const key='demo/one';
 await h.call('hq_navigate',{operation:'create',client:'demo',project:'one',title:'One',purpose:'Synthetic'});
 await h.call('hq_navigate',{operation:'curate',caseKey:key,expectedRevision:1,purpose:'Synthetic',aliases:['gateway']});
 await h.call('hq_navigate',{operation:'curate',caseKey:key,expectedRevision:2,purpose:'New purpose'});
 const e=(await h.call('hq_engagement',{operation:'start',caseKey:key,objective:'Synthetic'})).details.engagement;
 for(let i=0;i<2;i++){await h.call('hq_engagement',{operation:'deliver',caseKey:key,id:e.id,basis:`delivery-${i}`});await assert.rejects(h.call('hq_engagement',{operation:'amend',caseKey:key,id:e.id,objective:'New',basis:'revision'}),/rework/);await h.call('hq_engagement',{operation:'rework',caseKey:key,id:e.id,basis:`rework-${i}`});}
 const c=await h.state.cases.read('demo','one');assert.deepEqual(c.navigation.aliases,['gateway']);for(const basis of ['delivery-0','delivery-1','rework-0','rework-1'])assert.ok(c.notes.some(n=>n.sources.includes(basis)));
});
