import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parse,resolveCase,newRun,childEnvironment,prepareTool,PIN} from '../skills/design/visual-review/scripts/visual-qa.mjs';
import {capture} from '../skills/design/visual-review/scripts/capture.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function workspace(t){const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'f-evidence-'));t.after(()=>fs.rm(tmp,{recursive:true,force:true}));return tmp;}
async function hqFixture(t){
 const tmp=await workspace(t),hq=path.join(tmp,'moved office'),project=path.join(tmp,'client repo');
 await fs.mkdir(path.join(hq,'.runtime/src'),{recursive:true});await fs.mkdir(path.join(hq,'.pi'));await fs.mkdir(project);
 for(const f of ['config.mjs','util.mjs'])await fs.copyFile(path.join(root,'src',f),path.join(hq,'.runtime/src',f));
 await fs.writeFile(path.join(hq,'.pi/hq.json'),JSON.stringify({version:2,role:'design',hq:'..',stateDir:'../.private',projectRoots:[]}));
 const caseDir=path.join(hq,'.private/cases/demo/site');await fs.mkdir(caseDir,{recursive:true});
 const record=JSON.stringify({version:2,client:'demo',project:'site',papers:[],notes:[]});await fs.writeFile(path.join(caseDir,'case.json'),record);
 return {tmp,hq,project,caseDir,record};
}

test('Visual evidence requires explicit case/targets and strips inherited secrets',()=>{
 assert.equal(parse(['capture','--case','demo/site','--build','production','http://localhost:4400/']).urls.length,1);
 for(const args of [[],['capture','--case','demo/site'],['capture','--case','demo/site','--build','production'],['capture','--case','../site','http://localhost/'],['capture','--case','demo/site','file:///etc/passwd'],['capture','--case','demo/site','https://user:secret@example.com/'],['capture','--case','demo/site','--out','elsewhere','https://example.com/'],['install','--case','demo/site']])assert.throws(()=>parse(args));
 const env=childEnvironment('/private/tools',{PATH:'/bin',OPENAI_API_KEY:'secret',NODE_OPTIONS:'bad',DO_NOT_TRACK:'0',DISABLE_TELEMETRY:'0'});
 assert.equal(env.OPENAI_API_KEY,undefined);assert.equal(env.NODE_OPTIONS,undefined);assert.equal(env.DO_NOT_TRACK,'1');assert.equal(env.DISABLE_TELEMETRY,'1');assert.equal(env.HOME,'/private/tools/home');
});

test('Evidence follows configured HQ after travel, requires an existing case, preserves runs and rejects aliases',async t=>{
 const {tmp,hq,project,caseDir,record}=await hqFixture(t),alias=path.join(tmp,'office alias');await fs.symlink(hq,alias,'dir');
 const found=await resolveCase(alias,'demo/site');assert.equal(found.caseDir,await fs.realpath(caseDir));assert.equal(found.stateDir,path.join(await fs.realpath(hq),'.private'));
 const one=await newRun(found.caseDir);await fs.writeFile(path.join(one,'kept.txt'),'keep');const two=await newRun(found.caseDir);assert.notEqual(one,two);assert.equal(await fs.readFile(path.join(one,'kept.txt'),'utf8'),'keep');
 assert.equal(await fs.readFile(path.join(caseDir,'case.json'),'utf8'),record);assert.deepEqual(await fs.readdir(project),[]);
 await assert.rejects(resolveCase(hq,'demo/missing'));await assert.rejects(resolveCase(hq,'../escape'));
 await fs.symlink(caseDir,path.join(hq,'.private/cases/demo/alias'),'dir');await assert.rejects(resolveCase(hq,'demo/alias'),/symlink/);
 await fs.writeFile(path.join(caseDir,'case.json'),JSON.stringify({version:1,client:'demo',project:'site'}));await assert.rejects(resolveCase(hq,'demo/site'),/upgrade/);
 await fs.rm(path.join(caseDir,'papers'),{recursive:true});await fs.symlink(project,path.join(caseDir,'papers'),'dir');await assert.rejects(newRun(caseDir),/real case directory/);assert.deepEqual(await fs.readdir(project),[]);
});

