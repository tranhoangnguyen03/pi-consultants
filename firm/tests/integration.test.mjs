import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {host,response,draft,policy,session,msg} from './helpers.mjs';

async function open(h){await h.call('hq_case',{operation:'open',client:'client',project:'project',title:'Project',workspace:h.project});}
async function prepare(h,extra={}){return (await h.call('hq_actions',{operation:'prepare',...draft,...extra})).details;}

test('[EV-P01] Optional outbox approval, execution and automatic receipt form one workflow',async t=>{
 const h=await host(t);let writes=0;h.external('mcp__test__post',async args=>{writes++;return response({id:'message',body:args.body});});
 h.external('mcp__test__get',async()=>response({body:draft.args.body}));await open(h);
 const a=await prepare(h,{verify:{tool:'mcp__test__get',args:{id:'$receipt:/id'},assertions:[{path:'/body',equals:draft.args.body}]}});
 const refused=(await h.call('hq_execute',{ids:[a.id]})).details.outcomes[0];assert.equal(refused.status,'not-started');assert.match(refused.error,/not approved/);assert.equal(writes,0);
 await h.commands.get('hq').handler(`approve ${a.id}`,h.ctx);assert.equal(h.sent.length,1);
 const r=await h.call('hq_execute',{ids:[a.id]});assert.equal(r.details.outcomes[0].status,'verified');assert.equal(writes,1);
 const c=await h.state.cases.read('client','project');assert(c.notes.some(n=>n.kind==='action-receipt'));
});
test('Approved check 7: the optional outbox works for consultants other than C',async t=>{
 for(const role of ['engineering','user']){
  const h=await host(t,{role});let writes=0;h.external('mcp__test__post',async()=>{writes++;return response({id:'message'});});await open(h);
  const a=await prepare(h);await h.commands.get('hq').handler(`approve ${a.id}`,h.ctx);
  const r=await h.call('hq_execute',{ids:[a.id]});assert.notEqual(r.details.outcomes[0].status,'not-started',role);assert.equal(writes,1,role);
 }
});
test('[EV-P02] A changed preview or headless session cannot approve an outbox draft',async t=>{
 const h=await host(t);h.external('mcp__test__post',async()=>response({id:'x'}));await open(h);const a=await prepare(h);
 h.ctx.hasUI=false;await h.commands.get('hq').handler(`approve ${a.id}`,h.ctx);assert.equal((await h.state.actions.get(a.id)).status,'draft');
 h.ctx.hasUI=true;h.ctx.ui.editor=async(_title,s)=>s+'modified';await h.commands.get('hq').handler(`approve ${a.id}`,h.ctx);assert.equal((await h.state.actions.get(a.id)).status,'draft');
});
test('[EV-P03] Optional outbox policy remains a proposal until human review',async t=>{
 const h=await host(t);h.external('mcp__new__search',async()=>response({found:true}));
 h.external('mcp__test__get',async()=>response({}));h.external('mcp__test__post',async()=>response({}));
 h.tools.get('mcp__new__search').annotations={readOnlyHint:true};
 assert.equal(h.state.getConfig().policy['mcp__new__search'],undefined);
 await h.call('hq_policy_propose',{policy:{...policy,'mcp__new__search':{effect:'read',service:'new',account:'verified-account'}}});
 assert.equal(h.state.getConfig().policy['mcp__new__search'],undefined);
 await h.commands.get('hq').handler('policy-review',h.ctx);assert.equal((await h.call('mcp__new__search',{})).structuredContent.found,true);
});
test('B and C inherit the same ordinary tools and workspace access without HQ allowlisting',async t=>{
 for(const role of ['engineering','coordination']){
  const h=await host(t,{role,configExtra:{projectRoots:[],localReadRoots:[]}});
  for(const name of ['read','grep','find','ls','bash','powershell','write','edit','codemode','unclassified_mcp','mcp__test__post']){
   h.external(name,async()=>response({ok:true}));
   assert.equal((await h.call(name,{path:h.root})).structuredContent.ok,true);
  }
  await open(h);
  assert.deepEqual((await h.state.cases.read('client','project')).workspaces,[h.project]);
 }
});
test('[EV-P04] Unknown batch outcome stops dependent actions, with explicit remaining IDs',async t=>{
 const h=await host(t);let calls=0;h.external('mcp__test__post',async()=>{calls++;throw new Error('connection lost');});await open(h);
 const a=await prepare(h),b=await prepare(h,{args:{...draft.args,body:'Second message'}});
 await h.commands.get('hq').handler(`approve ${a.id} ${b.id}`,h.ctx);
 const r=await h.call('hq_execute',{ids:[a.id,b.id]});assert.equal(calls,1);assert.equal(r.details.outcomes[0].status,'unknown');assert.deepEqual(r.details.remainingIds,[b.id]);assert.equal((await h.state.actions.get(b.id)).status,'approved');
});
test('[EV-P05][EV-P08] Replies do not create records; legacy generated notes are hidden but preserved',async t=>{
 const h=await host(t,{role:'engineering'});await open(h);
 await h.emit('agent_end',{messages:[{role:'assistant',content:'A meaningful answer. '.repeat(20)}]});
 assert.equal((await h.state.cases.read('client','project')).notes.length,0);
 for(const kind of ['checkpoint','session-consultation'])await h.state.cases.note('client','project',{kind,state:'observed',text:'Legacy generated prose',sources:[]});
 await h.call('hq_note',{kind:'finding',state:'observed',text:'Deliberate finding',sources:['source']});
 const read=(await h.call('hq_case',{operation:'read'})).details;
 await assert.rejects(h.call('hq_note',{kind:'checkpoint',state:'observed',text:'new generated note',sources:[]}),/Legacy/);
 assert.equal(read.notes.length,1);assert.equal(read.pastReplies,undefined);
 assert.equal((await h.state.cases.read('client','project')).notes.length,3);
 const reopened=(await h.call('hq_case',{operation:'open',client:'client',project:'project'})).details;
 assert.equal(reopened.recentNotes.length,1);assert.equal(reopened.pastReplies,undefined);
});
test('[EV-P09] Each HQ shows its own intro banner at session start and clears it at the first prompt',async t=>{
 const offices=JSON.parse(await fs.readFile(new URL('../offices.json',import.meta.url),'utf8'));
 for(const [role,title] of [['engineering','CONSULTANT B · ENGINEERING'],['coordination','CONSULTANT C · COORDINATION']]){
  const {folder,role:_,...office}=offices.find(o=>o.role===role);
  const h=await host(t,{role,configExtra:{office}});const banner=h.widgets.get('consultant-hq-intro');
  assert(banner.some(l=>l.includes(title)));assert(banner.some(l=>l.includes('Case  none yet')));
  await h.emit('before_agent_start',{});assert.equal(h.widgets.get('consultant-hq-intro'),undefined);
  await h.emit('session_start',{reason:'reload'});assert.equal(h.widgets.get('consultant-hq-intro'),undefined);
 }
});
test('[EV-P06] Consultant session inquiry saves no generated record and leaves the recipient file untouched',async t=>{
 const h=await host(t,{role:'engineering',answer:async()=>({text:'The user selected the simpler approach. [u]'})});
 const config=JSON.parse(await fs.readFile(h.configPath,'utf8')); // Set up a second isolated host using explicit roots.
 const source=path.join(h.project,'source.jsonl');await fs.writeFile(source,session([msg('u',null,'user','Choose the simpler approach.')]));
 const h2=await host(t,{role:'engineering',configExtra:{sessionRoots:[h.project]},answer:async()=>({text:'The user selected the simpler approach. [u]'})});await open(h2);
 const before=await fs.readFile(source,'utf8');await h2.call('session_consult',{file:source,question:'Which approach was selected?'});
 assert.equal(await fs.readFile(source,'utf8'),before);assert.equal(h2.sent.length,0);assert.equal((await h2.state.cases.read('client','project')).notes.length,0);
});
test('[EV-P07] Generic executor supports six fixture service shapes without claiming live connector compatibility',async t=>{
 const services=['slack','linear','github','gmail','calendar','workspace'];
 const p={};for(const s of services){p[`mcp__${s}__write_fixture`]={effect:'write',service:s,account:`${s}-test`};p[`mcp__${s}__read_fixture`]={effect:'read',service:s,account:`${s}-test`};}
 const h=await host(t,{configExtra:{policy:p}});await open(h);let calls=0;
 for(const service of services){
  h.external(`mcp__${service}__write_fixture`,async args=>{calls++;return response({resource:{id:`${service}-1`},text:args.text});});
  h.external(`mcp__${service}__read_fixture`,async()=>response({status:'present'}));
  const a=await prepare(h,{tool:`mcp__${service}__write_fixture`,args:{destination:'private-fixture',text:`Approved ${service} fixture`},verify:{tool:`mcp__${service}__read_fixture`,args:{id:'$receipt:/resource/id'},assertions:[{path:'/status',equals:'present'}]}});
  await h.commands.get('hq').handler(`approve ${a.id}`,h.ctx);const r=await h.call('hq_execute',{ids:[a.id]});assert.equal(r.details.outcomes[0].status,'verified');
 }
 assert.equal(calls,6);
});
