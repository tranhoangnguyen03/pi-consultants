#!/usr/bin/env node
/** Restricted last30days runner: no host credentials, browser cookies, global caches, publishing or paid sources. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const hq=path.resolve(here,'../../../..');
const base=path.join(hq,'.hq','last30days');
const cmd=process.argv.slice(2);
if(cmd.length!==1||(!cmd[0]?.trim())||(cmd[0].startsWith('-')&&cmd[0]!=='--preflight')){
 console.error('Usage: node hq-safe-run.mjs "public research topic" | --preflight');
 process.exit(2);
}
const isPreflight=cmd[0]==='--preflight';
const env={
 PATH:process.env.PATH||'/usr/bin:/bin',
 HOME:path.join(base,'home'),
 XDG_CONFIG_HOME:path.join(base,'home','.config'),
 XDG_DATA_HOME:path.join(base,'home','.local','share'),
 XDG_CACHE_HOME:path.join(base,'home','.cache'),
 LANG:process.env.LANG||'C.UTF-8',
 LAST30DAYS_CONFIG_DIR:path.join(base,'config'),
 LAST30DAYS_MEMORY_DIR:path.join(base,'reports'),
 LAST30DAYS_DISCOVERY_QUEUE:'off',
 LAST30DAYS_LIBRARY_CONTEXT:'off',
 LAST30DAYS_STORE:'0',
 AGENTCOOKIE:'off',
 FROM_BROWSER:'off',
 BROWSER_CONSENT:'false',
 LAST30DAYS_TRUST_PROJECT_CONFIG:'0',
 INCLUDE_SOURCES:'reddit,hackernews,github,polymarket,devto'
};
for(const k of ['SYSTEMROOT','WINDIR','SSL_CERT_FILE','REQUESTS_CA_BUNDLE'])if(process.env[k])env[k]=process.env[k];
fs.mkdirSync(env.HOME,{recursive:true,mode:0o700});
fs.mkdirSync(env.LAST30DAYS_CONFIG_DIR,{recursive:true,mode:0o700});
fs.mkdirSync(env.LAST30DAYS_MEMORY_DIR,{recursive:true,mode:0o700});
let python;
for(const name of ['python3.14','python3.13','python3.12','python3']){
 const r=spawnSync(name,['-c','import sys; raise SystemExit(0 if sys.version_info >= (3,12) else 1)'],{env,timeout:10000});
 if(r.status===0){python=name;break;}
}
if(!python){
 console.error('last30days needs Python 3.12+; normal Research HQ tools remain available.');
 process.exit(2);
}
const script=path.join(here,'last30days.py');
const args=[script,...(isPreflight?['--preflight']:[cmd[0],'--no-browser-cookies','--search','reddit,hackernews,github,polymarket,devto','--emit=json','--save-dir',env.LAST30DAYS_MEMORY_DIR])];
const r=spawnSync(python,args,{cwd:hq,env,stdio:'inherit',timeout:300000});
if(r.error)console.error('last30days execution error:',r.error.message);
process.exit(r.status??1);
