import fs from 'node:fs/promises';
import path from 'node:path';
import {atomic, locked, readJSON, id, now, slug, assert, text, clone, redact} from './util.mjs';

export const NOTE_KINDS = ['finding','decision','proposal','open-question','feedback','superseded'];
export const NOTE_STATES = ['observed','proposed','confirmed','superseded','uncertain'];
const STORED_KINDS = new Set([...NOTE_KINDS,'checkpoint','session-consultation','action-receipt']);

export class CaseStore {
  constructor(root) { assert(path.isAbsolute(root), 'HQ case store must be an absolute path'); this.root = root; }
  directory(client, project) { return path.join(this.root, slug(client,'client'), slug(project,'project')); }
  writable(state) { assert([1,2].includes(state.version),'Unsupported case version'); }
  async open({client, project, title, workspace, sessionId}) {
    const dir = this.directory(client, project);
    return locked(dir, async () => {
      const file = path.join(dir, 'case.json');
      let state = await readJSON(file, null);
      if (!state) {
        assert(title, 'A new case needs a title; existing cases open with client and project only');
        state = {version:1, client, project, title:text(title,'title',500), revision:0, brief:'', workspaces:[], sessions:[], notes:[], createdAt:now(), updatedAt:now()};
      }
      this.writable(state);
      if (workspace) {
        assert(path.isAbsolute(workspace), 'Workspace must be absolute');
        const real = await fs.realpath(workspace);
        if (!state.workspaces.includes(real)) state.workspaces.push(real);
      }
      if (sessionId && !state.sessions.includes(sessionId)) state.sessions.push(sessionId);
      state.updatedAt = now(); await atomic(file, state); return clone(state);
    });
  }
  async read(client, project) {
    const state = await readJSON(path.join(this.directory(client,project), 'case.json'), null);
    assert(state, `No case ${client}/${project}; use list to find existing cases, or open with a title to create one`);
    this.writable(state);
    assert(state.client===client&&state.project===project,'Case identity does not match directory');
    return state;
  }
  async note(client, project, input) {
    assert(input.kind!=='action-receipt','Action receipts require the system receipt path');
    return this.appendNote(client,project,input,false);
  }
  async receipt(client,project,input) {
    return this.appendNote(client,project,{kind:'action-receipt',state:'observed',text:`${input.tool}: ${input.status}. Action ${input.actionId}`,sources:[`outbox:${input.actionId}`,`sha256:${input.digest}`],sessionId:input.sessionId},true);
  }
  async appendNote(client, project, input, system) {
    const dir = this.directory(client, project);
    return locked(dir, async () => {
      const state = await this.read(client,project);
      assert([1,2].includes(state.version),'Unsupported case version');
      if(state.version===2&&!system)text(input.attribution,'attribution',1000);
      assert(STORED_KINDS.has(input.kind), 'Unsupported note kind');
      assert(NOTE_STATES.includes(input.state), 'Explicit evidence state required');
      text(input.text, 'note', 16000);
      assert(Array.isArray(input.sources), 'sources must be an array; use [] and state uncertain when unavailable');
      if (input.state === 'confirmed') assert(input.sources.length > 0, 'Confirmed claims require evidence references');
      if (input.supersedes) assert(state.notes.some(n => n.id === input.supersedes), 'Superseded note does not exist');
      const target=Object.hasOwn(input,'engagementId')?input.engagementId:null;
      if(target!==null){
        assert(typeof target==='string'&&target.trim()===target&&target.length>0&&!['null','undefined','none'].includes(target.toLowerCase()),'Invalid engagementId; case-level records use null internally');
        assert(state.version===2,'Engagement notes require an upgraded v2 case');
        const e=state.engagements?.find(e=>e.id===target);assert(e&&e.state!=='closed',`engagementId ${JSON.stringify(target)} is missing from this case or closed; use scope:"case" for case-level feedback`);
      }
      if(input.sessionId&&!state.sessions.includes(input.sessionId))state.sessions.push(input.sessionId);
      const note = {id:id(), at:now(), kind:input.kind, state:input.state, text:redact(input.text), sources:input.sources.map(s => redact(text(s,'source',2000))),
        sessionId:input.sessionId ?? null, ...(state.version===2?{engagementId:input.engagementId??null,attribution:system?'outbox journal':input.attribution,writer:system?'system:outbox':'consultant'}:{}), ...(input.supersedes ? {supersedes:input.supersedes} : {})};
      state.notes.push(note); state.updatedAt = now();
      await atomic(path.join(dir,'case.json'), state); return note;
    });
  }
  async brief(client, project, expectedRevision, brief, sources, sessionId) {
    const dir = this.directory(client,project);
    return locked(dir, async () => {
      const state = await this.read(client,project);
      this.writable(state);
      assert(state.revision === expectedRevision, 'Brief conflict: reload the latest brief before revising');
      text(brief,'brief',16000); assert(Array.isArray(sources), 'Brief sources are required');
      if(sessionId&&!state.sessions.includes(sessionId))state.sessions.push(sessionId);
      state.brief = redact(brief); state.briefSources = sources; state.revision++; state.updatedAt = now();
      await atomic(path.join(dir,'case.json'), state); return {revision:state.revision, brief:state.brief};
    });
  }
  async list() {
    const result = [];
    for (const c of await fs.readdir(this.root,{withFileTypes:true}).catch(e => e.code==='ENOENT'?[]:Promise.reject(e))) {
      if (!c.isDirectory() || c.name.startsWith('.')) continue;
      let projects;
      try{projects=await fs.readdir(path.join(this.root,c.name),{withFileTypes:true});}
      catch{result.push({caseKey:c.name,error:'unreadable-client'});continue;}
      for (const p of projects) {
        if (!p.isDirectory() || p.name.startsWith('.')) continue;
        let s;
        try { s=await readJSON(path.join(this.root,c.name,p.name,'case.json'),null); }
        catch { result.push({caseKey:`${c.name}/${p.name}`,error:'unreadable'});continue; }
        if(s&&(![1,2].includes(s.version)||s.client!==c.name||s.project!==p.name)){result.push({caseKey:`${c.name}/${p.name}`,error:'unsupported-or-mismatched'});continue;}
        if (s) result.push({client:c.name, project:p.name, title:s.title, updatedAt:s.updatedAt, revision:s.revision});
      }
    }
    return result;
  }
}
