#!/usr/bin/env node
/** Prepare a disposable Git review target. No models, messaging, scoring or external services. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolveCase} from './cases.mjs';

const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
function git(directory,...args) {
  const env={...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',
    GIT_AUTHOR_NAME:'Fixture Author',GIT_AUTHOR_EMAIL:'fixture@example.invalid',
    GIT_COMMITTER_NAME:'Fixture Author',GIT_COMMITTER_EMAIL:'fixture@example.invalid',
    GIT_AUTHOR_DATE:'2026-01-01T00:00:00Z',GIT_COMMITTER_DATE:'2026-01-01T00:00:00Z'};
  for(const key of ['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE','GIT_CONFIG_COUNT']) delete env[key];
  const result=spawnSync('git',['-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false',...args],{cwd:directory,env,encoding:'utf8'});
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error('Fixture git '+args[0]+' failed: '+result.stderr.trim());
  return result.stdout.trim();
}
async function writeFiles(directory,files) {
  for(const [name,content] of Object.entries(files)) {
    if(path.isAbsolute(name)||name.split(/[\\/]/).some(p=>p==='..'||p==='.git')) throw new Error('Unsafe fixture path: '+name);
    const target=path.join(directory,name);
    if(content===null) { await fs.rm(target,{force:true}); continue; }
    await fs.mkdir(path.dirname(target),{recursive:true}); await fs.writeFile(target,content);
  }
}
export async function prepareCase(id,variant,directory,through) {
  const scenario=resolveCase(id,variant);
  const selected=through??scenario.stages.at(-1).name;
  const last=scenario.stages.findIndex(s=>s.name===selected);
  if(last<0) throw new Error('Unknown stage: '+selected);
  const target=path.resolve(directory),relative=path.relative(sourceRoot,target);
  if(!relative||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative))) throw new Error('Prepare fixtures outside the source checkout');
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.mkdir(target); // Deliberately refuse reuse/overwrite of an existing directory.
  await writeFiles(target,scenario.base);
  git(target,'init','-q','--initial-branch=main','--template=');
  git(target,'add','.'); git(target,'commit','-qm','Existing project and accepted context');
  const base=git(target,'rev-parse','HEAD'),revisions={base};
  git(target,'checkout','-qb','review');
  for(const entry of scenario.stages.slice(0,last+1)) {
    await writeFiles(target,entry.files); git(target,'add','-A');
    git(target,'commit','--allow-empty','-qm',entry.message);
    revisions[entry.name]=git(target,'rev-parse','HEAD');
  }
  // Do not expose future stages, answer keys or peer-only facts in the target or its Git history.
  return {case:id,variant,stage:selected,target,base,head:git(target,'rev-parse','HEAD'),revisions};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const args=process.argv.slice(2);
    if(args.length<3||args.length>4) throw new Error('Usage: node prepare.mjs CASE VARIANT NEW_DIRECTORY [STAGE]');
    console.log(JSON.stringify(await prepareCase(...args),null,2));
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
