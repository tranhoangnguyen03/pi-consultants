import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {temp} from './helpers.mjs';
import {buildOffice,loadFirm} from '../scripts/factory.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('[EV-F02] F-only Impeccable adapter isolates runtime, disables telemetry and preserves outcomes',async t=>{
 const tmp=await temp(t),{offices,toolset}=await loadFirm(root);
 const f=offices.find(o=>o.role==='design');
 const hq=await buildOffice(root,f,toolset,path.join(tmp,'moved F office'));
 const script=path.join(hq,'.pi/skills/impeccable/scripts/impeccable.mjs');
 const project=path.join(tmp,'client project'),bin=path.join(tmp,'bin');
 await fs.mkdir(project);await fs.writeFile(path.join(project,'index.html'),'<h1>hello</h1>');await fs.writeFile(path.join(project,'flagged.css'),'.card { font-family: Inter; }');
 await fs.mkdir(bin);
 const mock=[
  '#!'+process.execPath,
  "const fs=require('node:fs'),path=require('node:path');",
  "const a=process.argv.slice(2),prefix=a[a.indexOf('--prefix')+1];",
  "require('node:assert/strict')(a.includes('impeccable@4.7.0')&&a.includes('--ignore-scripts'));",
  "const p=path.join(prefix,'node_modules','impeccable');",
  "fs.mkdirSync(path.join(p,'cli','bin'),{recursive:true});",
  "fs.writeFileSync(path.join(p,'package.json'),JSON.stringify({version:'4.7.0',optionalDependencies:{'@impeccable/cli-linux-x64':'0.1.16'}}));",
  "fs.writeFileSync(path.join(p,'cli','bin','cli.js'),\"console.log(JSON.stringify({args:process.argv.slice(2),cwd:process.cwd(),env:process.env}));process.exitCode=process.argv.includes('flagged.css')?2:0;\");",
  "console.log('MOCK_INSTALLED');"
 ].join('\n')+'\n';
 await fs.writeFile(path.join(bin,'npm'),mock,{mode:0o755});
 const env={PATH:bin+path.delimiter+process.env.PATH,OPENAI_API_KEY:'secret',IMPECCABLE_NO_TELEMETRY:'0'};
 const run=(...a)=>spawnSync(process.execPath,[script,...a],{cwd:tmp,env,encoding:'utf8'});
 const travel=(...a)=>spawnSync(process.execPath,[script,...a],{cwd:project,env,encoding:'utf8'});
 const a=run('detect',project,'index.html');assert.equal(a.status,0,a.stderr);assert.match(a.stderr,/MOCK_INSTALLED/);
 const result=JSON.parse(a.stdout);
 assert.deepEqual(result.args,['detect','--json','index.html']);
 assert.equal(result.cwd,project);assert.equal(result.env.OPENAI_API_KEY,undefined);
 assert.equal(result.env.IMPECCABLE_NO_TELEMETRY,'1');assert.equal(result.env.DO_NOT_TRACK,'1');
 assert(result.env.HOME.startsWith(path.join(hq,'.hq/tools')));
 assert(result.env.IMPECCABLE_HOME.startsWith(path.join(hq,'.hq/tools')));
 assert(!result.env.NODE_OPTIONS);
 const b=run('detect',project,'index.html','flagged.css');assert.equal(b.status,2);assert.doesNotMatch(b.stderr,/MOCK_INSTALLED/);
 assert.deepEqual(JSON.parse(b.stdout).args,['detect','--json','index.html','flagged.css']);
 for(const verb of ['init','document','live','generate','critique-storage']){
  const bad=run(verb,project);assert.equal(bad.status,1);assert.match(bad.stderr,/intentionally excludes/);
 }
 const invalid=travel('detect');assert.equal(invalid.status,1);assert.match(invalid.stderr,/Supply a file|Usage/);
 for(const p of ['PRODUCT.md','DESIGN.md','.impeccable'])assert.equal(await fs.access(path.join(project,p)).then(()=>true,()=>false),false);
 for(const o of offices.filter(o=>o.role!=='design')){
  const other=path.join(root,'skills',o.role,'impeccable');
  assert.equal(await fs.access(other).then(()=>true,()=>false),false);
 }
 const hqSkill=await fs.readFile(path.join(hq,'.pi/skills/impeccable/SKILL.md'),'utf8');
 for(const rule of ['hq_paper','hq_note','quality gate','Delivery gate','telemetry'])assert(hqSkill.toLowerCase().includes(rule.toLowerCase()),rule);
 const marker=JSON.parse(await fs.readFile(path.join(hq,'HQ-ROLE.json'),'utf8'));
 assert(marker.generated['.pi/skills/impeccable/scripts/impeccable.mjs']);
 // Running from an HQ that Pi has /cd'd into the client repo needs no project argument.
 const traveled=travel('detect','--scope','type','index.html');
 assert.equal(traveled.status,0,traveled.stderr);
 assert.deepEqual(JSON.parse(traveled.stdout).args,['detect','--json','--scope','type','index.html']);
 assert.equal(JSON.parse(traveled.stdout).cwd,project);
 const explicit=run('detect','--project',project,'--viewport=390x844','index.html');
 assert.equal(explicit.status,0,explicit.stderr);
 assert.deepEqual(JSON.parse(explicit.stdout).args,['detect','--json','--viewport=390x844','index.html']);

 // Option values are not source targets. Fail closed rather than printing [] with exit 0.
 for(const opts of [
  ['--scope','type'],['--scope=type'],
  ['--viewport','390x844'],['--viewport=390x844'],
  ['--target','Dashboard'],['--target=Dashboard']
 ]){
  const missing=travel('detect',...opts);
  assert.equal(missing.status,1,opts.join(' ')+': '+missing.stderr);
  assert.match(missing.stderr,/target|Supply/i);
  assert.equal(missing.stdout.trim(),'');
 }
 // CDP is intentionally the upstream special case: a running local app is the target.
 const cdp=travel('detect','--cdp','9222','--target','Dashboard');
 assert.equal(cdp.status,0,cdp.stderr);
 assert.deepEqual(JSON.parse(cdp.stdout).args,['detect','--json','--cdp','9222','--target','Dashboard']);
 assert.equal(travel('detect','index.html','--cdp','9222').status,1);

 // macOS /tmp -> /private/tmp and symlinked HQ folders must invoke, never silently exit 0.
 const alias=path.join(tmp,'F HQ alias');
 await fs.symlink(hq,alias,'dir');
 const linkedScript=path.join(alias,'.pi/skills/impeccable/scripts/impeccable.mjs');
 const linked=spawnSync(process.execPath,[linkedScript,'detect','index.html','flagged.css'],{cwd:project,env,encoding:'utf8'});
 assert.equal(linked.status,2,linked.stderr);
 assert.deepEqual(JSON.parse(linked.stdout).args,['detect','--json','index.html','flagged.css']);

 // Source copies must fail before creating tool storage or attempting a download.
 const sourceScript=path.join(root,'skills/design/impeccable/scripts/impeccable.mjs');
 const source=spawnSync(process.execPath,[sourceScript,'version'],{cwd:tmp,env,encoding:'utf8'});
 assert.equal(source.status,1,source.stderr);
 assert.match(source.stderr,/generated consultant office/);

 // The office and all descendants (including symlink aliases) are not scan projects.
 for(const destination of [hq,path.join(hq,'.pi'),alias,path.join(alias,'.pi')]){
  const bad=run('detect',destination,'skills');
  assert.equal(bad.status,1,destination+': '+bad.stderr);
  assert.match(bad.stderr,/consultant office/i);
 }
 const protectedTarget=travel('detect',path.join(alias,'.pi'));
 assert.equal(protectedTarget.status,1,protectedTarget.stderr);
 assert.match(protectedTarget.stderr,/private files|consultant office/i);

});
