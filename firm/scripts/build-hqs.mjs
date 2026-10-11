#!/usr/bin/env node
/** Produce two independent repository trees; shared source is bundled, never linked to a third working directory. */
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {atomic,assert} from '../src/util.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.argv[2]??path.join(root,'dist'));
assert(output!==root,'Output cannot be the source root');
await fs.mkdir(output,{recursive:true});
for(const [folder,role] of [['engineering-consultant','engineering'],['project-consultant','coordination']]){
 const target=path.join(output,folder);assert(!await fs.access(target).then(()=>true,()=>false),`Output already exists: ${target}`);
 await fs.mkdir(path.join(target,'.runtime'),{recursive:true});
 for(const dir of ['src','extensions','bin'])await fs.cp(path.join(root,dir),path.join(target,'.runtime',dir),{recursive:true});
 await fs.copyFile(path.join(root,'LICENSE'),path.join(target,'LICENSE'));
 const settings={sessionDir:'.hq/sessions',quietStartup:true,
   packages:['git:github.com/fitchmultz/pi-change-working-dir@d0846a834036b17fd118d0ca1011331812cea52b'],
   defaultTools:['+read','+bash','+edit','+write','+grep','+find','+ls','+tool_search']};
 const config={version:2,role,hq:'..',stateDir:'../.hq',kitRoot:'..',sessionRoots:[],projectRoots:[],
   localReadRoots:[],attachmentRoots:[],
   maxSessionFiles:500,maxSessionBytes:16777216,maxConsultChars:80000,policy:{}};
 await fs.mkdir(path.join(target,'.pi/extensions'),{recursive:true});
 await fs.mkdir(path.join(target,'.pi/prompts'),{recursive:true});
 await fs.cp(path.join(root,'skills',role),path.join(target,'.pi/skills'),{recursive:true});
 await atomic(path.join(target,'.pi/settings.json'),settings);
 await atomic(path.join(target,'.pi/hq.json'),config);
 await atomic(path.join(target,'.pi/extensions/consultant.ts'),"// Native Pi auto-discovery. No process environment mutation.\nexport { default } from '../../.runtime/extensions/index.ts';\n");
 await atomic(path.join(target,'AGENTS.md'),(await fs.readFile(path.join(root,'profiles',role,'AGENTS.md'),'utf8')));
 const prompts={
  'consult.md':'---\ndescription: Start an open-ended consultation; no service selection needed\n---\nHelp me explore this concern, inspect relevant evidence, and recommend a proportionate next step. Choose and combine your methods yourself. Do not impose an intake form.\n\n$@\n',
  'case-recap.md':'---\ndescription: Recover relevant project history and distinguish current facts from old decisions\n---\nReview the relevant HQ case. Summarize the goal, supported decisions, changes since the last consultation, unresolved points, and your recommended next step. Recheck current status where it matters.\n\n$@\n',
  'close-consultation.md':'---\ndescription: Close with useful findings and durable case continuity, not paperwork\n---\nConclude this consultation: state what happened, verification and remaining uncertainty. Record only useful findings, decisions and unresolved points in the selected case. Do not send external updates or create another plan unless authorized.\n\n$@\n'
 };
 for(const [name,content] of Object.entries(prompts))await atomic(path.join(target,'.pi/prompts',name),content);
 await atomic(path.join(target,'.pi/mcp.json.example'),{mcpServers:{}});
 const pkg={name:`${folder}-hq`,private:true,type:'module',version:'0.3.0'};
 await atomic(path.join(target,'package.json'),pkg);
 const ignore='';await atomic(path.join(target,'.gitignore'),ignore+'\n# Private local HQ state and account configuration\n/.hq/\n/.env\n/organization/PLAYBOOK.md\n/.pi/hq.local.json\n/.pi/mcp.json\n/.pi/npm/\n/.pi/git/\n/.pi/runtime/\n/.pi/extensions/_hq-live-probe.ts\n');
 await atomic(path.join(target,'organization/PLAYBOOK.example.md'),'# Organization playbook\n\nOrganization: SET ME\nCanonical source: SET ME\nRevision: SET ME\n\nDescribe work identity, source precedence and working rules. Copy to PLAYBOOK.md and customize locally; do not publish client content.\n');
 await atomic(path.join(target,'README.md'),'# Consultant HQ\n\nRun `cp organization/PLAYBOOK.example.md organization/PLAYBOOK.md` and supply your organization rules. Run `cd <HQ> && pi` with compatible Pi/Node and normal authentication. The bundled runtime needs no firm checkout. Private .hq/, .env and local configuration must travel separately from git. Configure with `node .runtime/bin/hq.mjs configure --root /path/to/HQ --projects /path/to/project`. Check prerequisites with `node .runtime/bin/hq.mjs doctor`. The bundled CLI infers its HQ location; --root is optional. The pinned directory package declares Node >=24.15.0; doctor checks declared prerequisites, not actual startup or model quality.\n\nUpdates: build a separate candidate, compare factory-owned files and local customizations, stop active sessions, preserve organization/, .hq/, .env and local overrides, replace only agreed product files, then verify startup. No automatic updates or state migration.\n');
 const generated={};
 async function inventory(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await inventory(p);else generated[path.relative(target,p)]=createHash('sha256').update(await fs.readFile(p)).digest('hex');}}
 await inventory(target);
 await atomic(path.join(target,'HQ-ROLE.json'),{version:'0.3.0',sourceRevision:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout?.trim()||'unknown',sourceDirty:!!spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout?.trim(),role,folder,entry:'.pi/extensions/consultant.ts',configuration:'.pi/hq.json',usage:'cd here; pi',generated});
 // Prevent a misleading stale manifest from the source archive.
 await fs.rm(path.join(target,'SHA256SUMS'),{force:true});
 console.log(target);
}
