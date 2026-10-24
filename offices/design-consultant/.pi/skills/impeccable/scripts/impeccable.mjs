#!/usr/bin/env node
/** F-only Impeccable detector: HQ-owned tooling; client project remains read-only. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const PIN={package:'4.7.0',engine:'0.1.16'};
export const officeRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const toolRoot=path.join(officeRoot,'.hq','tools','impeccable-'+PIN.package);
const packageFile=path.join(toolRoot,'node_modules','impeccable','package.json');
const runnerFile=path.join(toolRoot,'node_modules','impeccable','cli','bin','cli.js');

function safeEnv(source=process.env){
 const home=path.join(toolRoot,'home');
 const env={
  PATH:source.PATH??'',HOME:home,USERPROFILE:home,
  XDG_CONFIG_HOME:path.join(home,'.config'),XDG_CACHE_HOME:path.join(home,'.cache'),
  XDG_STATE_HOME:path.join(home,'.state'),
  TMPDIR:path.join(toolRoot,'tmp'),TMP:path.join(toolRoot,'tmp'),TEMP:path.join(toolRoot,'tmp'),
  npm_config_cache:path.join(toolRoot,'npm-cache'),npm_config_userconfig:path.join(home,'.npmrc'),
  npm_config_audit:'false',npm_config_fund:'false',npm_config_update_notifier:'false',
  npm_config_ignore_scripts:'true',
  IMPECCABLE_HOME:path.join(toolRoot,'state'),
  IMPECCABLE_NO_TELEMETRY:'1',DO_NOT_TRACK:'1'
 };
 for(const k of ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy','NODE_EXTRA_CA_CERTS','SSL_CERT_FILE','SYSTEMROOT','WINDIR','COMSPEC']){
  if(source[k])env[k]=source[k];
 }
 return env;
}
function assertVersion(){
 if(!fs.existsSync(packageFile))return false;
 let pkg;
 try{pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));}
 catch{throw new Error('Impeccable installation has an invalid package manifest; inspect private HQ tools.');}
 if(pkg.version!==PIN.package)throw new Error('Impeccable version mismatch: expected '+PIN.package+', found '+pkg.version+'. Do not update automatically.');
 if(!Object.values(pkg.optionalDependencies??{}).includes(PIN.engine))throw new Error('Impeccable engine pin mismatch; expected '+PIN.engine+'.');
 if(!fs.existsSync(runnerFile))throw new Error('Impeccable CLI missing; local HQ installation is incomplete.');
 return true;
}
function prepare(){
 for(const p of [toolRoot,path.join(toolRoot,'home'),path.join(toolRoot,'tmp')])fs.mkdirSync(p,{recursive:true,mode:0o700});
}

export function run(argv,{spawn=spawnSync,environment=process.env,caller=process.cwd()}={}){
 const [verb,...args]=argv;
 if(!['install','version','detect'].includes(verb))throw new Error('Use: impeccable.mjs <install|version|detect>. This adapter intentionally excludes upstream init, document, live, generate and project-state workflows.');
 let cwd,targets;
 if(verb==='detect'){
  if(args.length<2)throw new Error('Usage: impeccable.mjs detect <project-directory> <file|directory|https-URL> [more targets or flags]');
  const [project,...rest]=args;
  if(!rest.some(s=>!s.startsWith('-')))throw new Error('Supply a target to detect.');
  cwd=fs.realpathSync(path.resolve(caller,project));
  if(!fs.statSync(cwd).isDirectory())throw new Error('Project must be a directory.');
  if(cwd===officeRoot)throw new Error('Set a client project directory, not the consultant office.');
  targets=rest;
 }else if(args.length){throw new Error(verb+' takes no arguments');}
 prepare();
 const env=safeEnv(environment);
 if(!assertVersion()){
  const cmd=['install','--prefix',toolRoot,'--no-save','--no-package-lock','--ignore-scripts','--no-audit','--no-fund','--no-update-notifier','impeccable@'+PIN.package];
  const r=spawn('npm',cmd,{cwd:toolRoot,env,stdio:['inherit',2,2]});
  if(r.error)throw r.error;
  if(r.status!==0)throw new Error('Impeccable download/install failed (exit '+(r.status??'signal')+'). No change made to the client project.');
  if(!assertVersion())throw new Error('Impeccable install succeeded but pinned CLI was not found.');
 }
 if(verb==='install'||verb==='version'){
  console.log('Impeccable '+PIN.package+' (engine '+PIN.engine+'); installed under private HQ tools. Telemetry disabled.');
  return 0;
 }
 const r=spawn(process.execPath,[runnerFile,'detect','--json',...targets],{cwd,env,stdio:'inherit'});
 if(r.error)throw r.error;
 if(r.status===null)throw new Error('Impeccable detector terminated by '+(r.signal??'unknown signal'));
 // 0=no primary findings; 2=findings; 1=operational failure.
 return r.status;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.exitCode=run(process.argv.slice(2));}
 catch(e){console.error('impeccable-hq: '+e.message);process.exitCode=1;}
}
