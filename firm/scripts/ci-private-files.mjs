#!/usr/bin/env node
/** Reject tracked private state and high-confidence credential patterns. Defense in depth, not a complete secret detector. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');

export function forbiddenPath(name){
 const p=name.replaceAll('\\','/');
 const leaf=path.posix.basename(p);
 if(/(^|\/)\.hq(\/|$)/.test(p))return 'private HQ state';
 if(leaf==='.env'||(/^\.env\./.test(leaf)&&!/^\.env\.(example|sample|template)$/.test(leaf)))return 'environment credentials';
 if(/(^|\/)organization\/PLAYBOOK(?:\.local)?\.md$/.test(p))return 'private organization playbook';
 if(/(^|\/)\.pi\/(?:hq\.local\.json|mcp\.json)$/.test(p))return 'private Pi configuration';
 if(/(^|\/)\.pi\/agent\/(?:auth\.json|settings\.json)$/.test(p))return 'Pi account configuration';
 if(/(^|\/)(?:id_rsa|id_ed25519|id_ecdsa)(?:\.pub)?$/.test(p))return 'identity key';
 if(/\.(?:pem|p12|pfx)$/.test(leaf))return 'credential/certificate file';
 return null;
}
const patterns=[
 ['private key',/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/],
 ['GitHub token',/\bgh[pousr]_[A-Za-z0-9_]{30,}\b/],
 ['GitHub fine-grained token',/\bgithub_pat_[A-Za-z0-9_]{60,}\b/],
 ['AWS access key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
 ['Slack token',/\bxox[baprs]-[0-9A-Za-z-]{25,}\b/],
 ['OpenAI API key',/\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/]
];
export function secretMatches(content){return patterns.filter(([,p])=>p.test(content)).map(([n])=>n);}
const list=spawnSync('git',['ls-files','-z'],{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024});
if(list.status!==0){console.error('Unable to inspect tracked files: '+(list.stderr??''));process.exit(1);}
const files=list.stdout.split('\0').filter(Boolean),issues=[];
for(const rel of files){
 const reason=forbiddenPath(rel);
 if(reason){issues.push(`${rel}: ${reason}`);continue;}
 if(!/\.(?:md|txt|json|mjs|js|ts|sh|yaml|yml|toml|env|gitignore)$/i.test(rel))continue;
 const stat=await fs.stat(path.join(repo,rel));
 if(stat.size>1_000_000)continue; // Media and large third-party references are not scanned.
 const contents=await fs.readFile(path.join(repo,rel),'utf8');
 for(const hit of secretMatches(contents))issues.push(`${rel}: possible ${hit}`);
}
if(issues.length){console.error('Private-file and credential checks failed:\n'+issues.map(x=>' - '+x).join('\n'));process.exitCode=1;}
else console.log(`Private-file and credential checks passed (${files.length} tracked files). Pattern checks are not exhaustive.`);
