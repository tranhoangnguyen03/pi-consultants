/** Guard checks for the release model: generated offices stay equal to a fresh build, and third-party pins stay exact. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {temp} from './helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=(script,args)=>spawnSync(process.execPath,[path.join(root,'scripts',script),...args],{encoding:'utf8'});
async function built(t){const out=path.join(await temp(t),'offices');const r=run('setup.mjs',['--out',out,'--yes']);assert.equal(r.status,0,r.stderr);return {out,d:path.join(out,'user-consultant')};}

test('A version bump fails drift until the offices are rebuilt',async t=>{
 const {out}=await built(t);assert.equal(run('drift.mjs',[out]).status,0);
 const pkg=path.join(root,'package.json'),before=await fs.readFile(pkg,'utf8');
 try{
  await fs.writeFile(pkg,before.replace(/"version": "[^"]+"/,'"version": "9.9.9"'));
  const r=run('drift.mjs',[out]);
  assert.notEqual(r.status,0);assert.match(r.stderr,/HQ-ROLE\.json: differs from a fresh build/);assert.match(r.stderr,/package\.json: differs/);
  assert.equal(before.includes('9.9.9'),false);
 }finally{await fs.writeFile(pkg,before);}
});

test('Drift rejects a committed office file the factory does not produce',async t=>{
 // Pi auto-loads .pi/extensions and .pi/skills, so an unlisted file is executable code the gate must not pass.
 const {out,d}=await built(t);const evil=path.join(d,'.pi/extensions/injected.ts');
 await fs.mkdir(path.dirname(evil),{recursive:true});await fs.writeFile(evil,'export default {};\n');
 // The unlisted-file check reads git's tracked list, which needs a repository at the drift root.
 const git=spawnSync('git',['init','-q',out],{encoding:'utf8'});
 if(git.status!==0)t.skip('git unavailable');
 spawnSync('git',['-C',out,'add','-A'],{encoding:'utf8'});
 const r=run('drift.mjs',[out]);
 assert.notEqual(r.status,0);assert.match(r.stderr,/injected\.ts: not produced by the factory/);
});

test('Third-party pins are exact versions or full commit SHAs',async()=>{
 const toolset=JSON.parse(await fs.readFile(path.join(root,'toolset.json'),'utf8'));
 for(const spec of toolset.packages){
  const [kind,...rest]=spec.split(':'),target=rest.join(':');
  if(kind==='npm')assert.match(target,/@\d+\.\d+\.\d+$/,[spec,'must pin an exact version'].join(': '));
  else if(kind==='git')assert.match(target,/@[0-9a-f]{40}$/,[spec,'must pin a full commit SHA'].join(': '));
  else assert.fail(`Unsupported package source: ${spec}`);
 }
 for(const [name,server] of Object.entries(toolset.mcpServers??{}))
  for(const arg of (server.args??[]).filter(a=>!a.startsWith('-')))
   assert.match(arg,/@\d+\.\d+\.\d+$/,`${name}: ${arg} must pin an exact version`);
 const lock=JSON.parse(await fs.readFile(path.join(root,'skills/shared/composition/tool/package-lock.json'),'utf8'));
 for(const [name,entry] of Object.entries(lock.packages??{})){
  if(!name)continue;
  assert.ok(entry.integrity,`${name} has no integrity hash`);
  if(entry.resolved)assert.match(entry.resolved,/^https:\/\/registry\.npmjs\.org\//,`${name} resolves outside the npm registry: ${entry.resolved}`);
 }
});
