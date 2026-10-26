#!/usr/bin/env node
/** Inspect PATH only; no downloads, tool execution, configuration changes, or network calls. */
import fs from 'node:fs';
import path from 'node:path';

const tools=[
  ['git','baseline version control','required'],
  ['gh','GitHub pull requests and comments','optional'],
  ['ocr','OpenCodeReview file preview and path-matched rules','optional'],
  ['code-review-graph','cross-file impact graph','optional'],
  ['graphify','architecture and docs/code graph','optional'],
  ['ast-grep','structural source search','optional'],
  ['semgrep','static analysis rules','optional'],
  ['gitleaks','secret leak inspection','optional'],
  ['osv-scanner','dependency security checks','optional'],
  ['desloppify','codebase health inspection','optional'],
  ['codex','optional second-model review','optional'],
  ['pi','native Pi agent sessions','optional'],
];
function binary(name){
  const dirs=(process.env.PATH??'').split(path.delimiter);
  const suffixes=process.platform==='win32'?(process.env.PATHEXT??'.EXE;.CMD;.BAT').split(';'):[''];
  for(const dir of dirs)for(const suffix of suffixes){
    const file=path.join(dir||'.',name+suffix);
    try{const stat=fs.statSync(file);if(stat.isFile()&&(process.platform==='win32'||(stat.mode&0o111)!==0))return file;}catch{}
  }
  return null;
}
const report={schema_version:1,read_only:true,tools:tools.map(([name,purpose,policy])=>({name,purpose,policy,available:Boolean(binary(name))}))};
if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(report,null,2)+'\n');
else for(const t of report.tools)process.stdout.write(`${t.available?'available':'missing  '}  ${t.name.padEnd(19)} ${t.purpose}${t.policy==='required'?' [required]':''}\n`);
