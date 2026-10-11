#!/usr/bin/env node
/** Opt-in actual-Pi startup acceptance. No model prompt or external write is issued.
 * Start plain pi and trust this HQ before running. RPC selects transport only. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {atomic,assert,hash} from '../src/util.mjs';
const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=process.env.HQ_PROBE_ROOT?path.resolve(process.env.HQ_PROBE_ROOT):sourceRoot;
const marker=JSON.parse(await fs.readFile(path.join(root,'HQ-ROLE.json'),'utf8'));
const probe=path.join(root,'.pi/extensions/_hq-live-probe.ts'),report=path.join(root,'.hq/pi-startup-probe.json');
assert(!await fs.access(probe).then(()=>true,()=>false),'A probe file already exists; inspect and remove it first');
await fs.mkdir(path.dirname(report),{recursive:true});await fs.rm(report,{force:true});
const globalAgent=process.env.PI_CODING_AGENT_DIR??path.join(process.env.HOME??'', '.pi/agent');
const tracked=['settings.json','AGENTS.md','APPEND_SYSTEM.md','SYSTEM.md','mcp.json'];
async function fingerprints(){const result={};for(const f of tracked){try{result[f]=hash(await fs.readFile(path.join(globalAgent,f)));}catch(e){if(e.code==='ENOENT')result[f]=null;else throw e;}}return result;}
const before=await fingerprints();
await fs.writeFile(probe,`import fs from 'node:fs/promises';
export default function(pi) {
 pi.on('session_start', async (_event,ctx) => {
  const value={cwd:ctx.cwd,systemPrompt:ctx.getSystemPrompt(),tools:pi.getAllTools().map(t=>t.name),noteSchema:pi.getAllTools().find(t=>t.name==='hq_note')?.parameters,commands:typeof pi.getCommands==='function'?pi.getCommands().map(c=>c.name):[]};
  await fs.writeFile(${JSON.stringify(report)},JSON.stringify(value,null,2));
 });
}\n`,{flag:'wx',mode:0o600});
let child;let stdout='',stderr='';let exit=null,error=null;
try{
 const env={...process.env};delete env.CONSHQ_CONFIG;delete env.CONSHQ_HOME;delete env.PI_PROFILE_SWITCH_DIR;
 child=spawn(process.env.PI_BINARY??'pi',['--offline','--mode','rpc'],{cwd:root,env,stdio:['pipe','pipe','pipe']});
 child.stdout.on('data',b=>stdout+=b.toString());child.stderr.on('data',b=>stderr+=b.toString());child.on('error',e=>error=e);child.on('exit',code=>exit=code);
 const deadline=Date.now()+45000;
 while(Date.now()<deadline&&!error&&exit===null&&!await fs.access(report).then(()=>true,()=>false))await new Promise(r=>setTimeout(r,100));
 if(error)throw error;
 assert(await fs.access(report).then(()=>true,()=>false),`No native startup probe. Pi must be installed, compatible, and this HQ trusted; check dependency installation. ${stderr}`);
 const result=JSON.parse(await fs.readFile(report,'utf8'));
 const checks=[];const check=(name,pass,detail)=>checks.push({name,passed:!!pass,detail});
 check('HQ working directory',await fs.realpath(result.cwd)===await fs.realpath(root),result.cwd);
 check('Consultant role instructions',result.systemPrompt.includes(marker.role==='engineering'?'# Engineering consultant':'# Coordination and communication consultant'),'From root AGENTS.md');
 check('Note attribution required in actual host schema',result.noteSchema?.required?.includes('attribution'),'Schema inspection, not model behavior');
 check('Note scope required in actual host schema',result.noteSchema?.required?.includes('scope'),'Schema inspection, not model behavior');
 for(const tool of ['hq_navigate','hq_engagement','hq_paper','hq_case','hq_note','hq_brief','session_find','session_consult','hq_actions','hq_execute','change_dir'])check(`Registered ${tool}`,result.tools.includes(tool),'Actual host registry');
 for(const name of await fs.readdir(path.join(root,'.pi/skills'))){const s=await fs.readFile(path.join(root,'.pi/skills',name,'SKILL.md'),'utf8');const title=s.match(/^name: (.+)$/m)[1];check(`Available skill ${title}`,result.systemPrompt.includes(title),'Native skill catalogue in system prompt');}
 for(const command of ['hq','consult','case-recap','close-consultation'])check(`Available command ${command}`,result.commands.includes(command),'Actual host command registry');
 const after=await fingerprints();check('Daily-driver source files unchanged',JSON.stringify(before)===JSON.stringify(after),'Native auth refresh files are deliberately excluded from this comparison');
 const summary={at:new Date().toISOString(),role:marker.role,scope:'Actual local Pi startup via RPC output mode, no model prompt sent',checks,
 limitations:['Interactive plain-pi trust/visual UX is a separate manual check.','MCP servers may connect during startup; no connector operations were requested.','Arbitrary inherited extension behavior is outside this test.']};
 await atomic(process.env.HQ_PROBE_REPORT??path.join(root,'eval/results/native-pi-startup.json'),summary);console.log(JSON.stringify(summary,null,2));process.exitCode=checks.every(c=>c.passed)?0:1;
}catch(e){console.error(`Native Pi check FAILED / unavailable: ${e.message}`);process.exitCode=1;
}finally{
 if(child&&exit===null){child.kill('SIGTERM');await new Promise(r=>setTimeout(r,300));if(exit===null)child.kill('SIGKILL');}
 await fs.rm(probe,{force:true});
}
