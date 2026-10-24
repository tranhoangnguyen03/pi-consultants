import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {temp} from './helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.resolve(root,'..');
const required=['paper-lookup','literature-review','scientific-critical-thinking','hypothesis-generation','experimental-design','statistical-analysis','scientific-writing','last30days'];
test('Research Scientist E is a generated independent HQ with exactly eight specialty skills',async()=>{
 const source=path.join(root,'skills/research'),office=path.join(repo,'offices/research-consultant');
 assert.deepEqual((await fs.readdir(source)).sort(),required.slice().sort());
 assert.deepEqual((await fs.readdir(path.join(office,'.pi/skills'))).sort(),[...required,...await fs.readdir(path.join(root,'skills/shared'))].sort());
 const settings=JSON.parse(await fs.readFile(path.join(office,'.pi/settings.json'),'utf8'));
 const role=JSON.parse(await fs.readFile(path.join(office,'.pi/hq.json'),'utf8'));
 assert.equal(role.role,'research');assert.equal(settings.sessionDir,'.hq/sessions');
 assert.match(await fs.readFile(path.join(office,'AGENTS.md'),'utf8'),/research scientist/);
 const lock=JSON.parse(await fs.readFile(path.join(root,'research-sources.json'),'utf8'));
 assert.equal(lock.kDense.skills.length,7);
 for(const name of required){
  await fs.access(path.join(source,name,'SKILL.md'));
  await fs.access(path.join(office,'.pi/skills',name,'SKILL.md'));
 }
 for(const name of required.filter(x=>x!=='last30days'))await fs.access(path.join(source,name,'UPSTREAM-LICENSE.md'));
 await fs.access(path.join(source,'last30days/UPSTREAM-LICENSE'));
 await fs.access(path.join(source,'last30days/UPSTREAM-SKILL.md'));
});
test('Research vendoring preserves local literature-review and diagram guidance across repeated refreshes',async t=>{
 const d=await temp(t),upstream=path.join(d,'upstream'),firm=path.join(d,'firm');
 const addition=await fs.readFile(path.join(root,'research-additions/literature-review.md'),'utf8');
 const expected=await fs.readFile(path.join(root,'skills/research/literature-review/SKILL.md'),'utf8');
 assert(expected.includes(addition+'\n'));
 const visuals=await fs.readFile(path.join(root,'research-additions/scientific-critical-thinking-visuals.md'),'utf8');
 const expectedThinking=await fs.readFile(path.join(root,'skills/research/scientific-critical-thinking/SKILL.md'),'utf8');
 assert(expectedThinking.includes(visuals));
 assert.match(visuals,/diagram-design/);
 assert(!visuals.includes('skills/scientific-schematics/'));
 const upstreamThinking=expectedThinking
  .replace(visuals,'## Visual Aids (Optional)\n\nUpstream diagram guidance.\n\n---\n')
  .replace(/^compatibility: .+$/m,'compatibility: Optional figures require scientific-schematics and OPENROUTER_API_KEY.');
 for(const name of required){
  const dir=path.join(upstream,'skills',name);await fs.mkdir(dir,{recursive:true});
  const content=name==='literature-review'?expected.replace(addition+'\n',''):name==='scientific-critical-thinking'?upstreamThinking:`# ${name}\n`;
  await fs.writeFile(path.join(dir,'SKILL.md'),content);
 }
 await fs.mkdir(path.join(upstream,'skills/last30days/scripts'));
 await fs.writeFile(path.join(upstream,'skills/last30days/scripts/last30days.py'),'# Fixture engine\n');
 for(const file of ['LICENSE','LICENSE.md'])await fs.writeFile(path.join(upstream,file),'Fixture license\n');
 const git=(...args)=>execFileSync('git',['-C',upstream,...args],{encoding:'utf8'});
 git('init','-q');git('add','.');
 git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture upstream');
 const commit=git('rev-parse','HEAD').trim();
 await fs.mkdir(path.join(firm,'scripts'),{recursive:true});
 for(const file of ['vendor-research.mjs','research-last30days-runner.mjs'])await fs.copyFile(path.join(root,'scripts',file),path.join(firm,'scripts',file));
 await fs.cp(path.join(root,'research-additions'),path.join(firm,'research-additions'),{recursive:true});
 await fs.writeFile(path.join(firm,'research-sources.json'),JSON.stringify({
  kDense:{repository:upstream,commit,skills:required.filter(name=>name!=='last30days')},
  last30days:{repository:upstream,commit}
 }));
 for(let run=0;run<2;run++){
  const result=spawnSync(process.execPath,[path.join(firm,'scripts/vendor-research.mjs')],{encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,result.stderr);
  assert.equal(await fs.readFile(path.join(firm,'skills/research/literature-review/SKILL.md'),'utf8'),expected);
  assert.equal(await fs.readFile(path.join(firm,'skills/research/scientific-critical-thinking/SKILL.md'),'utf8'),expectedThinking);
 }
});
test('last30days launches with isolated credentials and disables the upstream Keychain source',async t=>{
 const d=await temp(t),office=path.join(d,'office'),bin=path.join(d,'bin');
 const scripts=path.join(office,'.pi/skills/last30days/scripts');
 await fs.mkdir(scripts,{recursive:true});await fs.mkdir(bin);
 await fs.copyFile(path.join(root,'scripts/research-last30days-runner.mjs'),path.join(scripts,'hq-safe-run.mjs'));
 const python=path.join(bin,'python3.14');
 await fs.writeFile(python,`#!${process.execPath}\nconst {spawnSync}=require('node:child_process');
if(process.argv[2]==='-c')console.log(${JSON.stringify(python)});
else{
 const helpers=Object.fromEntries(['security','gh','pass'].map(name=>[name,spawnSync(name,[],{encoding:'utf8'}).error?.code]));
 console.log(JSON.stringify({cwd:process.cwd(),args:process.argv.slice(2),env:process.env,helpers}));
}\n`);
 await fs.chmod(python,0o700);
 const accessed=path.join(d,'host-credentials-accessed');
 for(const name of ['security','gh','pass']){
  const helper=path.join(bin,name);
  await fs.writeFile(helper,`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(accessed)},'unexpected credential lookup');console.log('fake-host-secret');\n`);
  await fs.chmod(helper,0o700);
 }
 const env={PATH:bin,OPENAI_API_KEY:'fake-secret',GITHUB_TOKEN:'fake-secret',LAST30DAYS_SKIP_KEYCHAIN:'0',LAST30DAYS_KEYCHAIN_ALIASES:'host-alias',GH_CONFIG_DIR:'/host/gh',LAST30DAYS_PASS_PREFIX:'host/'};
 for(const input of ['public topic','setup guide','doctor appointments','library searching','queue coverage','--preflight']){
  const result=spawnSync(process.execPath,[path.join(scripts,'hq-safe-run.mjs'),input],{cwd:d,env,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const child=JSON.parse(result.stdout),base=path.join(office,'.hq/last30days');
  assert.equal(child.cwd,office);assert.equal(child.env.HOME,path.join(base,'home'));
  assert.equal(child.env.LAST30DAYS_CONFIG_DIR,path.join(base,'config'));
  assert.equal(child.env.LAST30DAYS_SKIP_KEYCHAIN,'1');
  assert.equal(child.env.PATH,path.join(base,'bin'));
  assert.deepEqual(child.helpers,{security:'ENOENT',gh:'ENOENT',pass:'ENOENT'});
  assert.equal(await fs.access(accessed).then(()=>true,()=>false),false);
  for(const key of ['OPENAI_API_KEY','GITHUB_TOKEN','LAST30DAYS_KEYCHAIN_ALIASES','GH_CONFIG_DIR','LAST30DAYS_PASS_PREFIX'])assert.equal(child.env[key],undefined,key);
  assert.equal(child.env.FROM_BROWSER,'off');assert.equal(child.env.AGENTCOOKIE,'off');
  assert.equal(child.env.BROWSER_CONSENT,'false');
  assert.deepEqual(child.args,[path.join(scripts,'last30days.py'),...(input==='--preflight'?['--preflight']:[input,'--no-browser-cookies','--search','reddit,hackernews,github,polymarket,devto','--emit=json','--save-dir',path.join(base,'reports')])]);
 }
});
test('last30days rejects upstream command topics before Python or filesystem side effects',async t=>{
 const d=await temp(t),scripts=path.join(d,'office/.pi/skills/last30days/scripts');
 await fs.mkdir(scripts,{recursive:true});
 const runner=path.join(scripts,'hq-safe-run.mjs');
 await fs.copyFile(path.join(root,'scripts/research-last30days-runner.mjs'),runner);
 for(const input of ['setup',' Setup ','SETUP','doctor','library feed','library search','library search topic','queue list','queue cover','queue cover topic']){
  const result=spawnSync(process.execPath,[runner,input],{env:{PATH:''},encoding:'utf8'});
  assert.equal(result.status,2,input);
  assert.match(result.stderr,/upstream commands are disabled/,input);
  assert.equal(await fs.access(path.join(d,'office/.hq')).then(()=>true,()=>false),false,input);
 }
});
test('last30days direct engine is not the HQ entrypoint; safe runner rejects unsupported flags',async()=>{
 const rootSkill=path.join(root,'skills/research/last30days');
 const text=await fs.readFile(path.join(rootSkill,'SKILL.md'),'utf8');
 assert.match(text,/HQ-safe entrypoint/);
 const wrapper=await fs.readFile(path.join(rootSkill,'scripts/hq-safe-run.mjs'),'utf8');
 for(const term of ["AGENTCOOKIE:'off'","FROM_BROWSER:'off'","BROWSER_CONSENT:'false'","LAST30DAYS_CONFIG_DIR","XDG_CONFIG_HOME"])assert(wrapper.includes(term),term);
 const r=spawnSync(process.execPath,[path.join(rootSkill,'scripts/hq-safe-run.mjs'),'--publish-html'],{encoding:'utf8'});
 assert.equal(r.status,2);assert.match(r.stderr,/Usage/);
});