test('Pinned tool setup is HQ-local, serialized, quiet on stdout and reports failed installs',async t=>{
 const dir=await workspace(t);let calls=0;
 const spawn=(cmd,args,options)=>{
  calls++;assert.equal(cmd,'npm');assert(args.includes('--ignore-scripts'));assert(args.includes('playwright@'+PIN.playwright));assert.deepEqual(options.stdio,['ignore',2,2]);assert.equal(options.env.OPENAI_API_KEY,undefined);
  const tool=args[args.indexOf('--prefix')+1];for(const [n,v] of Object.entries(PIN)){sync.mkdirSync(path.join(tool,'node_modules',n),{recursive:true});sync.writeFileSync(path.join(tool,'node_modules',n,'package.json'),JSON.stringify({version:v}));}return {status:0};
 };
 const state=path.join(dir,'state');const first=await prepareTool(state,{spawn,source:{PATH:'/bin',OPENAI_API_KEY:'secret'}});assert(first.tool.startsWith(state));await prepareTool(state,{spawn});assert.equal(calls,1);
 const failedState=path.join(dir,'failed');await assert.rejects(prepareTool(failedState,{spawn:()=>({status:1})}),/download failed/);
 const lock=path.join(first.tool,'.install-lock');await fs.mkdir(lock);await fs.rm(path.join(first.tool,'node_modules'),{recursive:true});await assert.rejects(prepareTool(state,{spawn}),/locked/);assert.equal(calls,1);
});

test('A failed browser preserves an incomplete evidence record instead of a clean score',async t=>{
 const run=await workspace(t),spec={run,caseKey:'demo/site',urls:['http://localhost/'],build:{mode:'production',head:null,dirty:null}};
 const result=await capture(spec,{chromium:{launch:async()=>{throw new Error('fixture browser unavailable');}}});
 assert.equal(result.status,'incomplete');assert.match(result.error,/unavailable/);assert.equal(JSON.parse(await fs.readFile(path.join(run,'manifest.json'),'utf8')).status,'incomplete');assert.match(await fs.readFile(path.join(run,'report.md'),'utf8'),/NOT a quality or delivery approval/);
});

test('CLI through a symlink after /cd reports failures and never writes into source or client',async t=>{
 const {tmp,hq,project,caseDir,record}=await hqFixture(t),scripts=path.join(hq,'.pi/skills/visual-review/scripts');
 await fs.mkdir(scripts,{recursive:true});for(const f of ['visual-qa.mjs','capture.mjs'])await fs.copyFile(path.join(root,'skills/design/visual-review/scripts',f),path.join(scripts,f));
 const tool=path.join(hq,'.private/tools','visual-qa-'+PIN.playwright+'-'+PIN['axe-core']);
 for(const [name,version] of Object.entries(PIN)){await fs.mkdir(path.join(tool,'node_modules',name),{recursive:true});await fs.writeFile(path.join(tool,'node_modules',name,'package.json'),JSON.stringify({name,version,main:'index.js'}));}
 await fs.writeFile(path.join(tool,'node_modules/playwright/index.js'),"module.exports={chromium:{launch:async()=>{throw new Error('fixture browser unavailable')}}};");
 await fs.writeFile(path.join(tool,'node_modules/axe-core/axe.min.js'),'/* unused mock: browser fails before evaluation */');
 const alias=path.join(tmp,'F alias');await fs.symlink(hq,alias,'dir');
 const result=spawnSync(process.execPath,[path.join(alias,'.pi/skills/visual-review/scripts/visual-qa.mjs'),'capture','--case','demo/site','--browser',process.execPath,'http://localhost/'],{cwd:project,encoding:'utf8'});
 assert.equal(result.status,1,result.stderr);const output=JSON.parse(result.stdout);assert.equal(output.status,'incomplete');assert.equal(output.caseKey,'demo/site');assert(output.report.startsWith('papers/visual-qa/'));assert.deepEqual(await fs.readdir(project),[]);assert.equal(await fs.readFile(path.join(caseDir,'case.json'),'utf8'),record);
 const source=spawnSync(process.execPath,[path.join(root,'skills/design/visual-review/scripts/visual-qa.mjs'),'install'],{cwd:project,encoding:'utf8'});assert.equal(source.status,1);assert.match(source.stderr,/generated consultant office/);
});
