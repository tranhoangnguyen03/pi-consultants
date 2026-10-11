import test from 'node:test';
import assert from 'node:assert/strict';
import {host} from './helpers.mjs';
test('Batch reads preserve selection and disclose remaining output without dropping pointers',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});await h.call('hq_navigate',{operation:'create',client:'demo',project:'one',title:'One',purpose:'Synthetic batch'});await h.call('hq_navigate',{operation:'select',caseKey:'demo/one'});
 const pointers=[];for(let i=0;i<3;i++){const n=(await h.call('hq_note',{scope:'case',attribution:'synthetic',kind:'finding',state:'observed',text:'x'.repeat(15000),sources:[]})).details;pointers.push({caseKey:'demo/one',section:'note',id:n.id});}
 const first=(await h.call('hq_navigate',{operation:'batch',pointers})).details;assert.equal(first.results.length,1);assert.equal(first.remaining.length,2);assert.equal(first.coverage,'partial');assert.equal(first.context.caseKey,'demo/one');assert.ok(JSON.stringify(first).length<26000);
 const next=(await h.call('hq_navigate',{operation:'batch',pointers:first.remaining})).details;assert.equal(next.results[0].data.id,pointers[1].id);
 const missing=(await h.call('hq_navigate',{operation:'batch',pointers:[{caseKey:'demo/missing',section:'overview'}]})).details;assert.equal(missing.coverage,'partial');assert.equal(missing.results[0].status,'unavailable');
 await assert.rejects(h.call('hq_navigate',{operation:'batch',pointers:Array(9).fill(pointers[0])}),/1..8/);
});
