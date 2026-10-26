#!/usr/bin/env node
/** Read-only review-target preflight. Never fetches, checks out, or edits a repository. */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function parse(argv) {
  const out={mode:'workspace',repo:process.cwd(),paths:[]};
  let modeSeen=false;
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--help'||arg==='-h')return {help:true};
    if(!arg.startsWith('-')&&!modeSeen){out.mode=arg;modeSeen=true;continue;}
    const key={'--repo':'repo','--base':'base','--head':'head','--commit':'commit','--pr':'pr','--path':'paths'}[arg];
    if(!key)throw new Error(`Unknown option: ${arg}`);
    const value=argv[++i];
    if(!value||value.startsWith('--'))throw new Error(`Missing value for ${arg}`);
    if(key==='paths')out.paths.push(value);else out[key]=value;
  }
  if(!['workspace','branch','commit','pr','paths'].includes(out.mode))throw new Error(`Unsupported target: ${out.mode}`);
  const required={branch:['base'],commit:['commit'],pr:['pr'],paths:['paths']}[out.mode]??[];
  for(const key of required)if(!out[key]||(Array.isArray(out[key])&&!out[key].length))throw new Error(`${out.mode} needs ${key==='paths'?'--path':`--${key}`}`);
  return out;
}
function run(cmd,args,cwd,{optional=false}={}) {
  const r=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout:20000,maxBuffer:32*1024*1024,env:{...process.env,GIT_PAGER:'cat',GIT_OPTIONAL_LOCKS:'0'}});
  if(r.error||r.status!==0){
    if(optional)return null;
    throw new Error(`${cmd} ${args[0]??''} failed: ${r.error?.message??r.stderr?.trim().slice(0,600)??`exit ${r.status}`}`);
  }
  return r.stdout;
}
function names(raw){return [...new Set(raw.split('\0').filter(Boolean))].sort();}
function git(repo,...args){return run('git',args,repo);}
function rev(repo,ref){
  if(!ref||ref.startsWith('-'))throw new Error(`Invalid ref: ${ref}`);
  return git(repo,'rev-parse','--verify',`${ref}^{commit}`).trim();
}
function isDirty(repo){return Boolean(git(repo,'status','--porcelain','-z'));}
function preflight(opts){
  const repo=path.resolve(opts.repo),root=git(repo,'rev-parse','--show-toplevel').trim();
  const current=rev(root,'HEAD');
  const data={schema_version:1,mode:opts.mode,repo:root,current_head:current,base:null,head:null,merge_base:null,files:[],warnings:[],hints:[],source:'git'};
  if(opts.mode==='workspace'){
    data.base=current;data.head='working-tree';
    // A HEAD-to-working-tree diff can be empty when a staged edit was reversed in the worktree.
    // Inspect both index and worktree changes so neither side is silently omitted.
    const diffArgs=['--no-ext-diff','--no-textconv','--name-only','-z'];
    const staged=names(git(root,'diff','--cached',...diffArgs));
    const unstaged=names(git(root,'diff',...diffArgs));
    const other=names(git(root,'ls-files','--others','--exclude-standard','-z'));
    data.files=[...new Set([...staged,...unstaged,...other])].sort();
    data.staged_files=staged;data.unstaged_files=unstaged;data.untracked_files=other;
    data.hints.push('Inspect staged and unstaged diffs separately, plus untracked file contents; a HEAD-to-worktree diff alone may hide index changes. The list is not an automated code review.');
  }else if(opts.mode==='branch'){
    const base=rev(root,opts.base),head=rev(root,opts.head??'HEAD');
    const merge=git(root,'merge-base',base,head).trim();
    data.base=base;data.head=head;data.merge_base=merge;
    data.files=names(git(root,'diff','--no-ext-diff','--no-textconv','--name-only','-z',merge,head));
    if(isDirty(root))data.warnings.push('Working-tree changes are outside this committed branch comparison.');
    data.hints.push('Compare merge-base to head. Use source and test context beyond changed files when helpful.');
  }else if(opts.mode==='commit'){
    data.head=rev(root,opts.commit);
    const parents=git(root,'rev-list','--parents','-n','1',data.head).trim().split(/\s+/).slice(1);
    data.parents=parents;data.base=parents[0]??null;
    data.comparison=parents.length>1?'first-parent':parents.length===1?'parent':'root';
    data.files=names(parents.length
      ? git(root,'diff','--no-ext-diff','--no-textconv','--name-only','-z',parents[0],data.head)
      : git(root,'diff-tree','--root','--no-commit-id','--name-only','-r','-z',data.head));
    if(parents.length>1)data.hints.push('Merge commit: compare the selected commit against its first parent (base); this is not a combined parent diff.');
    data.hints.push('Inspect the chosen commit and its relevant callers, tests and contracts.');
  }else if(opts.mode==='paths'){
    data.head=current;data.source='snapshot';
    data.files=[...new Set(opts.paths.map(p=>{
      const abs=path.resolve(root,p),rel=path.relative(root,abs);
      if(rel==='..'||rel.startsWith(`..${path.sep}`)||path.isAbsolute(rel))throw new Error(`Path outside repository: ${p}`);
      if(!fs.existsSync(abs))throw new Error(`Path not found: ${p}`);
      return rel||'.';
    }))].sort();
    data.hints.push('Paths are snapshot targets, not changed-file diff coverage. Expand folders as needed.');
  }else if(opts.mode==='pr'){
    const raw=run('gh',['pr','view',opts.pr,'--json','number,url,title,baseRefOid,headRefOid,baseRefName,headRefName,changedFiles,files'],root);
    const pr=JSON.parse(raw);
    if(!pr.baseRefOid||!pr.headRefOid||!Array.isArray(pr.files))throw new Error('GitHub returned incomplete PR metadata');
    data.source='github';data.pr={number:pr.number,url:pr.url,title:pr.title,base_branch:pr.baseRefName,head_branch:pr.headRefName};
    data.base=pr.baseRefOid;data.head=pr.headRefOid;data.files=[...new Set(pr.files.map(f=>f.path).filter(Boolean))].sort();
    data.reported_file_count=pr.changedFiles;
    if(typeof pr.changedFiles==='number'&&pr.changedFiles>data.files.length)data.warnings.push(`GitHub returned ${data.files.length} of ${pr.changedFiles} changed files; use paginated gh api or git to inspect the full set.`);
    if(current!==data.head)data.warnings.push('Local HEAD differs from PR head. Do not use local working-tree contents as the PR revision.');
    data.hints.push('The head SHA records this metadata snapshot, but gh pr diff returns the LIVE PR diff, not an immutable diff pinned to that SHA. Recheck the PR head before and after retrieving the diff, or compare locally available immutable Git objects with git diff BASE_SHA...HEAD_SHA (merge-base comparison) when exact revision consistency matters. Recheck again before publishing comments. No checkout was performed.');
  }
  data.file_count=data.files.length;
  data.status=data.files.length?'ready':'empty';
  return data;
}
const help=`Usage: review-preflight.mjs [workspace|branch|commit|pr|paths] [options]\n\n  workspace                     staged, unstaged and untracked changes (default)\n  branch --base main [--head X] committed changes from merge-base to head\n  commit --commit SHA           files in one commit (merges: first parent)\n  pr --pr 123                   GitHub PR metadata, no checkout (needs gh)\n  paths --path src [--path docs] snapshot targets, not diff coverage\n  --repo PATH                   target repository directory (defaults to cwd)\n\nRead-only; writes JSON to stdout. Tool failure exits nonzero.\n`;
try{const args=parse(process.argv.slice(2));if(args.help){process.stdout.write(help);}else{process.stdout.write(JSON.stringify(preflight(args),null,2)+'\n');}}
catch(e){process.stderr.write(`Review preflight: ${e.message}\n${help}`);process.exitCode=2;}
