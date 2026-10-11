import test from 'node:test';
import assert from 'node:assert/strict';
import {host} from './helpers.mjs';
test('Synthetic directories page without duplication and keep response size bounded',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});await h.call('hq_navigate',{operation:'create',client:'demo',project:'one',title:'One',purpose:'Synthetic volume'});await h.call('hq_navigate',{operation:'select',caseKey:'demo/one'});
 for(let i=0;i<35;i++)await h.call('hq_note',{scope:'case',kind:'finding',state:'observed',text:`Synthetic ${i} `+'x'.repeat(200),sources:[],attribution:'synthetic generator'});
 const seen=new Set();let after;
 do{const r=(await h.call('hq_navigate',{operation:'get',caseKey:'demo/one',section:'notes',length:12,...(after?{after}:{})})).details;assert.ok(JSON.stringify(r).length<18000);for(const item of r.items){assert.equal(seen.has(item.id),false);seen.add(item.id);}after=r.nextAfter;}while(after);
 assert.equal(seen.size,35);
});
