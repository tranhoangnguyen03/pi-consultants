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
 await fs.mkdir(project);await fs.writeFile(path.join(project,'index.html'),'<h1>hello</h1>');
 await fs.mkdir(bin);
 const mock=[
  '#!'+process.execPath,
  "const fs=require('node:fs'),path=require('node:path');",
  "const a=process.argv.slice(2),prefix=a[a.indexOf('--prefix')+1];",
  "const p=path.join(prefix,'node_modules','impeccable');",
  "fs.mkdirSync(path.join(p,'cli','bin'),{recursive:true});",
  "fs.writeFileSync(path.join(p,'package.json'),JSON.stringify({version:'4.7.1',optionalDependencies:{'@impeccable/cli-linux-x64':'0.1.17'}}));",
  "fs.writeFileSync(path.join(p,'cli','bin','cli.js'),\"console.log(JSON.stringify({args:process.argv.slice(2),cwd:process.cwd(),env:process.env}));process.exitCode=process.argv.includes('--finding')?2:0;\");",
  "console.log('MOCK_INSTALLED');"
 ].join('\n')+'\n';
 await fs.writeFile(path.join(bin,'npm'),mock,{mode:0o755});
 const env={PATH:bin+path.delimiter+process.env.PATH,OPENAI_API_KEY:'secret',IMPECCABLE_NO_TELEMETRY:'0'};
 const run=(...a)=>spawnSync(process.execPath,[script,...a],{cwd:tmp,env,encoding:'utf8'});
 const a=run('detect',project,'index.html');assert.equal(a.status,0,a.stderr);assert.match(a.stdout,/MOCK_INSTALLED/);
 const result=JSON.parse(a.stdout.split('\n').find(s=>s.startsWith('{')));
 assert.deepEqual(result.args,['detect','--json','index.html']);
 assert.equal(result.cwd,project);assert.equal(result.env.OPENAI_API_KEY,undefined);
 assert.equal(result.env.IMPECCABLE_NO_TELEMETRY,'1');assert.equal(result.env.DO_NOT_TRACK,'1');
 assert(result.env.HOME.startsWith(path.join(hq,'.hq/tools')));
 assert(result.env.IMPECCABLE_HOME.startsWith(path.join(hq,'.hq/tools')));
 assert(!result.env.NODE_OPTIONS);
 const b=run('detect',project,'index.html','--finding');assert.equal(b.status,2);assert.doesNotMatch(b.stdout,/MOCK_INSTALLED/);
 for(const verb of ['init','document','live','generate','critique-storage']){
  const bad=run(verb,project);assert.equal(bad.status,1);assert.match(bad.stderr,/intentionally excludes/);
 }
 const invalid=run('detect',project);assert.equal(invalid.status,1);assert.match(invalid.stderr,/Usage/);
 for(const p of ['PRODUCT.md','DESIGN.md','.impeccable'])assert.equal(await fs.access(path.join(project,p)).then(()=>true,()=>false),false);
 for(const o of offices.filter(o=>o.role!=='design')){
  const other=path.join(root,'skills',o.role,'impeccable');
  assert.equal(await fs.access(other).then(()=>true,()=>false),false);
 }
 const hqSkill=await fs.readFile(path.join(hq,'.pi/skills/impeccable/SKILL.md'),'utf8');
 for(const rule of ['hq_paper','hq_note','quality gate','Delivery gate','telemetry'])assert(hqSkill.toLowerCase().includes(rule.toLowerCase()),rule);
 const marker=JSON.parse(await fs.readFile(path.join(hq,'HQ-ROLE.json'),'utf8'));
 assert(marker.generated['.pi/skills/impeccable/scripts/impeccable.mjs']);
});
