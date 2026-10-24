#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {atomic} from '../src/util.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const results=path.join(root,'eval/results');await fs.mkdir(results,{recursive:true});
const testFiles=(await fs.readdir(path.join(root,'tests'))).filter(n=>n.endsWith('.test.mjs')).sort().map(n=>`tests/${n}`);
const run=spawnSync(process.execPath,['--test','--test-concurrency=1','--test-reporter=tap',...testFiles],{cwd:root,encoding:'utf8',timeout:120000});
await atomic(path.join(results,'functional.tap'),(run.stdout??'')+(run.stderr??''));
const cases=[];for(const n of (await fs.readdir(path.join(root,'eval/cases'))).filter(n=>n.endsWith('.json')).sort()){const c=JSON.parse(await fs.readFile(path.join(root,'eval/cases',n),'utf8'));cases.push({id:c.id,role:c.role,status:'not_run',kind:c.manual?'manual/live acceptance':'model-behavior evaluation',reason:'This deterministic run does not invoke models or connected services.'});}
const {version}=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const summary={kitVersion:version,generatedAt:new Date().toISOString(),environment:{node:process.versions.node,platform:process.platform,arch:os.arch()},
 functional:{command:'npm test',exitCode:run.status,passed:Number(run.stdout?.match(/# pass (\d+)/)?.[1]??0),failed:Number(run.stdout?.match(/# fail (\d+)/)?.[1]??0),
 evidence:'functional.tap',scope:'Real local filesystem/state-machine/configuration/repository packaging; actual shipped local extension imported through a simulated host and test Type export. Synthetic service responses. No real Pi binary, provider or external service was exercised.'},
 behavioral:cases,live:{piRuntime:'not_run',profileSwitch:'not_required_in_v0.2',directoryTravel:'not_run',providerInference:'not_run',authenticatedServices:'not_run'},
 conclusion:run.status===0?'Local functional checks passed. Behavioral validity and live integration are not established by this run.':'Functional failures remain; inspect functional.tap.'};
await atomic(path.join(results,'verification.json'),summary);
await atomic(path.join(results,'VERIFICATION.md'),`# Verification report\n\nRun: ${summary.generatedAt}\n\n**${summary.functional.passed} passed; ${summary.functional.failed} failed.**\n\n${summary.functional.scope}\n\n## Not established\n\nReal Pi native HQ startup, arbitrary inherited global-extension combinations, directory-travel behavior, provider inference, authenticated service schemas/accounts and human/agent quality were not exercised by this run; consult separate exact-revision evidence. The ${cases.length} scenario files include prompts, fixtures, scoring and critical-failure conditions. They are not labelled as passes.\n\n## Reproduce\n\nRun \`npm run eval --prefix firm\` from the repository root. Raw output: \`functional.tap\`. Machine-readable status: \`verification.json\`. Use \`node firm/eval/agent-run.mjs\` from the repository root for opt-in model runs and \`firm/eval/README.md\` for manual/live acceptance.\n\nA passing test suite is evidence of specific properties, not a proof that all requirements hold in every environment.\n`);
console.log(JSON.stringify(summary,null,2));process.exitCode=run.status??1;
