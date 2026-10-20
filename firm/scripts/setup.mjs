#!/usr/bin/env node
/** npm run setup: build missing offices, inspect status (--status), roll out skills (--skill), or safely update existing offices, then personalize each one.
 * Offices live in <repo>/offices/ by default. Options: --out DIR (offices outside the repo; existing ones are updated), --rebuild (update the in-repo offices from firm/),
 * --only ROLE,ROLE, --skill SKILL,SKILL (update only named skills in existing offices), --status (inspect without changes), --force (replace locally edited shipped files after backing them up),
 * --playbook FILE (install your organization's shared playbook in every office; a different existing one is backed up first), --yes (no questions). */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assert,atomic,canonical,readJSON,hash} from '../src/util.mjs';
import {loadFirm,buildOffice} from './factory.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const flags=new Set(),opts={};
for(let i=2;i<process.argv.length;i++){
 const a=process.argv[i];assert(a.startsWith('--'),`Unexpected argument ${a}`);
 if(['--out','--only','--playbook','--skill'].includes(a)){assert(process.argv[i+1],`Value required after ${a}`);opts[a.slice(2)]=process.argv[++i];}
 else{assert(['--rebuild','--force','--yes','--status'].includes(a),`Unknown option ${a}`);flags.add(a.slice(2));}
}
const target=path.resolve(opts.out??path.join(path.dirname(root),'offices'));
const exists=p=>fs.access(p).then(()=>true,()=>false);
const sha=async p=>(await exists(p))?hash(await fs.readFile(p)):null;
const backupOf=dir=>path.join(dir,'.hq/setup-backup',STAMP);
const STAMP=new Date().toISOString().replaceAll(':','-');

/** Inspect an office without modifying anything. */
async function status(dir,office,toolset){
 if(!await exists(dir))return 'not present';
 const marker=await readJSON(path.join(dir,'HQ-ROLE.json'),null);
 if(!marker?.generated||marker.role!==office.role){process.exitCode=1;return 'invalid or mismatched HQ-ROLE.json';}
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'hq-status-'));
 try{
  const fresh=await buildOffice(root,office,toolset,path.join(tmp,office.folder));
  const freshMarker=await readJSON(path.join(fresh,'HQ-ROLE.json')),next=freshMarker.generated,old=marker.generated;
  const current={};for(const p of new Set([...Object.keys(old),...Object.keys(next)]))current[p]=await sha(path.join(dir,p));
  const conflicts=Object.keys(current).filter(p=>current[p]!==null&&current[p]!==next[p]&&(p in old?current[p]!==old[p]:true));
  const markerBehind=marker.version!==freshMarker.version||(!marker.practiceOverlays?.length&&canonical(marker)!==canonical(freshMarker))?1:0;
  const behind=Object.keys(next).filter(p=>current[p]!==next[p]&&!conflicts.includes(p)).length+Object.keys(old).filter(p=>!(p in next)&&current[p]!==null).length+markerBehind;
  const pb=await exists(path.join(dir,'organization/PLAYBOOK.md'))?'playbook: present':'playbook: missing';
  const overlays=marker.practiceOverlays?.length?`; overlays: ${marker.practiceOverlays.map(o=>o.skill??o.name??'custom').join(',')}`:'';
  return `v${marker.version??'unknown'} (${!behind&&!conflicts.length?'up to date':`${behind} behind, ${conflicts.length} edited`}; ${pb}${overlays})`;
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
}

