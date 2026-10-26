#!/usr/bin/env node
/** Standalone Milestone A entry: launch native Pi from one existing engineering HQ. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const scriptDir=path.dirname(fileURLToPath(import.meta.url));
const builtInHQ=path.resolve(scriptDir,'../offices/engineering-consultant');
const bridge=path.join(scriptDir,'arrival-extension.ts');
const markers=['.git','package.json','pyproject.toml','go.mod','Cargo.toml','.pi','AGENTS.md'];
const usage=`Pi Consultants — standalone arrival proof (engineering only)

Usage:
  pi-consultants engineering [--project PATH] [--hq PATH]
  pi-consultants engineering --office-only [--hq PATH]
  pi-consultants engineering --project PATH --plan

A new Pi conversation starts in the selected engineering HQ. The worksite is
visited through the HQ's pinned pi-change-working-dir extension; the worksite's
.pi packages/settings/extensions are NOT loaded automatically.

Milestone A does not provide installation, session browsing, or resume.
Existing HQs are neither modified nor copied. The source-checkout office is
the default; --hq can name another existing engineering HQ.
`;

export function parseArgs(argv){
  if(!argv.length||argv.includes('--help')||argv.includes('-h'))return {help:true};
  const [role,...rest]=argv;
  if(role!=='engineering')throw Error(`Milestone A supports engineering only (got ${JSON.stringify(role)}).`);
  const result={role,project:null,hq:null,officeOnly:false,plan:false};
  for(let i=0;i<rest.length;i++){
    const arg=rest[i];
    if(arg==='--office-only'||arg==='--plan'){
      if(arg==='--office-only')result.officeOnly=true;else result.plan=true;
      continue;
    }
    if(arg==='--project'||arg==='--hq'){
      const value=rest[++i];
      if(!value||value.startsWith('--'))throw Error(`${arg} needs a directory path.`);
      const key=arg==='--project'?'project':'hq';
      if(result[key]!==null)throw Error(`${arg} may appear only once.`);
      result[key]=value;
      continue;
    }
    throw Error(`Unknown option ${JSON.stringify(arg)}. See pi-consultants --help.`);
  }
  if(result.officeOnly&&result.project)throw Error('--office-only cannot be combined with --project.');
  return result;
}

function expandHome(value){return value==='~'?os.homedir():value.startsWith('~/')?path.join(os.homedir(),value.slice(2)):value;}
async function directory(value,label){
  const resolved=path.resolve(expandHome(value));
  const real=await fs.realpath(resolved).catch(()=>{throw Error(`${label} not found: ${resolved}`)});
  if(!(await fs.stat(real)).isDirectory())throw Error(`${label} is not a directory: ${real}`);
  return real;
}
function inside(root,target){const rel=path.relative(root,target);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));}

export async function looksLikeProject(cwd,{home=os.homedir()}={}){
  let dir=await directory(cwd,'Current directory');
  const boundary=path.parse(dir).root;
  while(dir!==boundary&&dir!==home){
    for(const name of markers)if(await fs.access(path.join(dir,name)).then(()=>true,()=>false))return true;
    dir=path.dirname(dir);
  }
  return false;
}

export async function makePlan(args,{cwd=process.cwd(),repoHQ=builtInHQ,sessionId=randomUUID()}={}){
  if(args.help)throw Error('Help does not require a launch plan.');
  const hq=await directory(args.hq??repoHQ,'Engineering HQ');
  const roleInfo=JSON.parse(await fs.readFile(path.join(hq,'HQ-ROLE.json'),'utf8').catch(()=>{throw Error(`Not a built consultant HQ: ${hq}`)}));
  const configuration=JSON.parse(await fs.readFile(path.join(hq,'.pi/hq.json'),'utf8').catch(()=>{throw Error(`HQ configuration missing: ${hq}`)}));
  if(roleInfo.role!=='engineering'||configuration.role!=='engineering')throw Error(`Not an engineering HQ: ${hq}`);
  for(const required of ['AGENTS.md','.pi/settings.json','.pi/extensions/consultant.ts']){
    await fs.access(path.join(hq,required)).catch(()=>{throw Error(`HQ missing ${required}: ${hq}`)});
  }
  let project=null;
  if(!args.officeOnly){
    if(args.project)project=await directory(args.project,'Project');
    else if(await looksLikeProject(cwd))project=await directory(cwd,'Project');
    else throw Error('Current directory is not clearly a project. Supply --project PATH or --office-only.');
    if(inside(hq,project))throw Error('The project must not be the HQ or a directory inside its private home. Use --office-only instead.');
  }
  const piArgs=['--session-dir',path.join(hq,'.hq','sessions'),'--session-id',sessionId];
  if(project)piArgs.push('--extension',bridge);
  piArgs.push('--name',`Engineering · ${project?path.basename(project):'office consultation'}`);
  const env={PI_CONSULTANTS_ARRIVAL_PROJECT:project??'',PI_CONSULTANTS_ARRIVAL_SESSION_ID:sessionId};
  return {role:'engineering',hq,project,sessionId,piArgs,env,bridge,guide:'The project’s own .pi extensions and settings are not automatically loaded.'};
}

export function checkNode(version=process.versions.node){
  const [major=0,minor=0]=version.split('.').map(Number);
  if(major<24||(major===24&&minor<15))throw Error(`Node ${version} is too old for the pinned worksite extension (need >=24.15.0).`);
}
export function checkPiVersion(text){
  const match=String(text).match(/\b(\d+)\.(\d+)\.(\d+)\b/);
  if(!match)throw Error(`Cannot determine Pi version from ${JSON.stringify(String(text).slice(0,100))}`);
  const [major,minor]=match.slice(1).map(Number);
  if(major<1||(major===1&&minor<2))throw Error(`Pi ${match[0]} is below the repo's documented 1.2 baseline.`);
}
export async function launch(plan,{piExecutable=process.env.PI_CONSULTANTS_PI_BIN||'pi',nodeVersion=process.versions.node,run=spawn,probe=spawnSync}={}){
  checkNode(nodeVersion);
  const check=probe(piExecutable,['--version'],{encoding:'utf8',timeout:10000});
  if(check.error||check.status!==0)throw Error(`Pi is not available: ${check.error?.message??check.stderr?.trim()??'version probe failed'}. Install/sign in through https://pi.dev.`);
  checkPiVersion(check.stdout);
  console.log(`Engineering consultant\nProject: ${plan.project??'(office-only)'}\nHQ:      ${plan.hq}\nSession: New\nWorksite: ${plan.project?'Initializing inside Pi':'HQ'}\n${plan.project?plan.guide+'\n':''}`);
  const env={...process.env,...plan.env};
  return await new Promise((resolve,reject)=>{
    const child=run(piExecutable,plan.piArgs,{cwd:plan.hq,stdio:'inherit',env});
    child.once('error',reject);
    child.once('close',(code,signal)=>resolve(signal?128:code??1));
  });
}

async function main(){
  try{
    const args=parseArgs(process.argv.slice(2));
    if(args.help){console.log(usage);return;}
    const plan=await makePlan(args);
    if(args.plan){console.log(JSON.stringify({role:plan.role,hq:plan.hq,project:plan.project,session:'new',piArgs:plan.piArgs,warning:plan.guide},null,2));return;}
    process.exitCode=await launch(plan);
  }catch(error){console.error(`pi-consultants: ${error.message}`);process.exitCode=1;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
