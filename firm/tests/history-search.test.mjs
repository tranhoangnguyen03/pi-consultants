import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {projectHistory,searchHistory,readEntries,consultSession} from '../src/sessions.mjs';
import {temp,session,msg,host} from './helpers.mjs';

const at=(e,ts)=>({...e,timestamp:ts});
// Pre-compaction decision, a compaction summary, a sibling branch, a deleted entry and a system prompt.
const history=()=>session([
 msg('sys',null,'system','SYSTEM PROMPT about deploy'),
 at(msg('u1','sys','user','Decision: deploy uses blue-green, never auto-merge.'),'2026-10-01T09:00:00Z'),
 at(msg('a1','u1','assistant','Recorded: blue-green deploy, no auto-merge.'),'2026-10-01T09:01:00Z'),
 at(msg('rejected','a1','user','Use deploy canary instead'),'2026-10-01T09:02:00Z'),
 at(msg('u2','a1','user','Typo deploy note'),'2026-10-01T09:03:00Z'),
 {type:'context_edit',id:'e1',parentId:'u2',targetId:'u2',replacement:null},
 {type:'compaction',id:'c1',parentId:'e1',summary:'Summary: deploy blue-green agreed.',firstKeptEntryId:'a1',timestamp:'2026-10-02T09:00:00Z'},
 at(msg('u3','c1','user','Later: deploy window is Friday.'),'2026-10-03T09:00:00Z'),
]);
async function office(t){const d=await temp(t);const file=path.join(d,'s.jsonl');await fs.writeFile(file,history());return {d,file,config:{sessionRoots:[d]}};}

test('Full projection keeps pre-compaction originals, marks summaries, and still honors edits, branches and system prompts',()=>{
 const p=projectHistory(history(),{full:true,maxChars:Infinity});
 const ids=p.records.map(r=>r.entryId);
 assert.deepEqual(ids,['u1','a1','c1','u3']);
 const c=p.records.find(r=>r.entryId==='c1');assert.equal(c.summary,true);assert.equal(c.coversBefore,'a1');
 assert.doesNotMatch(p.text,/canary|Typo|SYSTEM PROMPT/);
 assert.doesNotMatch(projectHistory(history()).text,/never auto-merge/,'default projection is unchanged');
});

test('Passage search finds the original pre-compaction entry first and labels the summary',async t=>{
 const {config}=await office(t);
 const r=await searchHistory(config,{query:'deploy blue-green'});
 assert.equal(r.status,'matched');assert.equal(r.coverage,'complete');
 assert(['u1','a1'].includes(r.hits[0].entryId),'an original entry ranks first');assert(r.hits.some(h=>h.entryId==='u1'&&h.role==='user'&&/blue-green/.test(h.excerpt)),'pre-compaction original is found');
 const s=r.hits.find(h=>h.entryId==='c1');assert(s.summary);assert.match(s.note,/not original evidence/);
 assert(r.hits.indexOf(s)>r.hits.findIndex(h=>h.entryId==='a1'),'summary ranks below originals with equal terms');
 assert(!r.hits.some(h=>['u2','sys'].includes(h.entryId)));
 const page=await searchHistory(config,{query:'deploy',limit:1});assert.equal(page.hits.length,1);assert.equal(page.nextOffset,1);
 assert.equal((await searchHistory(config,{query:'zebra'})).status,'no_match');
 assert.equal((await searchHistory(config,{query:'deploy',sessionIds:['other']})).totalHits,0);
 await assert.rejects(searchHistory(config,{query:'  '}));
});

test('Reading around an entry returns bounded originals and pages one long entry',async t=>{
 const {file,config}=await office(t);
 const r=await readEntries(config,{file,entryId:'a1',before:1,after:1});
 assert.deepEqual(r.entries.map(e=>e.entryId),['u1','a1','rejected']);assert.equal(r.entries[2].branch,'side');assert(r.laterEntries);
 assert.deepEqual((await readEntries(config,{file,entryId:'a1',before:1,after:1,branches:'current'})).entries.map(e=>e.entryId),['u1','a1','c1']);
 await assert.rejects(readEntries(config,{file,entryId:'nope'}),/not found/);
 await assert.rejects(readEntries(config,{file,entryId:'a1',before:7}));
 const d=await temp(t),long=path.join(d,'l.jsonl');await fs.writeFile(long,session([msg('x',null,'toolResult','y'.repeat(20000))]));
 const one=await readEntries({sessionRoots:[d]},{file:long,entryId:'x',before:0,after:0});
 assert.equal(one.entries[0].text.length,8000);assert.equal(one.entries[0].nextOffset,8000);
 const next=await readEntries({sessionRoots:[d]},{file:long,entryId:'x',before:0,after:0,offset:8000});assert.equal(next.entries[0].nextOffset,16000);
});

