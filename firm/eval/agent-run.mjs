#!/usr/bin/env node
/** Opt-in model evaluation in a disposable local HQ. Credential scope is explicit; no MCP service is loaded. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assert,atomic,mkdir,id,readJSON} from '../src/util.mjs';
import {agentsMd} from '../scripts/agents-md.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2),opts={};for(let i=0;i<argv.length;i+=2){assert(argv[i]?.startsWith('--')&&argv[i+1],'Use --case ID --auth-agent PATH --pi BINARY [--model ID]');opts[argv[i].slice(2)]=argv[i+1];}
assert(opts.case&&opts['auth-agent'],'Explicit --case and --auth-agent are required. This invokes the selected model and may incur cost.');
const c=await readJSON(path.join(root,'eval/cases',`${opts.case}.json`));assert(!c.manual,'Use the manual protocol for this case');
const runId=`${c.id}-${new Date().toISOString().replaceAll(':','-')}-${id().slice(0,8)}`;
const runDir=path.resolve(opts.output??path.join(root,'.runtime/agent-evals'),runId);await mkdir(runDir);
const fixtureDir=path.join(runDir,'fixtures');await fs.cp(path.join(root,'eval/fixtures'),fixtureDir,{recursive:true});
const hq=path.join(runDir,'hq'),agent=path.join(runDir,'auth-agent');await mkdir(agent);await mkdir(path.join(hq,'.pi/extensions'));
for(const folder of ['src','extensions'])await fs.cp(path.join(root,folder),path.join(hq,folder),{recursive:true});
await fs.cp(path.join(root,'skills',c.role),path.join(hq,'.pi/skills'),{recursive:true});
await fs.writeFile(path.join(hq,'AGENTS.md'),await agentsMd(root,JSON.parse(await fs.readFile(path.join(root,'offices.json'),'utf8')).find(o=>o.role===c.role)));
await atomic(path.join(hq,'.pi/extensions/consultant.ts'),"export {default} from '../../extensions/index.ts';\n");
await atomic(path.join(hq,'.pi/hq.json'),{version:2,role:c.role,hq:'..',stateDir:'../.hq',sessionRoots:[],projectRoots:[fixtureDir],localReadRoots:[fixtureDir,'skills'],attachmentRoots:[],policy:{}});
await atomic(path.join(hq,'.pi/settings.json'),{sessionDir:'.hq/sessions',extensions:['-builtin:mcp'],defaultTools:c.role==='engineering'?['read','bash','edit','write','grep','find','ls']:['read','grep','find','ls']});
const defaults=await readJSON(path.resolve(opts['auth-agent'],'settings.json'),{}),selected={defaultProjectTrust:'always'};
for(const k of ['defaultProvider','defaultModel','defaultThinkingLevel'])if(defaults[k]!==undefined)selected[k]=defaults[k];
await atomic(path.join(agent,'settings.json'),selected);await atomic(path.join(agent,'mcp.json'),{mcpServers:{}});
for(const name of ['auth.json','models.json']){const src=path.resolve(opts['auth-agent'],name);try{await fs.access(src);await fs.symlink(src,path.join(agent,name));}catch(e){if(e.code!=='ENOENT')throw e;}}
const prompt=c.prompt.replaceAll('{{FIXTURES}}',fixtureDir),piArgs=['--print','--mode','json',...(opts.model?['--model',opts.model]:[]),prompt];
const transcript=await fs.open(path.join(runDir,'events.jsonl'),'w',0o600),stderr=await fs.open(path.join(runDir,'stderr.txt'),'w',0o600);
let timedOut=false;
const exit=await new Promise((resolve,reject)=>{
 const env={...process.env,PI_CODING_AGENT_DIR:agent};delete env.CONSHQ_CONFIG;delete env.CONSHQ_HOME;delete env.PI_PROFILE_SWITCH_DIR;
 const child=spawn(opts.pi??'pi',piArgs,{cwd:hq,env,stdio:['ignore',transcript.fd,stderr.fd]});let kill;
 const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');kill=setTimeout(()=>child.kill('SIGKILL'),1500);},Number(opts.timeout??180000));
 child.on('error',e=>{clearTimeout(timer);clearTimeout(kill);reject(e);});child.on('exit',(code,signal)=>{clearTimeout(timer);clearTimeout(kill);resolve({code,signal});});
}).finally(async()=>{await transcript.close();await stderr.close();});
await atomic(path.join(runDir,'run.json'),{runId,case:c.id,model:opts.model??'host default',exit,timedOut,status:'awaiting-human-scoring',scope:'Actual model invocation in a disposable locally-configured HQ; isolated test credentials, no MCP services, no directory dependency. Not the production plain-pi UX acceptance test.'});
await atomic(path.join(runDir,'score.json'),{case_id:c.id,run_id:runId,reviewer:null,scores:c.scoring.criteria.map(criterion=>({criterion,score:null,evidence:null})),hard_failure:null,interventions:null,notes:''});
console.log(`Run saved at ${runDir}\nReview evidence and fill score.json. Exit 0 is not an evaluation pass.`);process.exitCode=exit.code??1;
