import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {RpcClient} from '../independent/rpc-client.mjs';
import {registerCollaboration} from '../independent/collaboration.mjs';

// A protocol fixture, not evidence of PiG compatibility or model quality.
const fixtureSource=String.raw`
import readline from 'node:readline';
import path from 'node:path';
const argv=process.argv.slice(2), homeIndex=argv.indexOf('--home');
const home=homeIndex < 0 ? process.cwd() : argv[homeIndex+1];
let lastText='';
const send=value => process.stdout.write(JSON.stringify(value)+'\n');
const answer=(c,data) => send({type:'response',id:c.id,command:c.type,success:true,data});
const finish=text => {
 lastText=text;
 send({type:'extension_ui_request',method:'notify',message:'fixture notice'});
 send({type:'message_update',assistantMessageEvent:{type:'text_delta',delta:text}});
 send({type:'message_end',message:{role:'assistant',stopReason:'stop',content:[{type:'text',text}]}});
 send({type:'agent_settled'});
};
readline.createInterface({input:process.stdin}).on('line',line => {
 const c=JSON.parse(line);
 if(c.type==='extension_ui_response'){finish(c.cancelled?'cancelled':c.confirmed?'confirmed':'declined');return;}
 if(c.type==='echo'){setTimeout(()=>answer(c,{value:c.value}),c.delay ?? 0);return;}
 if(c.type==='get_state'){answer(c,{sessionId:path.basename(home),sessionFile:path.join(home,'session.jsonl'),cwd:process.cwd(),argv});return;}
 if(c.type==='get_last_assistant_text'){answer(c,{text:lastText});return;}
 if(c.type==='abort'){answer(c,{});return;}
 if(c.type!=='prompt'){answer(c,{});return;}
 if(c.message==='exit'){process.stderr.write('fixture crash');process.exit(17);}
 if(c.message==='bad-json'){process.stdout.write('not-json\n');return;}
 if(c.message==='partial'){process.stdout.write('{"type":');process.exit(0);}
 if(c.message==='slow-ack'){setTimeout(()=>{answer(c,{disposition:'started'});finish('cold startup completed');},120);return;}
 if(c.message==='handled'){answer(c,{disposition:'handled'});return;}
 if(c.message==='queued'){answer(c,{disposition:'queued'});setTimeout(()=>finish('queued result'),5);return;}
 if(c.message==='hang'){answer(c,{disposition:'started'});return;}
 if(c.message==='model-error'){
  answer(c,{disposition:'started'});
  send({type:'message_end',message:{role:'assistant',stopReason:'error',errorMessage:'fixture provider failed'}});
  send({type:'agent_settled'});return;
 }
 if(c.message==='dialog'){
  answer(c,{disposition:'started'});
  send({type:'extension_ui_request',id:'confirm-1',method:'confirm',title:'Continue?',message:'Fixture confirmation',timeout:5000});return;
 }
 // Complete before acknowledging to expose a subscribe-after-send race.
 finish(c.message==='inspect' ? JSON.stringify({home,cwd:process.cwd(),argv,envSeen:process.env.FIXTURE_TOKEN==='synthetic-fixture-token'}) : 'result: '+c.message);
 answer(c,{disposition:'started'});
});
`;

async function fixture(t) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'independent-rpc-'));
  const script=path.join(root,'fixture.mjs');
  await fs.writeFile(script,fixtureSource);
  t.after(() => fs.rm(root,{recursive:true,force:true}));
  return {root,script};
}

test('RPC correlates responses, observes settlement, handles queued/handled input and real dialogs', {timeout:10000}, async t => {
  const {script}=await fixture(t), updates=[], dialogs=[];
  const client=new RpcClient({command:process.execPath,args:[script],onDialog:(request,{signal}) => {
    dialogs.push(request); assert.equal(signal.aborted,false); return {confirmed:true};
  }});
  t.after(() => client.close());
  await client.start();
  const responses=await Promise.all([client.request('echo',{value:'first',delay:30}),client.request('echo',{value:'second',delay:0})]);
  assert.deepEqual(responses,[{value:'first'},{value:'second'}]);
  const first=await client.prompt('immediate',{onUpdate:text => updates.push(text)});
  assert.equal(first.text,'result: immediate');
  assert.deepEqual(updates,['result: immediate']);
  assert.deepEqual(first.session.argv.slice(-2),['--mode','rpc']);
  assert.equal((await client.prompt('queued')).disposition,'queued');
  const handled=await client.prompt('handled');
  assert.equal(handled.disposition,'handled'); assert.equal(handled.text,'');
  assert.equal((await client.prompt('dialog')).text,'confirmed');
  assert.equal(dialogs.length,1); assert.equal(dialogs[0].method,'confirm');
  await client.close();

  // A slow first launch gets the prompt's overall deadline, not the short control timeout.
  const patient=new RpcClient({command:process.execPath,args:[script],timeoutMs:50});
  t.after(() => patient.close());
  await patient.start();
  assert.equal((await patient.prompt('slow-ack',{timeoutMs:1000})).text,'cold startup completed');
  await patient.close();
});

