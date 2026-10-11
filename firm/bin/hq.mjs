#!/usr/bin/env node
/** Optional one-time configuration only. Everyday startup is cd HQ && pi. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {mkdir,atomic,readJSON,assert,now,hash} from '../src/util.mjs';
import {loadHQConfig} from '../src/config.mjs';

const bundleRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const ROOT=path.basename(bundleRoot)==='.runtime'?path.dirname(bundleRoot):bundleRoot;
const argv=process.argv.slice(2), command=argv.shift()??'help', opts={};
for(let i=0;i<argv.length;i++){
  const a=argv[i];assert(a.startsWith('--'),`Unexpected argument ${a}`);
  assert(i+1<argv.length&&!argv[i+1].startsWith('--'),`Value required after ${a}`);
  (opts[a.slice(2)]??=[]).push(argv[++i]);
}
const one=(k,d)=>opts[k]?.at(-1)??d;
const root=path.resolve(one('root',ROOT)),configPath=path.join(root,'.pi/hq.json');
async function configure(){
  const base=await readJSON(configPath);assert(base.version===2,'Run this inside a v0.2 HQ repository');
  const file=path.join(root,'.pi/hq.local.json');const local=await readJSON(file,{});
  for(const [arg,key] of [['projects','projectRoots'],['sessions','sessionRoots'],['attachments','attachmentRoots']]){
    if(opts[arg]){local[key]=await Promise.all(opts[arg].map(async p=>{const full=await fs.realpath(path.resolve(p));assert((await fs.stat(full)).isDirectory(),`${arg} must name directories`);return full;}));}
  }
  if(opts.projects&&!opts.attachments)local.attachmentRoots=local.projectRoots;
  await atomic(file,local);
  if(opts.model||opts.provider||opts.thinking){
    const settingsPath=path.join(root,'.pi/settings.json');const settings=await readJSON(settingsPath);
    for(const [arg,key] of [['model','defaultModel'],['provider','defaultProvider'],['thinking','defaultThinkingLevel']])if(opts[arg])settings[key]=one(arg);
    await atomic(settingsPath,settings);
  }
  if(opts['mcp-source']){
    const target=path.join(root,'.pi/mcp.json');
    try{await fs.access(target);throw new Error('Local mcp.json already exists; edit it explicitly instead of overwriting it');}catch(e){if(e.code!=='ENOENT')throw e;}
    const supplied=await readJSON(path.resolve(one('mcp-source')));assert(supplied.mcpServers,'MCP source needs mcpServers');await atomic(target,supplied);
  }
  console.log(`Configured ${base.role} at ${root}\nOnly this HQ was changed. No launch command or environment variable is required.\nRun: cd ${JSON.stringify(root)} && pi\nApprove Pi's normal project-trust prompt on first use.\nRead/write connector policy is reviewed separately inside C with /hq policy-review.`);
}
async function doctor(){
  const c=await loadHQConfig(configPath);const checks=[];
  const add=(name,passed,detail)=>checks.push({name,passed:!!passed,detail});
  const [major,minor]=process.versions.node.split('.').map(Number);
  add('Node for directory package',major>24||(major===24&&minor>=15),`Running ${process.versions.node}; pinned pi-change-working-dir declares >=24.15.0. A lower version is outside its supported range even if a startup probe succeeds`);
  const pi=spawnSync(one('pi','pi'),['--version'],{encoding:'utf8',timeout:10000});
  const version=(pi.stdout??'').match(/(\d+)\.(\d+)\.(\d+)/);
  add('Pi baseline',pi.status===0&&version&&(+version[1]>0 || (+version[1]===0&&(+version[2]>99||(+version[2]===99&&+version[3]>=2)))),(pi.stdout??pi.error?.message??pi.stderr??'No Pi binary').trim());
  for(const file of ['AGENTS.md','.pi/settings.json','.pi/hq.json','.pi/extensions/consultant.ts']){
    const ok=await fs.access(path.join(root,file)).then(()=>true,()=>false);add(file,ok,'Native local resource');
  }
  const settings=await readJSON(path.join(root,'.pi/settings.json'));
  add('Native local sessions',settings.sessionDir==='.hq/sessions','No launcher-supplied session directory');
  add('HQ identity',c.hq===await fs.realpath(root),`${c.role}: ${c.hq}`);
  const skills=await fs.readdir(path.join(root,'.pi/skills'));add('Role skills',skills.length===(c.role==='engineering'?9:8),`${skills.length} local role skills`);
  add('Directory package declared',settings.packages?.some(p=>String(typeof p==='string'?p:p.source).includes('fitchmultz/pi-change-working-dir')),'Pinned project package; installed by Pi after trust');
  const report={verdict:checks.every(x=>x.passed)?'prerequisites_met':'prerequisites_unmet',scope:'Local prerequisites and files only, not a real Pi startup test',role:c.role,hq:c.hq,state:c.stateDir,globalExtensions:'Inherited normally; not filtered',sourceRoots:c.sessionRoots,checks};
  console.log(JSON.stringify(report,null,2));return checks.every(x=>x.passed)?0:1;
}
async function migrate(){
  assert(opts.from,'Specify --from /absolute/path/to/old/engineering-or-coordination-HQ');
  const source=await fs.realpath(path.resolve(one('from'))),old=await readJSON(path.join(source,'hq.json'));
  const c=await loadHQConfig(configPath);assert(old.role===c.role,'Source role does not match this HQ');
  for(const dir of ['cases','outbox']){
    const target=path.join(c.stateDir,dir);assert(!(await fs.access(target).then(()=>true,()=>false)),`Migration refuses existing ${target}`);
  }
  async function rejectLinks(file){
    const stat=await fs.lstat(file).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(!stat)return;
    assert(!stat.isSymbolicLink(),`Migration refuses symlink: ${file}`);
    if(stat.isDirectory())for(const name of await fs.readdir(file))await rejectLinks(path.join(file,name));
  }
  for(const dir of ['cases','outbox'])await rejectLinks(path.join(source,dir));
  await mkdir(c.stateDir);
  const evidence=[];
  for(const dir of ['cases','outbox']){
    const src=path.join(source,dir);if(!await fs.access(src).then(()=>true,()=>false))continue;
    await fs.cp(src,path.join(c.stateDir,dir),{recursive:true,errorOnExist:true,force:false,filter:p=>path.basename(p)!=='.transaction-lock'});
    evidence.push({source:src,destination:path.join(c.stateDir,dir)});
  }
  const outbox=path.join(c.stateDir,'outbox/outbox.json'),state=await readJSON(outbox,null);
  if(state){for(const a of state.actions){
    if(['draft','approved'].includes(a.status)){a.status='rejected';a.history.push({event:'migration-invalidated-unused-authority',at:now()});}
    else if(a.status==='in_flight'){a.status='unknown';a.history.push({event:'migration-preserved-uncertainty',at:now()});}
  }await atomic(outbox,state);}
  const localFile=path.join(root,'.pi/hq.local.json'),local=await readJSON(localFile,{});
  // Keep existing new-home configuration authoritative; import only unspecified allowed roots/policy.
  for(const key of ['sessionRoots','projectRoots','attachmentRoots','policy'])if(local[key]===undefined&&old[key]!==undefined)local[key]=old[key];
  await atomic(localFile,local);
  await atomic(path.join(c.stateDir,'migration.json'),{at:now(),source,sourceConfigHash:hash(await fs.readFile(path.join(source,'hq.json'))),evidence,
    note:'Source untouched. Completed receipts preserved. Unused approval invalidated. Old live sessions were not moved/resumed.'});
  console.log('Imported private cases and receipts. Old HQ is untouched. Unused approvals were invalidated. Old histories stay in place; allow their session root explicitly to consult them.');
}
try{
  if(command==='configure')await configure();
  else if(command==='doctor')process.exitCode=await doctor();
  else if(command==='migrate')await migrate();
  else if(command==='launch'||command==='init')throw new Error('v0.2 has no launch/init wrapper. Enter one HQ repository and run plain pi. Optional configuration: node .runtime/bin/hq.mjs configure.');
  else console.log('Consultant HQ 0.3.0\n\nEveryday use: cd /path/to/HQ && pi\n\nOptional one-time setup:\n  node .runtime/bin/hq.mjs configure --projects ROOT --sessions ROOT\n  node .runtime/bin/hq.mjs configure --provider PROVIDER --model MODEL --thinking high\n  node .runtime/bin/hq.mjs doctor\n  node .runtime/bin/hq.mjs migrate --from OLD_ROLE_HQ\n\n--projects, --sessions and --attachments may repeat.\nNormal Pi authentication and global resources are inherited. Nothing is installed or edited globally.\nNo profile selector, environment export, or custom launcher is required.');
}catch(e){console.error(`Consultant HQ: ${e.message}`);process.exitCode=1;}
