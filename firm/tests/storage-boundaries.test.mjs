import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {host} from './helpers.mjs';
test('Current interface selects legacy records without changing their bytes and blocks substantive writes',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});
 assert.ok(h.tools.get('hq_note').parameters.required.includes('scope'));
 await h.state.cases.open({client:'demo',project:'legacy',title:'Legacy'});
 const file=path.join(h.state.cases.directory('demo','legacy'),'case.json');const before=await fs.readFile(file,'utf8');
 await h.call('hq_navigate',{operation:'select',caseKey:'demo/legacy'});
 await h.call('hq_case',{operation:'open',client:'demo',project:'legacy'});
 await assert.rejects(h.call('hq_note',{scope:'case',kind:'feedback',state:'observed',text:'No write',sources:[]}),/upgrade/);
 await assert.rejects(h.call('hq_brief',{expectedRevision:0,brief:'No write',sources:[]}),/upgrade/);
 h.external('mcp__test__post',()=>{throw new Error('must not run');});
 await assert.rejects(h.call('hq_actions',{operation:'prepare',tool:'mcp__test__post',args:{},purpose:'No write',destination:'Synthetic'}),/upgrade/);
 assert.equal(await fs.readFile(file,'utf8'),before);
});
test('Unsupported versions cannot be rewritten by open, brief or note',async t=>{
 const h=await host(t);await h.state.cases.open({client:'demo',project:'future',title:'Future'});
 const file=path.join(h.state.cases.directory('demo','future'),'case.json');const state=JSON.parse(await fs.readFile(file));state.version=99;const before=JSON.stringify(state);await fs.writeFile(file,before);
 for(const write of [()=>h.state.cases.open({client:'demo',project:'future'}),()=>h.state.cases.brief('demo','future',0,'No write',[]),()=>h.state.cases.note('demo','future',{})])await assert.rejects(write,/Unsupported/);
 assert.equal(await fs.readFile(file,'utf8'),before);
});
