import test from 'node:test';
import assert from 'node:assert/strict';
import {host} from './helpers.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
test('Index cursor ordering covers hyphen and underscore keys; directory rejects double cursor',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});
 for(const client of ['a_x','a-x','b'])await h.call('hq_navigate',{operation:'create',client,project:client,title:client,purpose:'Synthetic'});
 const seen=[];let after;do{const r=(await h.call('hq_navigate',{operation:'index',limit:1,...(after?{after}:{})})).details;seen.push(...r.entries.map(x=>x.caseKey));after=r.next;}while(after);
 assert.equal(new Set(seen).size,3);
 await assert.rejects(h.call('hq_navigate',{operation:'get',caseKey:'b/b',section:'notes',after:'x',offset:1}),/OR offset/);
});
test('Post-dispatch journal failure is uncertain, never not-started',async t=>{
 const h=await host(t);await h.call('hq_case',{operation:'open',client:'demo',project:'one',title:'One'});let writes=0;
 const lock=path.join(h.root,'hq','outbox','.transaction-lock');
 h.external('mcp__test__post',async()=>{writes++;await fs.mkdir(lock);return {content:[{type:'text',text:'sent'}]};});
 const a=(await h.call('hq_actions',{operation:'prepare',tool:'mcp__test__post',args:{body:'synthetic'},purpose:'check journal failure',destination:'synthetic'})).details;
 await h.commands.get('hq').handler(`approve ${a.id}`,h.ctx);
 try{const r=(await h.call('hq_execute',{ids:[a.id]})).details;assert.equal(writes,1);assert.equal(r.outcomes[0].status,'unknown');assert.match(r.outcomes[0].recovery,/do not retry/);}finally{await fs.rmdir(lock);}
});
test('Batch returns earlier outcomes when a later action cannot start',async t=>{
 const h=await host(t);await h.call('hq_case',{operation:'open',client:'demo',project:'one',title:'One'});let writes=0;h.external('mcp__test__post',()=>{writes++;return {content:[{type:'text',text:'ok'}]};});
 const ids=[];for(const purpose of ['first','second'])ids.push((await h.call('hq_actions',{operation:'prepare',tool:'mcp__test__post',args:{body:purpose},purpose,destination:'synthetic'})).details.id);
 await h.commands.get('hq').handler(`approve ${ids[0]}`,h.ctx);
 const r=(await h.call('hq_execute',{ids})).details;assert.equal(writes,1);assert.equal(r.outcomes[0].status,'acknowledged');assert.equal(r.outcomes[1].status,'not-started');
});
