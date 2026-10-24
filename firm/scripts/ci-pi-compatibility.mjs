#!/usr/bin/env node
/** Real-Pi, no-model compatibility harness. Runs only after main updates or on manual dispatch. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const firm=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.dirname(firm);
const offices=JSON.parse(await fs.readFile(path.join(firm,'offices.json'),'utf8'));
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'pi-consultants-native-'));
const reportDir=process.env.PI_COMPAT_REPORT_DIR??path.join(tmp,'reports');
await fs.mkdir(reportDir,{recursive:true});
const failures=[];
try{
 const deployed=new Map();
 for(const office of offices){
  const target=path.join(tmp,office.folder);
  await fs.cp(path.join(repo,'offices',office.folder),target,{recursive:true});
  const marker=path.join(target,'.hq','ci-private-sentinel.txt');
  await fs.mkdir(path.dirname(marker),{recursive:true});
  await fs.writeFile(marker,`ci-private-${office.folder}\n`);
  deployed.set(office.folder,target);
 }
 async function probe(name,root){
  const report=path.join(reportDir,`${name}.json`);
  const run=spawnSync(process.execPath,[path.join(firm,'scripts/live-pi-smoke.mjs')],{
   cwd:repo,encoding:'utf8',timeout:240000,maxBuffer:12*1024*1024,
   env:{...process.env,PI_PROBE_CI:'1',HQ_PROBE_ROOT:root,HQ_PROBE_REPORT:report}
  });
  if(run.status!==0){
   failures.push(`${name}: exit ${run.status??'timeout'}\n${(run.stderr??'').slice(-4500)}\n${(run.stdout??'').slice(-2500)}`);
  }else console.log(`${name}: native Pi startup passed`);
 }
 for(const [name,root] of deployed){
  await probe(name,root);
  // Checking after every startup detects a peer overwriting another office's state.
  for(const [other,d] of deployed){
   const contents=await fs.readFile(path.join(d,'.hq/ci-private-sentinel.txt'),'utf8');
   if(contents!==`ci-private-${other}\n`)failures.push(`${name}: touched ${other}'s state`);
  }
 }
 // An office must still load after moving to a new directory with spaces.
 const moved=path.join(tmp,'moved engineering office');
 await fs.rename(deployed.get('engineering-consultant'),moved);
 await probe('engineering-relocated',moved);
 const sentinel=await fs.readFile(path.join(moved,'.hq/ci-private-sentinel.txt'),'utf8');
 if(sentinel!=='ci-private-engineering-consultant\n')failures.push('Relocation lost private HQ state');
}finally{
 // Keep only the bounded, safe JSON reports in the workflow artifact destination.
 if(process.env.PI_COMPAT_REPORT_DIR)await fs.rm(tmp,{recursive:true,force:true});
 else console.log(`Reports remain under temporary directory ${reportDir}`);
}
if(failures.length){console.error('Native Pi compatibility FAILED:\n'+failures.join('\n---\n'));process.exitCode=1;}
else console.log('Native Pi compatibility passed for each office and one relocation. No model prompt or external service action was made.');
