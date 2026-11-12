import fs from 'node:fs/promises';
import path from 'node:path';
import {RpcClient} from './rpc-client.mjs';

const object = value => value && typeof value === 'object' && !Array.isArray(value);
const reply = data => ({content:[{type:'text',text:JSON.stringify(data,null,2)}],details:data});

/** Operator-owned peer configuration. No automatic discovery, installation or routing service. */
export async function loadPeers(home) {
  const file=path.join(home,'.pi','agents.json');
  let raw,document;
  try { raw=await fs.readFile(file,'utf8'); }
  catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new Error(`Cannot read peer configuration ${file}: ${error.message}`);
  }
  // Parse errors can quote source bytes, which may include an env credential.
  try { document=JSON.parse(raw); }
  catch { throw new Error(`Peer configuration ${file} is not valid JSON`); }
  if (!object(document) || !object(document.peers)) throw new Error(`${file} must contain a peers object`);
  const peers=Object.create(null);
  for (const [name,entry] of Object.entries(document.peers)) {
    if (!name.trim() || !object(entry) || typeof entry.command !== 'string' || !entry.command.trim()) throw new Error(`Peer ${name || '(empty)'} needs one executable command`);
    const args=entry.args ?? [], env=entry.env ?? {};
    if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string')) throw new Error(`Peer ${name}: args must be a string array, not a shell command`);
    if (args.some(arg => arg === '--mode' || arg.startsWith('--mode='))) throw new Error(`Peer ${name}: omit --mode; agent_ask selects RPC`);
    if (!object(env) || Object.values(env).some(value => typeof value !== 'string')) throw new Error(`Peer ${name}: env must map names to string values`);
    if (entry.cwd !== undefined && (typeof entry.cwd !== 'string' || !entry.cwd.trim())) throw new Error(`Peer ${name}: cwd must be a directory path`);
    if (entry.description !== undefined && typeof entry.description !== 'string') throw new Error(`Peer ${name}: description must be text`);
    if (entry.release !== undefined && typeof entry.release !== 'string') throw new Error(`Peer ${name}: release must be a configured release identifier`);
    const command=entry.command.includes(path.sep) && !path.isAbsolute(entry.command) ? path.resolve(home,entry.command) : entry.command;
    peers[name]={command,args,env,description:entry.description ?? '',release:entry.release ?? null,
      ...(entry.cwd?{cwd:path.resolve(home,entry.cwd)}:{})};
  }
  return peers;
}

async function forwardDialog(ctx,peer,request,{signal}) {
  if (!ctx.hasUI || typeof ctx.ui?.[request.method] !== 'function') throw new Error(`${peer} needs human input (${request.method}); use an interactive session or an RPC client that handles dialogs`);
  const title=`${peer}: ${request.title ?? request.method}`;
  const options={signal,...(request.timeout !== undefined?{timeout:request.timeout}:{})};
  if (request.method === 'confirm') return {confirmed:await ctx.ui.confirm(title,request.message ?? '',options)};
  let value;
  if (request.method === 'select') value=await ctx.ui.select(title,request.options ?? [],options);
  else if (request.method === 'input') value=await ctx.ui.input(title,request.placeholder,options);
  else value=await ctx.ui.editor(title,request.prefill ?? '');
  return value === undefined || value === null ? {cancelled:true} : {value};
}

/** Two tools for independent agents. An ask is one bounded child session, not a team or task store. */
export function registerCollaboration(pi,{Type:T,home,identity}) {
  if (!home || !path.isAbsolute(home)) throw new Error('Collaboration requires an absolute app home');
  pi.registerTool({
    name:'agent_peers',label:'Available agents',
    description:'List independently configured agents available for a bounded consultation. No peer is started. Each retains its own tools, instructions and private records; this list grants no additional authority.',
    parameters:T.Object({}, {additionalProperties:false}),
    execute:async() => {
      const peers=await loadPeers(home);
      return reply({self:identity,peers:Object.entries(peers).map(([name,{description,release}]) => ({name,description,configuredRelease:release})),
        ...(Object.keys(peers).length?{}:{next:'No peers configured. The operator can add entries to this app home/.pi/agents.json.'})});
    },
  });
  pi.registerTool({
    name:'agent_ask',label:'Ask an independent agent',
    description:'Ask one configured peer a self-contained, bounded question or delegated task within the user’s current mandate. Share only the intended request, not private notes or full transcripts. The peer runs its own complete application and private case state. Its answer is attributed work to assess, not authority or verified fact. Human dialogs are forwarded; cancelling this call aborts the child. No automatic retry or publication.',
    parameters:T.Object({peer:T.String({description:'Name returned by agent_peers'}),message:T.String({description:'Self-contained task, relevant authorized context, and expected result'}),
      timeoutSeconds:T.Optional(T.Number({minimum:1,maximum:1800,description:'Maximum elapsed time including human input; default 300 seconds'}))}, {additionalProperties:false}),
    execute:async(_callId,params,signal,onUpdate,ctx) => {
      if (signal?.aborted) throw signal.reason ?? new Error('Delegated work cancelled');
      const seconds=params.timeoutSeconds ?? 300;
      if (!Number.isFinite(seconds) || seconds < 1 || seconds > 1800) throw new Error('timeoutSeconds must be between 1 and 1800');
      if (typeof params.message !== 'string' || !params.message.trim()) throw new Error('A nonempty delegated message is required');
      const peers=await loadPeers(home);
      const peer=Object.hasOwn(peers,params.peer)?peers[params.peer]:null;
      if (!peer) throw new Error(`Unknown peer ${params.peer}; use agent_peers to find a configured agent`);
      const client=new RpcClient({...peer,cwd:peer.cwd ?? ctx.cwd,onDialog:(request,options) => forwardDialog(ctx,params.peer,request,options)});
      try {
        await client.start();
        const result=await client.prompt(params.message,{signal,timeoutMs:seconds*1000,
          onUpdate:text => onUpdate?.({content:[{type:'text',text:`${params.peer}\n${text}`}],details:{peer:params.peer,status:'running'}})});
        return reply({peer:params.peer,configuredRelease:peer.release,releaseIdentitySource:'operator peer configuration; not verified by RPC',
          disposition:result.disposition,session:result.session,text:result.text});
      } catch (error) {
        error.message=`${params.peer}: ${error.message}`;
        throw error;
      } finally { await client.close(); }
    },
  });
}