/** Replace factory-owned files (or only selected skills) with a fresh build. Private and user-added files are never touched. */
async function update(dir,office,toolset,skillNames){
 const marker=await readJSON(path.join(dir,'HQ-ROLE.json'),null);
 assert(marker?.generated&&marker.role===office.role,`${dir} is not a factory-built ${office.role} office; refusing to update it`);
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'hq-setup-'));
 try{
  const fresh=await buildOffice(root,office,toolset,path.join(tmp,office.folder));
  const freshMarker=await readJSON(path.join(fresh,'HQ-ROLE.json'));
  const activeSkills=skillNames?.filter(s=>Object.keys(freshMarker.generated).some(p=>p.startsWith(`.pi/skills/${s}/`)));
  if(skillNames){
   if(only)for(const s of skillNames)assert(activeSkills.includes(s),`Skill ${s} is not available for ${office.role}`);
   if(!activeSkills.length)return 'skipped (not for role)';
  }
  const inScope=activeSkills?p=>activeSkills.some(s=>p.startsWith(`.pi/skills/${s}/`)):()=>true;
  const next=Object.fromEntries(Object.entries(freshMarker.generated).filter(([p])=>inScope(p)));
  const old=Object.fromEntries(Object.entries(marker.generated).filter(([p])=>inScope(p)));
  const current={};for(const p of new Set([...Object.keys(old),...Object.keys(next)]))current[p]=await sha(path.join(dir,p));
  // A conflict is a shipped file the user edited, or a user file sitting where a new shipped file goes.
  // shortcut: `configure --model` edits the shipped .pi/settings.json, so it counts as an edit here; carry those keys over if users hit it.
  const conflicts=Object.keys(current).filter(p=>current[p]!==null&&current[p]!==next[p]&&(p in old?current[p]!==old[p]:true));
  const removedKeys=Object.keys(old).filter(p=>!(p in next));
  const stale=removedKeys.filter(p=>current[p]!==null);
  const filesMatch=!conflicts.length&&!removedKeys.length&&Object.keys(next).every(p=>current[p]===next[p]);
  if(filesMatch&&(activeSkills?activeSkills.every(s=>marker.practiceOverlays?.some(o=>o.skill===s&&o.version===freshMarker.version)):canonical(marker)===canonical(freshMarker)))return 'unchanged';
  if(conflicts.length&&!flags.has('force')){
   console.error(`${office.folder}: stopped, nothing changed. These shipped files were edited or are in the way:\n  ${conflicts.join('\n  ')}\nMove your changes into firm/ and run setup again, or rerun with --force to back them up into .hq/setup-backup/ and replace them.`);
   process.exitCode=1;return 'stopped';
  }
  const backup=backupOf(dir);
  for(const p of conflicts){await fs.mkdir(path.dirname(path.join(backup,p)),{recursive:true});await fs.copyFile(path.join(dir,p),path.join(backup,p));}
  for(const p of stale)await fs.rm(path.join(dir,p));
  for(const p of removedKeys)delete marker.generated[p];
  if(activeSkills){
   for(const p of Object.keys(next)){await fs.mkdir(path.dirname(path.join(dir,p)),{recursive:true});await fs.copyFile(path.join(fresh,p),path.join(dir,p));marker.generated[p]=next[p];}
   marker.practiceOverlays=[...(marker.practiceOverlays??[]).filter(o=>!activeSkills.includes(o.skill)),...activeSkills.map(skill=>({skill,version:freshMarker.version,at:STAMP}))];
   await atomic(path.join(dir,'HQ-ROLE.json'),marker);
   const label=`skills updated (${activeSkills.join(', ')})`;
   return conflicts.length?`${label} (backed up ${conflicts.length} edited file(s) in ${path.relative(dir,backup)})`:label;
  }
  for(const p of [...Object.keys(next),'HQ-ROLE.json']){await fs.mkdir(path.dirname(path.join(dir,p)),{recursive:true});await fs.copyFile(path.join(fresh,p),path.join(dir,p));}
  return conflicts.length?`updated (backed up ${conflicts.length} edited file(s) in ${path.relative(dir,backup)})`:'updated';
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
}

/** Install the organization's shared playbook as this office's snapshot. A different existing playbook is backed up, never lost. */
async function installPlaybook(dir,source){
 const target=path.join(dir,'organization/PLAYBOOK.md'),bytes=await fs.readFile(source);
 if(await sha(target)===hash(bytes))return 'playbook already current';
 let note='playbook installed';
 if(await exists(target)){const saved=path.join(backupOf(dir),'organization/PLAYBOOK.md');await fs.mkdir(path.dirname(saved),{recursive:true});await fs.copyFile(target,saved);note=`playbook replaced (previous one saved in ${path.relative(dir,saved)})`;}
 await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes,{mode:0o600});return note;
}

