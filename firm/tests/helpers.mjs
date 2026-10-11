import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {registerHQ} from '../src/pi-extension.mjs';
export async function temp(t) { const d=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),"consultant-hq-test-")));t.after(()=>fs.rm(d,{recursive:true,force:true}));return d; }
export function session(entries=[],id='session-one') {return [{type:'session',version:3,id,cwd:'/project',timestamp:'2026-10-01T09:00:00Z'},...entries].map(e=>JSON.stringify(e)).join('\n')+'\n';}
export const msg=(id,parentId,role,content)=>({type:'message',id,parentId,timestamp:'2026-10-01T09:00:00Z',message:{role,content}});
export const response=data=>({content:[{type:'text',text:JSON.stringify(data)}],details:{},structuredContent:data});
export const policy={
 'mcp__test__get':{effect:'read',service:'fixture',account:'account-one'},
 'mcp__test__post':{effect:'write',service:'fixture',account:'account-one'}
};
export const draft={tool:'mcp__test__post',args:{channel:'review',body:'This is late. The implementation is complete, but rollout remains blocked.'},purpose:'Align on a revised review date',destination:'review thread',caseKey:'client/project',ownerSession:'consultation-one'};
export function fakeType(){
 const T={};for(const n of ['String','Number','Unknown','Boolean'])T[n]=()=>({type:n.toLowerCase()});
 T.Object=p=>({type:'object',properties:p,required:Object.keys(p).filter(k=>!p[k].optional)});T.Array=x=>({type:'array',items:x});T.Union=x=>({anyOf:x});T.Literal=x=>({const:x});T.Optional=x=>({...x,optional:true});T.Record=(a,b)=>({type:'object',additionalProperties:b});return T;
}
export async function host(t,{role='coordination',answer,configExtra={}}={}) {
 const root=await temp(t);const project=path.join(root,'project');await fs.mkdir(project);await fs.mkdir(path.join(root,'hq'));
 const configPath=path.join(root,'hq.json');
 await fs.writeFile(configPath,JSON.stringify({version:1,role,hq:path.join(root,'hq'),kitRoot:root,localReadRoots:[project],projectRoots:[project],sessionRoots:[],policy,...configExtra}));
 const tools=new Map();const handlers=new Map();const commands=new Map();const entries=[];const sent=[];const notifications=[];const widgets=new Map();
 const ui={editor:async(_title,value)=>value,confirm:async()=>true,select:async()=>undefined,notify:(text,level)=>notifications.push({text,level}),setStatus:()=>{},setWidget:(key,lines)=>widgets.set(key,lines)};
 const ctx={cwd:project,hasUI:true,ui,sessionManager:{getSessionId:()=> 'consultation-one',getBranch:()=>entries},model:{id:'fixture-model'},modelRegistry:{}};
 const pi={registerTool:t=>tools.set(t.name,t),registerCommand:(n,c)=>commands.set(n,c),on:(n,h)=>{const a=handlers.get(n)??[];a.push(h);handlers.set(n,a);},
 events:{emit:()=>{}},appendEntry:(customType,data)=>entries.push({type:'custom',customType,data}),sendUserMessage:m=>sent.push(m),
 getAllTools:()=>[...tools.values()].map(t=>({name:t.name,description:t.description,parameters:t.parameters}))};
 let serial=0;
 const emit=async(name,event)=>{for(const h of handlers.get(name)??[]){const r=await h(event,ctx);if(r?.block)throw new Error(r.reason);}};
 async function call(name,input={},parent){
  const callId=`tool-${++serial}`;
  await emit('tool_call',{toolName:name,input,toolCallId:callId,parentToolCallId:parent});
  const t=tools.get(name);if(!t)throw new Error('Unknown fixture tool');
  const nestedCtx={...ctx,executeTool:(n,a)=>call(n,a,callId)};
  return t.execute(callId,input,new AbortController().signal,()=>{},nestedCtx);
 }
 const state=await registerHQ(pi,{Type:fakeType(),configPath,answer});
 const external=(name,fn)=>tools.set(name,{name,description:'Fixture service, not a live connector',parameters:{type:'object'},execute:async(_id,p)=>fn(p)});
 await emit('session_start',{});
 return {root,project,configPath,pi,ctx,call,emit,commands,tools,external,state,entries,sent,notifications,widgets};
}
