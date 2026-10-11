#!/usr/bin/env node
// Offline end-to-end demonstration. No model, Pi process, or external service is used.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {CaseStore} from '../src/cases.mjs';
import {consultSession} from '../src/sessions.mjs';
import {ActionStore,executeAction} from '../src/actions.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'consultant-hq-demo-'));
try{
 const source=path.join(root,'sessions');await fs.mkdir(source);
 const file=path.join(source,'source.jsonl');
 const raw=[{type:'session',version:3,id:'demo-source',cwd:'/synthetic/project'},
  {type:'message',id:'u1',parentId:null,message:{role:'user',content:'Keep the public API stable during this revision.'}}].map(x=>JSON.stringify(x)).join('\n')+'\n';
 await fs.writeFile(file,raw);
 const cases=new CaseStore(path.join(root,'hq','cases'));
 await cases.open({client:'demo',project:'upgrade',title:'Offline upgrade consultation',sessionId:'demo-consultant'});
 const result=await consultSession({sessionRoots:[source]},{file,question:'Was public API compatibility required?'},async({prompt})=>{
  assert.ok(prompt.includes('Keep the public API stable'));
  return {text:'The user explicitly required a stable public API. Evidence: entry u1. This is a fixture answer, not a model run.'};
 });
 assert.equal(await fs.readFile(file,'utf8'),raw);
 await cases.note('demo','upgrade',{kind:'session-consultation',state:'observed',text:result.answer,sources:[`${file}#u1`],sessionId:'demo-consultant'});
 const policy={'mcp__demo__post':{effect:'write',service:'synthetic-chat',account:'demo'},'mcp__demo__get':{effect:'read',service:'synthetic-chat',account:'demo'}};
 const store=new ActionStore(path.join(root,'hq','outbox'));
 const args={channel:'private-fixture',body:'The internal review is ready. Rollout remains blocked pending the recovery check.'};
 const action=await store.prepare({tool:'mcp__demo__post',args,purpose:'Ask for recovery review',destination:'private fixture only',caseKey:'demo/upgrade',ownerSession:'demo-consultant',verify:{tool:'mcp__demo__get',args:{id:'$receipt:/id'},assertions:[{path:'/body',equals:args.body}]}},policy);
 let sent=0;let message;
 // Test-only simulated human boundary. Production approvals come from /hq interactive UI.
 await store.approve([action.id],'demo-consultant','interactive-human-review');
 const done=await executeAction(store,action.id,'demo-consultant',policy,async(tool,input)=>{
  if(tool==='mcp__demo__post'){sent++;message={id:'fixture-1',...input};return {structuredContent:message};}
  assert.equal(input.id,'fixture-1');return {structuredContent:message};
 });
 assert.equal(done.status,'verified');
 await assert.rejects(()=>executeAction(store,action.id,'demo-consultant',policy,async()=>{sent++;}));
 assert.equal(sent,1);
 await cases.receipt('demo','upgrade',{actionId:action.id,digest:action.digest,status:'verified',tool:action.tool,sessionId:'demo-consultant'});
 const recovered=await new CaseStore(path.join(root,'hq','cases')).read('demo','upgrade');
 assert.equal(recovered.notes.length,2);
 console.log(JSON.stringify({mode:'offline synthetic demonstration',sourceSession:'unchanged',consultation:'isolated fixture answer',action:done.status,writes:sent,replay:'blocked',recoveredCaseNotes:recovered.notes.length,liveModelOrServiceCalls:0},null,2));
}finally{await fs.rm(root,{recursive:true,force:true});}