test('Consultation over a window works on a session too long to consult whole',async t=>{
 const d=await temp(t),file=path.join(d,'big.jsonl');
 const entries=[msg('m0',null,'user','x'.repeat(5000))];
 for(let i=1;i<60;i++)entries.push(msg(`m${i}`,`m${i-1}`,i===30?'user':'assistant',i===30?'Target decision: keep the API.':'x'.repeat(5000)));
 await fs.writeFile(file,session(entries));
 const config={sessionRoots:[d],maxConsultChars:30000};
 await assert.rejects(consultSession(config,{file,question:'q'},async()=>({text:'never'})),/entryId/);
 let payload;const r=await consultSession(config,{file,question:'What was decided?',entryId:'m30'},async req=>{payload=JSON.parse(req.prompt);return {text:'Keep the API [m30]'};});
 assert(payload.records.some(x=>x.entryId==='m30'));assert(JSON.stringify(payload.records).length<=34000);
 assert(r.provenance.window.earlierOmitted&&r.provenance.window.laterOmitted);
 assert.match((await import('../src/sessions.mjs')).CONSULT_SYSTEM,/summary/);
});

test('session_find searches passages; scope case limits to the case sessions, office searches all',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});
 const dir=path.join(h.root,'hq/.hq/sessions');
 await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'s.jsonl'),history());
 const all=(await h.call('session_find',{query:'blue-green'})).details;
 assert.equal(all.scope,'office');const u1=all.hits.find(x=>x.entryId==='u1');assert(u1);
 const read=(await h.call('session_read',{file:u1.file,entryId:'u1',before:0,after:1})).details;assert.equal(read.entries.length,2);
 await h.call('hq_navigate',{operation:'create',client:'demo',project:'atlas',title:'atlas',purpose:'Synthetic'});
 await h.call('hq_navigate',{operation:'select',caseKey:'demo/atlas'});
 assert.equal((await h.call('session_find',{query:'blue-green'})).details.totalHits,0,'not associated with the selected case');
 assert((await h.call('session_find',{query:'blue-green',scope:'office'})).details.hits.some(x=>x.entryId==='u1'));
});

test('Side branches are searched by default, labelled side; branches:current keeps the old chosen-branch rule',async t=>{
 const {file,config}=await office(t);
 assert.equal((await searchHistory(config,{query:'canary',branches:'current'})).status,'no_match');
 const r=await searchHistory(config,{query:'canary'});
 assert.equal(r.hits[0].entryId,'rejected');assert.equal(r.hits[0].branch,'side');
 assert.equal((await searchHistory(config,{query:'typo'})).status,'no_match','deleted entries stay hidden');
 const around=await readEntries(config,{file,entryId:'rejected',before:1,after:0});
 assert.equal(around.entries.at(-1).parentId,'a1');assert.equal(around.entries.at(-1).branch,'side');
 assert(!projectHistory(history(),{full:true,maxChars:Infinity}).records.some(x=>x.branch),'current-branch mode carries no labels');
});

test('session_find honours sessionId when searching passages',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});
 const dir=path.join(h.root,'hq/.hq/sessions');await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(path.join(dir,'a.jsonl'),session([msg('a1',null,'user','retarget the open PRs')],'session-aaa'));
 await fs.writeFile(path.join(dir,'b.jsonl'),session([msg('b1',null,'user','retarget the open PRs again')],'session-bbb'));
 assert.equal((await h.call('session_find',{query:'retarget'})).details.totalHits,2);
 const one=(await h.call('session_find',{query:'retarget',sessionId:'session-aaa'})).details;
 assert.deepEqual(one.hits.map(x=>x.sessionId),['session-aaa']);
 assert.deepEqual((await h.call('session_find',{query:'retarget',sessionId:'session-b'})).details.hits.map(x=>x.sessionId),['session-bbb'],'prefix works');
});
