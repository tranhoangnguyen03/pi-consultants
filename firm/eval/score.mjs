import fs from 'node:fs/promises';
import {assert} from '../src/util.mjs';
const file=process.argv[2];assert(file,'Supply the reviewed score.json path');const s=JSON.parse(await fs.readFile(file,'utf8'));
assert(s.reviewer&&typeof s.hard_failure==='boolean','An identified human reviewer and explicit hard_failure verdict are required');
assert(Array.isArray(s.scores)&&s.scores.length&&s.scores.every(x=>[0,1,2].includes(x.score)&&x.evidence),'Every criterion needs a score and evidence');
const avg=s.scores.reduce((a,x)=>a+x.score,0)/s.scores.length;
const pass=!s.hard_failure&&s.scores.every(x=>x.score>=1)&&avg>=1.75;
console.log(JSON.stringify({case:s.case_id,run:s.run_id,average:avg,status:pass?'pass':'fail',reviewer:s.reviewer,note:'Human-scored behavioral run; scope is the recorded scenario, not a universal guarantee.'},null,2));process.exitCode=pass?0:1;
