import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildOffice,loadFirm} from '../scripts/factory.mjs';
import {temp} from './helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('Composition launches the pinned CLI with isolated state and refuses unsafe setup',async t=>{
 const d=await temp(t),{offices,toolset}=await loadFirm(root);
 const office=await buildOffice(root,offices[0],toolset,path.join(d,'moved office'));
 const skill=path.join(office,'.pi/skills/composition'),runner=path.join(skill,'scripts/composition.mjs');
 const project=path.join(d,'project');await fs.mkdir(project);await fs.writeFile(path.join(project,'.env'),'OPENAI_API_KEY=project-secret');
 const tool=path.join(office,'.hq/tools/hyperframes-0.8.161'),home=path.join(tool,'home');
 const cliDir=path.join(tool,'node_modules/hyperframes');await fs.mkdir(path.join(cliDir,'bin'),{recursive:true});
 const pkg=path.join(cliDir,'package.json');await fs.writeFile(pkg,'{"version":"0.8.161"}');
 for(const name of ['package.json','package-lock.json'])await fs.copyFile(path.join(skill,'tool',name),path.join(tool,name));
 await fs.writeFile(path.join(cliDir,'bin/hyperframes.mjs'),"console.log(JSON.stringify({cwd:process.cwd(),args:process.argv.slice(2),env:process.env}));process.exitCode=Number(process.argv.includes('--fail'))*7;");
 const env={PATH:process.env.PATH,OPENAI_API_KEY:'inherited-secret',CLAUDE_CODE_SESSION_ID:'private',HYPERFRAMES_BROWSER_PATH:path.join(d,'missing-chrome'),HTTPS_PROXY:'http://approved-proxy'};
 const run=(command,options=[])=>spawnSync(process.execPath,[runner,command,project,...options],{cwd:d,env,encoding:'utf8'});
 const refused=(command,options,pattern)=>{const result=run(command,options);assert.equal(result.status,1,result.stdout);assert.match(result.stderr,pattern);};
 for(const command of ['version','preview']){
  const result=run(command,command==='preview'?['--stop']:[]);assert.equal(result.status,0,result.stderr);
  const child=JSON.parse(result.stdout);assert.equal(child.cwd,home);assert.equal(child.env.HOME,home);
  assert.equal(child.env.OPENAI_API_KEY,undefined);assert.equal(child.env.CLAUDE_CODE_SESSION_ID,undefined);
  assert.equal(child.env.HTTPS_PROXY,env.HTTPS_PROXY);assert.equal(child.env.TMPDIR,path.join(tool,'tmp'));
  assert.equal(child.env.HYPERFRAMES_NO_TELEMETRY,'1');assert.equal(child.env.HYPERFRAMES_SKIP_SKILLS,'1');
 }
 assert.equal(run('preview',['--status']).status,0);
 refused('check',[],/Invalid HYPERFRAMES_BROWSER_PATH/);
 env.HYPERFRAMES_BROWSER_PATH=process.execPath;
 const render=run('render',['-o=film.mp4','--variables-file','vars.json','--against=before.mp4']);assert.equal(render.status,0,render.stderr);
 assert.deepEqual(JSON.parse(render.stdout).args,['render',project,`--output=${path.join(d,'film.mp4')}`,'--variables-file',path.join(d,'vars.json'),`--against=${path.join(d,'before.mp4')}`]);
 assert.equal(run('render',['--fail']).status,7,'Preserve child exit code');
 refused('install',['--foo'],/install takes no options/);
 refused('render',['--docker'],/Docker/);
 await fs.writeFile(path.join(home,'.env'),'SECRET=x');refused('version',[],/Remove .env/);await fs.rm(path.join(home,'.env'));
 const lock=path.join(tool,'package-lock.json');await fs.appendFile(lock,' ');refused('version',[],/pin changed/);
 await fs.copyFile(path.join(skill,'tool/package-lock.json'),lock);await fs.writeFile(pkg,'{"version":"0.0.0"}');refused('version',[],/CLI version differs/);
 await fs.rm(lock);refused('version',[],/Tool missing/);
 const bin=path.join(d,'bin');await fs.mkdir(bin);
 await fs.writeFile(path.join(bin,'npm'),`#!${process.execPath}\nconsole.log(JSON.stringify({cwd:process.cwd(),args:process.argv.slice(2),env:process.env}));\n`);await fs.chmod(path.join(bin,'npm'),0o700);
 env.PATH=bin;
 const install=run('install');assert.equal(install.status,0,install.stderr);
 const installed=JSON.parse(install.stdout);assert.equal(installed.cwd,tool);
 assert.deepEqual(installed.args,['ci','--ignore-scripts','--no-audit','--no-fund']);assert.equal(installed.env.OPENAI_API_KEY,undefined);
 assert.deepEqual(await fs.readFile(lock),await fs.readFile(path.join(skill,'tool/package-lock.json')));
});

test('Model-evaluation offices give C and D shared composition and execution tools without invoking a model',async t=>{
 const d=await temp(t),auth=path.join(d,'empty-auth');await fs.mkdir(auth);
 const fake=path.join(d,'fake-pi');
 await fs.writeFile(fake,`#!${process.execPath}\nimport fs from 'node:fs';\nconst settings=JSON.parse(fs.readFileSync('.pi/settings.json','utf8'));\nif(!['bash','edit','write'].every(tool=>settings.defaultTools.includes(tool)))process.exit(2);\nif(!fs.existsSync('.pi/skills/composition/SKILL.md'))process.exit(3);\nconsole.log('Offline stub: no model invoked');\n`);
 await fs.chmod(fake,0o700);
 for(const caseId of ['QA-C01','QA-U01']){
  const result=spawnSync(process.execPath,[path.join(root,'eval/agent-run.mjs'),'--case',caseId,'--auth-agent',auth,'--pi',fake,'--output',path.join(d,caseId)],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
 }
});
