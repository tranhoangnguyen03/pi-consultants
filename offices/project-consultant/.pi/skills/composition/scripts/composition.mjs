#!/usr/bin/env node
/** Local production entry point, not a sandbox for project HTML or third-party code. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const commands=new Set(['install','version','lint','check','snapshot','preview','render']);

export function invocation(command,project,options,{office,caller=process.cwd(),environment=process.env,browser}={}){
 if(!commands.has(command))throw new Error(`Use: composition.mjs <${[...commands].join('|')}> <project> [options]`);
 const tool=path.join(office,'.hq/tools/hyperframes-0.8.161'),home=path.join(tool,'home');
 const env={PATH:environment.PATH??'',HOME:home,XDG_CONFIG_HOME:path.join(home,'.config'),XDG_CACHE_HOME:path.join(home,'.cache'),XDG_STATE_HOME:path.join(home,'.state'),
  npm_config_cache:path.join(tool,'npm-cache'),npm_config_userconfig:path.join(home,'.npmrc'),npm_config_audit:'false',npm_config_fund:'false',
  HYPERFRAMES_NO_TELEMETRY:'1',DO_NOT_TRACK:'1',HYPERFRAMES_NO_UPDATE_CHECK:'1',HYPERFRAMES_NO_AUTO_INSTALL:'1',HYPERFRAMES_SKIP_SKILLS:'1',CI:'1'};
 if(browser){env.HYPERFRAMES_BROWSER_PATH=browser;env.PRODUCER_HEADLESS_SHELL_PATH=browser;}
 const args=[...options];
 for(let i=0;i<args.length;i++){
  if(args[i]==='--output'||args[i]==='-o'){if(!args[i+1])throw new Error('Output path required');args[++i]=path.resolve(caller,args[i]);}
  else if(args[i].startsWith('--output='))args[i]='--output='+path.resolve(caller,args[i].slice(9));
 }
 if(['render','snapshot'].includes(command)&&!args.some(a=>a==='--output'||a==='-o'||a.startsWith('--output=')))args.push('--output',path.join(project,command==='render'?'renders/composition.mp4':'.hyperframes/snapshots'));
 if(command==='preview')args.push('--no-open');
 return {tool,home,env,args:command==='version'?['--version']:[command,project,...args]};
}

export async function main(argv){
 const [command,input,...options]=argv;
 if(!input)throw new Error('Supply an existing composition project directory; see SKILL.md');
 const project=await fs.realpath(path.resolve(input));
 if(!(await fs.stat(project)).isDirectory())throw new Error('Project must be a directory');
 const office=path.resolve(skill,'../../..');
 if(!await fs.access(path.join(office,'.pi/hq.json')).then(()=>true,()=>false))throw new Error('Run the copy shipped in a generated consultant office');
 const candidates=[process.env.HYPERFRAMES_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
 let browser;for(const candidate of candidates)if(await fs.access(candidate).then(()=>true,()=>false)){browser=candidate;break;}
 if(['check','snapshot','render','preview'].includes(command)&&!browser)throw new Error('Install Chrome or set HYPERFRAMES_BROWSER_PATH; this runner does not download browsers');
 const run=invocation(command,project,options,{office,browser});
 await fs.mkdir(run.home,{recursive:true});
 // CLI auto-loads cwd/.env. Never use the client project as its working directory.
 if(await fs.access(path.join(run.home,'.env')).then(()=>true,()=>false))throw new Error('Remove .env from the isolated tool home before running');
 const manifest=path.join(run.tool,'package.json'),lock=path.join(run.tool,'package-lock.json');
 if(command==='install'){
  if(options.length)throw new Error('install takes no options');
  for(const name of ['package.json','package-lock.json'])await fs.copyFile(path.join(skill,'tool',name),path.join(run.tool,name));
  const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:run.tool,env:run.env,stdio:'inherit'});
  if(result.error)throw result.error;
  return result.status??1;
 }
 for(const [installed,bundled] of [[manifest,'package.json'],[lock,'package-lock.json']]){
  if(!await fs.readFile(installed).then(async bytes=>bytes.equals(await fs.readFile(path.join(skill,'tool',bundled))),()=>false))throw new Error('Tool missing or pin changed; run the explicit install step');
 }
 const cli=path.join(run.tool,'node_modules/hyperframes/bin/hyperframes.mjs');
 const pkg=JSON.parse(await fs.readFile(path.join(run.tool,'node_modules/hyperframes/package.json'),'utf8').catch(()=>'{"version":null}'));
 if(pkg.version!=='0.8.161')throw new Error('Installed CLI version differs; run the explicit install step');
 const result=spawnSync(process.execPath,[cli,...run.args],{cwd:run.home,env:run.env,stdio:'inherit'});
 if(result.error)throw result.error;
 return result.status??1;
}
if(process.argv[1]&&await fs.realpath(process.argv[1])===fileURLToPath(import.meta.url))main(process.argv.slice(2)).then(code=>{process.exitCode=code;}).catch(error=>{console.error(error.message);process.exitCode=1;});
