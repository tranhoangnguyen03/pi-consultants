/** Contract simulator, explicitly not a Pi binary. Loads the real local entry with no role/config flags. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),tools=new Map(),commands=new Map(),handlers=new Map(),entries=[],notifications=[];
const pi={registerTool:t=>tools.set(t.name,t),registerCommand:(n,c)=>commands.set(n,c),on:(n,h)=>{const a=handlers.get(n)??[];a.push(h);handlers.set(n,a);},
 events:{emit:(_n,p)=>{if(globalThis.executionOverride)p.result={cwd:globalThis.executionOverride};}},appendEntry:(customType,data)=>entries.push({type:'custom',customType,data}),
 getAllTools:()=>[...tools.values()],sendUserMessage:()=>{throw new Error('Unsolicited continuation');}};
const ctx={cwd:root,sessionManager:{getSessionId:()=> 'startup-fixture',getBranch:()=>entries},hasUI:true,
 ui:{setStatus:()=>{},notify:(text)=>notifications.push(text),editor:async(_title,text)=>text,confirm:async()=>true}};
tools.set('read',{name:'read',execute:async(_id,p)=>({content:[{type:'text',text:await fs.readFile(p.path,'utf8')}]})});
await (await import(pathToFileURL(path.join(root,'.pi/extensions/consultant.ts')).href)).default(pi);
for(const h of handlers.get('session_start')??[])await h({},ctx);
const own=name=>tools.get(name);
const call=async(name,args)=>{
 for(const h of handlers.get('tool_call')??[]){const r=await h({toolName:name,input:args,toolCallId:'fixture-id'},ctx);if(r?.block)throw new Error(r.reason);}
 return own(name).execute('fixture-id',args,new AbortController().signal,()=>{},ctx);
};
const firstSkill=(await fs.readdir(path.join(root,'.pi/skills')))[0];
await call('read',{path:path.join(root,'.pi/skills',firstSkill,'SKILL.md')}); // Must work before opening the first case.
await call('hq_navigate',{operation:'create',client:'fixture',project:'startup',title:'Native startup fixture',purpose:'Synthetic installation qualification'});
await call('hq_navigate',{operation:'select',caseKey:'fixture/startup'});
await call('hq_note',{scope:'case',attribution:'fixture observation',kind:'finding',state:'observed',text:'Local entry registered the consultant with no launch environment.',sources:['fixture:startup']});
await commands.get('hq').handler('',ctx);
console.log(JSON.stringify({root,tools:[...tools.keys()],commands:[...commands.keys()],notifications,entry:'local .pi/extensions/consultant.ts',firstSkillReadableBeforeCase:true,mode:'simulated-host-contract'}));
