import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {temp} from './helpers.mjs';
import {hash} from '../src/util.mjs';
import {inventoryOf} from '../scripts/factory.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=(script,args)=>spawnSync(process.execPath,[path.join(root,'scripts',script),...args],{encoding:'utf8'});
const setup=(out,...args)=>run('setup.mjs',['--out',out,'--yes',...args]);
async function built(t){const out=path.join(await temp(t),'offices');const r=setup(out);assert.equal(r.status,0,r.stderr);return {out,d:path.join(out,'user-consultant')};}
const write=async(file,text)=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,text);};

test('Approved check 1+4: a re-run changes nothing and keeps user-added files',async t=>{
 const {out,d}=await built(t);await write(path.join(d,'.pi/skills/mine/SKILL.md'),'---\nname: mine\ndescription: user skill\n---\n');
 const before=await inventoryOf(out);const r=setup(out);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/user-consultant: unchanged/);
 assert.deepEqual(await inventoryOf(out),before);
});

test('Approved check 2: an update keeps private files byte for byte',async t=>{
 const {d}=await built(t);
 const privateFiles={'.hq/cases/demo/case.json':'{"notes":[1]}','organization/PLAYBOOK.md':'# ours','.env':'TOKEN=x','.pi/hq.local.json':'{"connectors":["linear"]}','.pi/mcp.json':'{"mcpServers":{}}'};
 for(const [p,text] of Object.entries(privateFiles))await write(path.join(d,p),text);
 // Simulate an older shipped version: an unedited AGENTS.md that the inventory still vouches for.
 const marker=JSON.parse(await fs.readFile(path.join(d,'HQ-ROLE.json'),'utf8'));
 await fs.writeFile(path.join(d,'AGENTS.md'),'old shipped text');marker.generated['AGENTS.md']=hash('old shipped text');await fs.writeFile(path.join(d,'HQ-ROLE.json'),JSON.stringify(marker));
 const r=setup(path.dirname(d),'--only','user');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/user-consultant: updated/);
 assert.notEqual(await fs.readFile(path.join(d,'AGENTS.md'),'utf8'),'old shipped text');
 for(const [p,text] of Object.entries(privateFiles))assert.equal(await fs.readFile(path.join(d,p),'utf8'),text,p);
});

test('Approved check 3: setup stops on an edited shipped file; --force backs it up first',async t=>{
 const {out,d}=await built(t);const agents=path.join(d,'AGENTS.md'),shipped=await fs.readFile(agents,'utf8');
 await fs.writeFile(agents,shipped+'\nmy local rule\n');const before=await inventoryOf(out);
 const stopped=setup(out,'--only','user');assert.notEqual(stopped.status,0);assert.match(stopped.stderr,/AGENTS\.md/);assert.deepEqual(await inventoryOf(out),before);
 const forced=setup(out,'--only','user','--force');assert.equal(forced.status,0,forced.stderr);
 assert.equal(await fs.readFile(agents,'utf8'),shipped);
 const [stamp]=await fs.readdir(path.join(d,'.hq/setup-backup'));assert.equal(await fs.readFile(path.join(d,'.hq/setup-backup',stamp,'AGENTS.md'),'utf8'),shipped+'\nmy local rule\n');
});

test('Approved check 5: the drift check fails when a shipped office no longer matches firm/',async t=>{
 const {out,d}=await built(t);assert.equal(run('drift.mjs',[out]).status,0);
 await fs.appendFile(path.join(d,'.pi/toolset.json'),' ');const r=run('drift.mjs',[out]);
 assert.notEqual(r.status,0);assert.match(r.stderr,/user-consultant\/\.pi\/toolset\.json: differs/);
});

test('Approved playbook check: installing the shared playbook never loses an existing different one',async t=>{
 const {out,d}=await built(t),shared=path.join(path.dirname(out),'shared-playbook.md');await fs.writeFile(shared,'# Shared org rules v2\n');
 const first=setup(out,'--playbook',shared);assert.equal(first.status,0,first.stderr);
 for(const o of ['engineering-consultant','project-consultant','user-consultant'])assert.equal(await fs.readFile(path.join(out,o,'organization/PLAYBOOK.md'),'utf8'),'# Shared org rules v2\n');
 await fs.writeFile(path.join(d,'organization/PLAYBOOK.md'),'# Older local copy\n');await write(path.join(d,'organization/PLAYBOOK.local.md'),'# D only\n');
 const again=setup(out,'--playbook',shared,'--only','user');assert.equal(again.status,0,again.stderr);assert.match(again.stdout,/playbook replaced/);
 assert.equal(await fs.readFile(path.join(d,'organization/PLAYBOOK.md'),'utf8'),'# Shared org rules v2\n');
 const [stamp]=await fs.readdir(path.join(d,'.hq/setup-backup'));assert.equal(await fs.readFile(path.join(d,'.hq/setup-backup',stamp,'organization/PLAYBOOK.md'),'utf8'),'# Older local copy\n');
 assert.equal(await fs.readFile(path.join(d,'organization/PLAYBOOK.local.md'),'utf8'),'# D only\n');
 assert.match(setup(out,'--playbook',shared).stdout,/playbook already current/);
});