/** Ask a few questions and apply the answers through the office's own configure command. */
async function personalize(rl,dir,office){
 const hq=args=>spawnSync(process.execPath,[path.join(dir,'.runtime/bin/hq.mjs'),...args],{cwd:dir,encoding:'utf8'});
 if(!/^(y|yes|)$/i.test((await rl.question(`\nPersonalize ${office.folder} now? [Y/n] `)).trim()))return;
 const playbook=path.join(dir,'organization/PLAYBOOK.md');
 if(!await exists(playbook)&&/^(y|yes|)$/i.test((await rl.question('  Create organization/PLAYBOOK.md from the example (you edit it afterwards)? [Y/n] ')).trim()))
  await fs.copyFile(path.join(dir,'organization/PLAYBOOK.example.md'),playbook);
 const local=await readJSON(path.join(dir,'.pi/hq.local.json'),{}),args=[];
 const list=async(q,flag,now)=>{
  const a=(await rl.question(`  ${q}${now?.length?` [now: ${now.join(', ')}; Enter keeps]`:' [Enter skips]'}: `)).trim();
  for(const p of a?a.split(',').map(x=>x.trim()).filter(Boolean):[])args.push(flag,flag==='--connect'?p:p.replace(/^~(?=$|\/)/,os.homedir()));
 };
 await list('Project folders this consultant works in (comma-separated)','--projects',local.projectRoots);
 await list('Pi session folders it may search (comma-separated)','--sessions',local.sessionRoots);
 const servers=(await readJSON(path.join(dir,'.pi/toolset.json'),{})).mcpServers??{};
 console.log(`  Connectors (sign in later with /mcp inside Pi): ${Object.keys(servers).filter(n=>!servers[n].enabled).join(', ')}`);
 await list('Connectors to enable (comma-separated)','--connect',local.connectors);
 if(args.length){const r=hq(['configure',...args]);if(r.status!==0)console.error(`  Not saved: ${r.stderr.trim()}`);}
 const report=JSON.parse(hq(['doctor']).stdout||'{}');
 console.log(`  doctor: ${report.verdict??'unavailable'}`);
 for(const c of report.checks??[])if(!c.passed)console.log(`  needs attention: ${c.name}: ${c.detail}`);
 for(const s of report.software??[])if(!s.found)console.log(`  optional, missing: ${s.name} (${s.purpose}). Install: ${s.install}`);
}

const {offices,toolset}=await loadFirm(root);
const only=opts.only?.split(',').map(x=>x.trim()).filter(Boolean);
assert(!opts.only||only.length,'Value required after --only');
const skillNames=opts.skill?.split(',').map(x=>x.trim()).filter(Boolean);
assert(!opts.skill||skillNames.length,'Value required after --skill');
assert(!skillNames||opts.out,'--skill is for external working offices (--out DIR); use --rebuild for in-repo offices');
assert(!flags.has('status')||(!opts.skill&&!opts.playbook&&!flags.has('rebuild')&&!flags.has('force')),'--status cannot be combined with update options');
const selected=offices.filter(o=>!only||only.includes(o.role));
assert(selected.length,`No office matches --only ${opts.only}. Roles: ${offices.map(o=>o.role).join(', ')}`);
if(skillNames){
 for(const s of skillNames){
  const ok=await exists(path.join(root,'skills/shared',s,'SKILL.md'))||(await Promise.all(selected.map(o=>exists(path.join(root,'skills',o.role,s,'SKILL.md'))))).some(Boolean);
  assert(ok,`Skill ${s} is not available for ${selected.map(o=>o.role).join(', ')}`);
 }
}
if(flags.has('status')){
 for(const office of selected)console.log(`${office.folder}: ${await status(path.join(target,office.folder),office,toolset)}`);
 process.exit(process.exitCode??0);
}
await fs.mkdir(target,{recursive:true});
const done=[];
for(const office of selected){
 const dir=path.join(target,office.folder);
 let result;
 if(skillNames){
  assert(!only||await exists(dir),`Office not found: ${dir}`);
  result=await exists(dir)?await update(dir,office,toolset,skillNames):'skipped (not present)';
 }else{
  result=!await exists(dir)?(await buildOffice(root,office,toolset,dir),'built')
   :(opts.out||flags.has('rebuild'))?await update(dir,office,toolset):'kept as shipped (git pull updates it; --rebuild regenerates it)';
 }
 console.log(`${office.folder}: ${result}`);if(!result.startsWith('stopped')&&!result.startsWith('skipped'))done.push([dir,office]);
}
const interactive=!flags.has('yes')&&!skillNames&&process.stdin.isTTY;
const rl=interactive?readline.createInterface({input:process.stdin,output:process.stdout}):null;
let playbook=opts.playbook;
if(!playbook&&rl)try{playbook=(await rl.question("\nPath to your organization's shared playbook, installed in every office as organization/PLAYBOOK.md [Enter skips]: ")).trim().replace(/^~(?=$|\/)/,os.homedir())||undefined;}catch(e){if(e.name!=='AbortError')throw e;}
if(playbook){playbook=path.resolve(playbook);assert(await exists(playbook),`Playbook not found: ${playbook}`);for(const [dir,office] of done)console.log(`${office.folder}: ${await installPlaybook(dir,playbook)}`);}
if(rl){
 try{for(const [dir,office] of done)await personalize(rl,dir,office);}
 catch(e){if(e.name!=='AbortError')throw e;console.log('\nQuestions stopped. Offices are ready; run npm run setup again to personalize.');}
 finally{rl.close();}
}
console.log(`\nClose any running Pi session in an updated office before using it. Start one with: cd ${JSON.stringify(path.join(target,selected[0].folder))} && pi`);
