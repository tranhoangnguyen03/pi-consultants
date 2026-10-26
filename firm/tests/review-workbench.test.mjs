import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const scripts=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../skills/engineering/change-review/scripts');
const preflight=path.join(scripts,'review-preflight.mjs');
const doctor=path.join(scripts,'review-tool-doctor.mjs');
function run(cwd,cmd,args=[],extraEnv={}){return spawnSync(cmd,args,{cwd,encoding:'utf8',env:{...process.env,...extraEnv}});}
function git(dir,...args){const r=run(dir,'git',args);assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function repo(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'review-workbench-test-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 git(dir,'init','-q');git(dir,'config','user.name','Test Agent');git(dir,'config','user.email','test@example.com');
 fs.writeFileSync(path.join(dir,'base.ts'),'export const a=1;\n');git(dir,'add','.');git(dir,'commit','-qm','base');
 return dir;
}
function review(dir,...args){const r=run(dir,process.execPath,[preflight,...args]);assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
test('workspace includes tracked and untracked, ignores ignored files',t=>{
 const dir=repo(t);fs.writeFileSync(path.join(dir,'base.ts'),'export const a=2;\n');fs.writeFileSync(path.join(dir,'new file.ts'),'new');fs.writeFileSync(path.join(dir,'.gitignore'),'ignored');fs.writeFileSync(path.join(dir,'ignored'),'x');
 const out=review(dir,'workspace');assert.equal(out.status,'ready');assert.deepEqual(out.files,['.gitignore','base.ts','new file.ts']);assert.deepEqual(out.untracked_files,['.gitignore','new file.ts']);
});
test('branch compares merge base and excludes dirty workspace',t=>{
 const dir=repo(t);git(dir,'branch','-M','main');git(dir,'checkout','-qb','feature');fs.writeFileSync(path.join(dir,'base.ts'),'export const a=9;\n');git(dir,'add','base.ts');git(dir,'commit','-qm','feature');fs.writeFileSync(path.join(dir,'extra.ts'),'not committed');
 const out=review(dir,'branch','--base','main');assert.deepEqual(out.files,['base.ts']);assert(out.warnings.some(w=>w.includes('Working-tree')));assert.equal(out.merge_base,git(dir,'rev-parse','main'));
});
test('single commit and snapshot paths are distinct from a diff',t=>{
 const dir=repo(t);const sha=git(dir,'rev-parse','HEAD');const out=review(dir,'commit','--commit',sha);assert.deepEqual(out.files,['base.ts']);
 const paths=review(dir,'paths','--path','base.ts');assert.equal(paths.source,'snapshot');assert.deepEqual(paths.files,['base.ts']);
});
test('workspace does not lose a staged edit reversed in the working tree',t=>{
 const dir=repo(t),original=fs.readFileSync(path.join(dir,'base.ts'),'utf8');
 fs.writeFileSync(path.join(dir,'base.ts'),'export const a=42;\n');git(dir,'add','base.ts');
 fs.writeFileSync(path.join(dir,'base.ts'),original);
 assert.equal(git(dir,'diff','--name-only','HEAD'),'');
 assert.match(git(dir,'status','--short'),/MM base\.ts/);
 const out=review(dir,'workspace');assert.equal(out.status,'ready');assert.deepEqual(out.files,['base.ts']);
 assert.deepEqual(out.staged_files,['base.ts']);assert.deepEqual(out.unstaged_files,['base.ts']);
 assert.deepEqual(out.untracked_files,[]);
});
test('merge commits compare against first parent rather than returning empty',t=>{
 const dir=repo(t);git(dir,'branch','-M','main');git(dir,'checkout','-qb','feature');
 fs.writeFileSync(path.join(dir,'feature.ts'),'export const feature=true;\n');git(dir,'add','.');git(dir,'commit','-qm','feature');
 git(dir,'checkout','main');fs.writeFileSync(path.join(dir,'main.ts'),'export const main=true;\n');
 git(dir,'add','.');git(dir,'commit','-qm','main');git(dir,'merge','--no-ff','-m','merge feature','feature');
 const sha=git(dir,'rev-parse','HEAD'),out=review(dir,'commit','--commit',sha);
 assert.equal(out.status,'ready');assert.deepEqual(out.files,['feature.ts']);
 assert.equal(out.head,sha);assert.equal(out.base,git(dir,'rev-parse','HEAD^1'));
 assert.equal(out.parents.length,2);assert.equal(out.comparison,'first-parent');
 assert.match(out.hints.join(' '),/first parent/);
});
test('bad ref fails clearly and never changes HEAD',t=>{
 const dir=repo(t);const before=git(dir,'rev-parse','HEAD');const r=run(dir,process.execPath,[preflight,'branch','--base','missing']);assert.equal(r.status,2);assert.match(r.stderr,/failed:/);assert.equal(git(dir,'rev-parse','HEAD'),before);
});
test('PR metadata warns about incomplete file page and stale local checkout without switching branches',t=>{
 const dir=repo(t);const before=git(dir,'rev-parse','HEAD');const bin=path.join(dir,'fakebin');fs.mkdirSync(bin);
 const exe=path.join(bin,'gh');fs.writeFileSync(exe,'#!/bin/sh\nprintf "%s\\n" \'{"number":123,"url":"https://github.com/a/b/pull/123","title":"test","baseRefOid":"abc","headRefOid":"def","baseRefName":"main","headRefName":"feature","changedFiles":2,"files":[{"path":"src/a.ts"}]}\'\n',{mode:0o755});
 const r=run(dir,process.execPath,[preflight,'pr','--pr','123'],{PATH:`${bin}${path.delimiter}${process.env.PATH??''}`});assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);assert.equal(out.file_count,1);assert.equal(out.reported_file_count,2);assert.equal(out.warnings.length,2);assert.match(out.hints.join(' '),/LIVE PR diff/);assert.equal(git(dir,'rev-parse','HEAD'),before);
});
test('doctor inspects availability without executing optional binaries',t=>{
 const dir=repo(t);const fake=path.join(dir,'fakebin');fs.mkdirSync(fake);fs.writeFileSync(path.join(fake,'ocr'),'#!/bin/sh\necho used > ./unexpected\n',{mode:0o755});
 const r=run(dir,process.execPath,[doctor,'--json'],{PATH:`${fake}${path.delimiter}${process.env.PATH??''}`});assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);assert.equal(out.read_only,true);assert.equal(out.tools.find(x=>x.name==='ocr').available,true);assert.equal(fs.existsSync(path.join(dir,'unexpected')),false);
});
