import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {invocation} from '../skills/shared/composition/scripts/composition.mjs';
import {buildOffice,loadFirm} from '../scripts/factory.mjs';
import {temp} from './helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skill=path.join(root,'skills/shared/composition');
test('Composition runner isolates inherited credentials and resolves local output paths',()=>{
 const run=invocation('render','/client/project',['--output','movie.mp4'],{office:'/office with spaces',caller:'/delivery',browser:'/chrome',environment:{PATH:'/bin',ANTHROPIC_API_KEY:'secret',CLAUDE_CODE_SESSION_ID:'private'}});
 assert.deepEqual(run.args,['render','/client/project','--output','/delivery/movie.mp4']);
 assert.equal(run.env.HOME,'/office with spaces/.hq/tools/hyperframes-0.8.161/home');
 assert.equal(run.env.ANTHROPIC_API_KEY,undefined);assert.equal(run.env.CLAUDE_CODE_SESSION_ID,undefined);
 for(const flag of ['HYPERFRAMES_NO_TELEMETRY','HYPERFRAMES_NO_UPDATE_CHECK','HYPERFRAMES_NO_AUTO_INSTALL','HYPERFRAMES_SKIP_SKILLS'])assert.equal(run.env[flag],'1');
 assert.equal(run.env.HYPERFRAMES_BROWSER_PATH,'/chrome');
 assert.deepEqual(invocation('snapshot','/project',[],{office:'/office'}).args,['snapshot','/project','--output','/project/.hyperframes/snapshots']);
 assert(invocation('preview','/project',[],{office:'/office'}).args.includes('--no-open'));
 assert.throws(()=>invocation('publish','/project',[],{office:'/office'}),/Use:/);
 assert.throws(()=>invocation('render','/project',['-o'],{office:'/office'}),/Path required/);
 for(const flag of ['--output','-o','--variables-file','--batch','--frames-cache-dir','--against']){
  for(const options of [[flag,'relative file'],[`${flag}=relative file`]]){
   const args=invocation('snapshot','/project',options,{office:'/office',caller:'/caller'}).args;
   const normalized=flag==='-o'?'--output':flag;
   assert(args.includes('/caller/relative file')||args.includes(`${normalized}=/caller/relative file`));
   if(flag==='-o'||flag==='--output')assert(!args.includes('/project/.hyperframes/snapshots'));
  }
  for(const options of [[flag],[`${flag}=`],[flag,'--fps']])assert.throws(()=>invocation('render','/project',options,{office:'/office'}),/Path required/);
 }
 for(const flag of ['--docker','--docker=true'])assert.throws(()=>invocation('render','/project',[flag],{office:'/office'}),/Docker/);
 const network=invocation('version','/project',[],{office:'/office',caller:'/caller',environment:{HTTPS_PROXY:'http://approved-proxy',NODE_EXTRA_CA_CERTS:'ca.pem',OPENAI_API_KEY:'secret'}}).env;
 assert.equal(network.HTTPS_PROXY,'http://approved-proxy');assert.equal(network.NODE_EXTRA_CA_CERTS,'/caller/ca.pem');assert.equal(network.OPENAI_API_KEY,undefined);
 assert.equal(network.TMPDIR,'/office/.hq/tools/hyperframes-0.8.161/tmp');
});
test('Composition references are fixed and every office carries the same portable method',async t=>{
 const sums=(await fs.readFile(path.join(skill,'references/upstream/SHA256SUMS'),'utf8')).trim().split('\n');
 for(const line of sums){const [digest,file]=line.split('  ');assert.equal(createHash('sha256').update(await fs.readFile(path.join(skill,'references/upstream',file))).digest('hex'),digest);}
 const d=await temp(t),{offices,toolset}=await loadFirm(root);
 for(const office of offices){
  const built=await buildOffice(root,office,toolset,path.join(d,office.folder));
  const moved=path.join(d,office.folder+' moved');await fs.rename(built,moved);
  for(const file of ['SKILL.md','SOURCE.md','scripts/composition.mjs','tool/package-lock.json'])assert.deepEqual(await fs.readFile(path.join(moved,'.pi/skills/composition',file)),await fs.readFile(path.join(skill,file)));
  const settings=await fs.readFile(path.join(moved,'.pi/settings.json'),'utf8');assert(!settings.includes('hyperframes'),'No incompatible npm/git skill package at startup');
  const alias=path.join(d,office.folder+' alias');await fs.symlink(moved,alias);
  const refused=spawnSync(process.execPath,[path.join(alias,'.pi/skills/composition/scripts/composition.mjs'),'publish',d],{encoding:'utf8'});
  assert.equal(refused.status,1);assert.match(refused.stderr,/Use:/,'CLI entry also executes through a symlink');
  assert.equal(await fs.access(path.join(moved,'.hq/tools')).then(()=>true,()=>false),false);
 }
});
