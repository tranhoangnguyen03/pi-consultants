import test from 'node:test';
import assert from 'node:assert/strict';
import {host} from './helpers.mjs';
const ref={system:'tracker',namespace:'org-A',key:'ISSUE/42',source:'user: synthetic reference'};
test('Exact references retain namespace and surface ambiguous cases without selection',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});
 for(const project of ['one','two'])await h.call('hq_navigate',{operation:'create',client:'demo',project,title:project,purpose:'Synthetic case'});
 for(const project of ['one','two'])await h.call('hq_navigate',{operation:'reference',caseKey:`demo/${project}`,...ref});
 const r=(await h.call('hq_navigate',{operation:'resolve',system:ref.system,namespace:ref.namespace,key:ref.key})).details;
 assert.equal(r.matches.length,2);assert.equal(r.context.caseKey,null);
 assert.equal((await h.call('hq_navigate',{operation:'resolve',system:ref.system,namespace:'org-B',key:ref.key})).details.matches.length,0);
 const c=(await h.call('hq_navigate',{operation:'create',client:'demo',project:'three',title:'Three',purpose:'Different synthetic project',workRefs:[ref]})).details;
 assert.equal(c.status,'review_candidates');assert.equal(c.candidates.length,2);
});
test('Workspace overlap participates in creation review without relying on current directory',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});
 await h.call('hq_navigate',{operation:'create',client:'demo',project:'one',title:'One',purpose:'Synthetic',workspace:h.project});
 const r=(await h.call('hq_navigate',{operation:'create',client:'demo',project:'two',title:'Two',purpose:'Synthetic',workspace:h.project})).details;
 assert.equal(r.status,'review_candidates');assert.equal(r.candidates[0].caseKey,'demo/one');
});