test('RPC cancels unhandled dialogs and cleans up cancellation, timeout, provider/process and framing failures', {timeout:10000}, async t => {
  const {script,root}=await fixture(t);
  const unhandled=new RpcClient({command:process.execPath,args:[script]});
  t.after(() => unhandled.close());
  await unhandled.start();
  const result=await unhandled.prompt('dialog');
  assert.equal(result.text,'cancelled');
  assert.deepEqual(result.unansweredInputs,[{method:'confirm',title:'Continue?'}]);
  await unhandled.close();
  for(const [message,options,expected] of [
    ['hang',{timeoutMs:40},/timed out/],['model-error',{},/fixture provider failed/],
    ['exit',{},/Agent exited/],['bad-json',{},/Invalid RPC output/],['partial',{},/JSONL record/],
  ]) {
    const client=new RpcClient({command:process.execPath,args:[script]});
    try { await client.start(); await assert.rejects(client.prompt(message,options),expected); }
    finally { await client.close(); }
    assert.ok(client.exit,`${message} child must be reaped`);
  }
  const controller=new AbortController(), cancelled=new RpcClient({command:process.execPath,args:[script]});
  await cancelled.start();
  const pending=cancelled.prompt('hang',{signal:controller.signal});
  controller.abort(new Error('fixture cancellation'));
  await assert.rejects(pending,/fixture cancellation/);
  await cancelled.close(); assert.ok(cancelled.exit);
  const missing=new RpcClient({command:path.join(root,'missing-executable')});
  await assert.rejects(missing.start(),/ENOENT/); await missing.close();
});

test('collaboration launches separate peer homes with full argv, routes human input, and returns attributed results', {timeout:10000}, async t => {
  const {script,root}=await fixture(t), home=path.join(root,'main'), project=path.join(root,'project');
  const peerA=path.join(root,'peer-a'), peerB=path.join(root,'peer-b');
  await Promise.all([fs.mkdir(path.join(home,'.pi'),{recursive:true}),fs.mkdir(project),fs.mkdir(peerA),fs.mkdir(peerB)]);
  const peers=Object.fromEntries([['a',peerA],['b',peerB]].map(([name,peerHome]) => [name,{
    command:process.execPath,args:[script,'--home',peerHome,'--fixture-flag','literal;$(not-a-shell)'],
    cwd:project,env:{FIXTURE_TOKEN:'synthetic-fixture-token'},description:`Independent ${name}`,release:'fixture-release',
  }]));
  await fs.writeFile(path.join(home,'.pi/agents.json'),JSON.stringify({peers}));
  const Type={Object:properties=>({properties}),String:options=>options,Number:options=>options,Optional:value=>value};
  const registered=new Map();
  registerCollaboration({registerTool:tool=>registered.set(tool.name,tool)},{Type,home,identity:{id:'main-pi',protocol:1}});
  const list=await registered.get('agent_peers').execute();
  assert.equal(list.details.self.id,'main-pi'); assert.equal(list.details.peers.length,2);
  assert.equal(JSON.stringify(list).includes('synthetic-fixture-token'),false);
  const updates=[], confirmations=[], ctx={cwd:root,hasUI:true,ui:{confirm:async(title,message,options)=>{
    confirmations.push({title,message}); assert.equal(options.signal.aborted,false); return false;
  }}};
  const ask=(peer,message) => registered.get('agent_ask').execute('fixture-call',{peer,message},new AbortController().signal,update=>updates.push(update),ctx);
  const a=(await ask('a','inspect')).details, b=(await ask('b','inspect')).details;
  assert.equal(a.peer,'a'); assert.equal(a.configuredRelease,'fixture-release');
  assert.match(a.releaseIdentitySource,/not verified/);
  assert.equal(a.session.sessionFile,path.join(peerA,'session.jsonl'));
  assert.equal(b.session.sessionFile,path.join(peerB,'session.jsonl'));
  for(const data of [a,b]) {
    const observed=JSON.parse(data.text);
    assert.equal(observed.cwd,project); assert.equal(observed.envSeen,true);
    assert.ok(observed.argv.includes('literal;$(not-a-shell)'));
    assert.equal(observed.argv.some(arg=>arg==='--no-extensions'||arg==='--no-skills'),false);
    assert.deepEqual(observed.argv.slice(-2),['--mode','rpc']);
  }
  assert.equal((await ask('a','dialog')).details.text,'declined');
  assert.deepEqual(confirmations,[{title:'a: Continue?',message:'Fixture confirmation'}]);
  assert.ok(updates.some(update=>update.details.peer==='a'));
  await assert.rejects(ask('missing','inspect'),/Unknown peer/);
});