test('Office Admin: --status inspects without mutating and --skill updates only named skills',async t=>{
 const {out,d}=await built(t),{version}=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
 assert.notEqual(run('setup.mjs',['--skill','composition']).status,0,'in-repo offices require --rebuild, not --skill');
 assert.notEqual(setup(out,'--skill',' , ').status,0,'reject empty --skill');
 assert.notEqual(setup(out,'--status','--force').status,0,'reject --status with update flags');
 await fs.rm(path.join(out,'engineering-consultant'),{recursive:true,force:true});
 const agents=path.join(d,'AGENTS.md'),skillFile=path.join(d,'.pi/skills/composition/SKILL.md');
 const marker=JSON.parse(await fs.readFile(path.join(d,'HQ-ROLE.json'),'utf8'));
 await fs.writeFile(agents,'older shipped agents');marker.generated['AGENTS.md']=hash('older shipped agents');
 await fs.rm(path.join(d,'.pi/skills/composition'),{recursive:true,force:true});
 for(const k of Object.keys(marker.generated))if(k.startsWith('.pi/skills/composition/'))delete marker.generated[k];
 marker.generated['.pi/skills/composition/retired-already-gone.md']='deadbeef';
 await fs.writeFile(path.join(d,'HQ-ROLE.json'),JSON.stringify(marker));
 const snapBefore=await inventoryOf(out);
 const st=setup(out,'--status');assert.equal(st.status,0,st.stderr);
 assert.deepEqual(await inventoryOf(out),snapBefore,'--status must not mutate any existing or missing office');
 assert.match(st.stdout,/engineering-consultant: not present/);
 assert.match(st.stdout,new RegExp(`user-consultant: v${version.replaceAll('.','\\.')} \\(\\d+ behind, 0 edited; playbook: missing\\)`));
 const roll=setup(out,'--skill','composition,public-presentation');assert.equal(roll.status,0,roll.stderr);
 assert.match(roll.stdout,/engineering-consultant: skipped \(not present\)/);
 assert.match(roll.stdout,/project-consultant: skills updated \(composition\)/);
 assert.match(roll.stdout,/user-consultant: skills updated \(composition, public-presentation\)/);
 assert.equal(await fs.readFile(agents,'utf8'),'older shipped agents','--skill must not replace non-skill files');
 assert.equal(await fs.access(skillFile).then(()=>true,()=>false),true);
 const postMarker=JSON.parse(await fs.readFile(path.join(d,'HQ-ROLE.json'),'utf8'));
 assert.equal('.pi/skills/composition/retired-already-gone.md' in postMarker.generated,false,'remove retired missing keys');
 assert.deepEqual(postMarker.practiceOverlays?.map(o=>o.skill),['composition','public-presentation']);
 assert.match(setup(out,'--status').stdout,/overlays: composition,public-presentation/);
 assert.match(setup(out,'--only','user','--skill','composition').stdout,/user-consultant: unchanged/);
 assert.match(setup(out,'--skill','public-presentation').stdout,/project-consultant: skipped \(not for role\)/);
 assert.notEqual(setup(out,'--only','coordination','--skill','public-presentation').status,0,'fail when --only targets role without skill');
 await fs.appendFile(skillFile,'\nlocal skill edit\n');
 assert.match(setup(out,'--status').stdout,/1 edited/);
 assert.notEqual(setup(out,'--only','user','--skill','composition').status,0,'stop on edited skill file');
 const forced=setup(out,'--only','user','--skill','composition','--force');assert.equal(forced.status,0,forced.stderr);
 const [stamp]=await fs.readdir(path.join(d,'.hq/setup-backup'));
 assert.match(await fs.readFile(path.join(d,'.hq/setup-backup',stamp,'.pi/skills/composition/SKILL.md'),'utf8'),/local skill edit/);
 // A subsequent full update reconciles HQ-ROLE.json (clears practiceOverlays) so drift passes.
 const full=setup(out);assert.equal(full.status,0,full.stderr);
 assert.equal(run('drift.mjs',[out]).status,0,'drift passes after full update clears skill overlays');
});
