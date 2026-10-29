#!/usr/bin/env node
/** Bounded, non-crawling evidence collector. Read reports AND screenshots; this never scores or approves. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const variants=[
 {name:'desktop',viewport:{width:1440,height:900}},
 {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
 {name:'reduced',viewport:{width:1440,height:900},reducedMotion:'reduce'}
];
const cut=s=>String(s).slice(0,500);

export async function capture(spec,{chromium,axeSource}={}){
 const report={...spec,startedAt:new Date().toISOString(),status:'incomplete',pages:[],limits:[
  'Explicit URLs only; no crawl, clicks, form submission, saved login or production deployment.',
  'Screenshots and scripted checks are not user research or acceptance. A reviewer must inspect every relevant image.',
  'Performance is a single short lab sample, not field Core Web Vitals. INP, FPS, sound and subjective motion quality are not measured.',
  'Build mode/revision describe the caller worksite, not proof of the served build. Compare that provenance before review.',
  'Page scripts and normal subresources may contact their own services. Tool telemetry is disabled; target-site analytics are not controlled.'
 ]};
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(spec.browser?{executablePath:spec.browser}:{})});
  for(let i=0;i<spec.urls.length;i++){
   const url=spec.urls[i],entry={url,variants:[]};report.pages.push(entry);
   for(const v of variants){
    const data={name:v.name,viewport:v.viewport,files:[],errors:[],failedRequests:[],accessibility:{status:'not-run'},performance:{status:'not-run'}};
    entry.variants.push(data);let context;
    try{
     const {name,...settings}=v;
     context=await browser.newContext({...settings,deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false});
     // No hidden navigation to unrelated destinations; ordinary CDN subresources remain allowed.
     await context.route('**/*',async route=>{
      const req=route.request();
      if(req.isNavigationRequest()&&new URL(req.url()).origin!==new URL(url).origin)return route.abort('blockedbyclient');
      return route.continue();
     });
     await context.addInitScript(()=>{
      window.__fQaVitals={lcp:null,cls:null,supported:[]};
      for(const type of ['largest-contentful-paint','layout-shift']){
       try{
        new PerformanceObserver(list=>{for(const e of list.getEntries()){
         if(type==='largest-contentful-paint')window.__fQaVitals.lcp=e.startTime;
         else if(!e.hadRecentInput)window.__fQaVitals.cls=(window.__fQaVitals.cls??0)+e.value;
        }}).observe({type,buffered:true});
        window.__fQaVitals.supported.push(type);
        if(type==='layout-shift')window.__fQaVitals.cls=0;
       }catch{}
      }
     });
     const page=await context.newPage();page.setDefaultTimeout(8000);
     page.on('console',m=>{if(m.type()==='error'&&data.errors.length<20)data.errors.push(cut(m.text()));});
     page.on('pageerror',e=>{if(data.errors.length<20)data.errors.push(cut(e.message));});
     page.on('requestfailed',r=>{if(data.failedRequests.length<20)data.failedRequests.push({url:r.url(),error:cut(r.failure()?.errorText)});});
     if(v.name==='mobile'){
      const cdp=await context.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
      data.throttle={cpuRate:4,latencyMs:150,downloadBytesPerSecond:200000,uploadBytesPerSecond:93750};
     }
     const response=await page.goto(url,{waitUntil:'load',timeout:20000});
     data.httpStatus=response?.status()??null;data.finalUrl=page.url();
     if(!response||response.status()>=400)throw new Error('Navigation did not reach a successful page: '+data.httpStatus);
     await page.waitForTimeout(1200);
     await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1000))]));
     const shot=async suffix=>{const file=`page-${i+1}-${v.name}-${suffix}.png`;await page.screenshot({path:path.join(spec.run,file),timeout:10000});data.files.push(file);};
     await shot('top');
     data.dom=await page.evaluate(()=>({
      title:document.title,description:document.querySelector('meta[name="description"]')?.content??null,
      canonical:document.querySelector('link[rel="canonical"]')?.href??null,lang:document.documentElement.lang,
      headings:[...document.querySelectorAll('h1,h2,h3')].slice(0,30).map(e=>({level:e.tagName,text:e.textContent.trim().slice(0,120)})),
      mains:document.querySelectorAll('main,[role="main"]').length,
      // On mobile, innerWidth may expand to fit overflowing content; root clientWidth is the viewport.
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
      widths:{content:document.documentElement.scrollWidth,layoutViewport:document.documentElement.clientWidth,inner:innerWidth,visual:visualViewport?.width??null},
      imagesWithoutAlt:[...document.querySelectorAll('img:not([alt])')].slice(0,10).map(e=>e.getAttribute('src')),
      passwordField:Boolean(document.querySelector('input[type="password"]')),
      emptyBody:!document.body?.innerText.trim(),
      viewport:{width:innerWidth,height:innerHeight},
      reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches
     }));
     const vitals=await page.evaluate(()=>({...(window.__fQaVitals??{}),observedAtMs:performance.now()}));
     data.performance={status:'sampled',...vitals,buildMode:spec.build.mode};
     // Do not silently call a login screen, blank content or bot challenge the reviewed product.
     data.targetCheck={needsReviewerInspection:true,possibleLogin:data.dom.passwordField,empty:data.dom.emptyBody};
     await page.evaluate(()=>scrollTo(0,Math.min(document.documentElement.scrollHeight-innerHeight,Math.max(innerHeight,document.documentElement.scrollHeight/2))));
     await page.waitForTimeout(200);await shot('middle');await page.evaluate(()=>scrollTo(0,0));
     if(axeSource){
      try{
       await page.evaluate(axeSource);
       const axe=await page.evaluate(async()=>{
        const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
        return {violations:r.violations.map(x=>({id:x.id,impact:x.impact,help:x.help,helpUrl:x.helpUrl,nodes:x.nodes.slice(0,10).map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(x=>({id:x.id,nodes:x.nodes.length})),passes:r.passes.length};
       });
       data.accessibility={status:'checked',...axe};
      }catch(e){data.accessibility={status:'unavailable',reason:cut(e.message)};}
     }else data.accessibility={status:'unavailable',reason:'axe-core was unavailable; no accessibility pass is claimed.'};
     if(v.name==='desktop'){
      data.keyboard=[];
      for(let j=0;j<4;j++){
       await page.keyboard.press('Tab');
       data.keyboard.push(await page.evaluate(()=>{
        const e=document.activeElement,s=e?getComputedStyle(e):null,b=e?.getBoundingClientRect();
        return {tag:e?.tagName,label:(e?.textContent??'').trim().slice(0,100),outline:s?.outline,boxShadow:s?.boxShadow,inViewport:b?b.width>0&&b.height>0&&b.top>=0&&b.top<innerHeight:false};
       }));
       if(j===0||j===3)await shot('focus-'+(j+1));
      }
      await page.evaluate(()=>scrollTo(0,0));
      const controls=page.locator('a:visible,button:visible');
      data.hover=[];
      for(let j=0;j<await controls.count()&&data.hover.length<2;j++){
       const control=controls.nth(j),box=await control.boundingBox();
       if(!box||box.x<0||box.y<0||box.x>=v.viewport.width||box.y>=v.viewport.height)continue;
       const file=`page-${i+1}-hover-${j+1}`;
       try{
        await page.mouse.move(0,0);await control.screenshot({path:path.join(spec.run,file+'-rest.png')});
        await control.hover({timeout:2000});await page.waitForTimeout(200);
        await control.screenshot({path:path.join(spec.run,file+'-hover.png')});
        data.files.push(file+'-rest.png',file+'-hover.png');data.hover.push({target:j+1,label:cut(await control.innerText()),files:[file+'-rest.png',file+'-hover.png']});
       }catch(e){data.hover.push({target:j+1,status:'unavailable',reason:cut(e.message)});}
      }
     }
     data.status='captured';
    }catch(e){data.status='incomplete';data.error=cut(e.message);}
    finally{await context?.close();}
   }
  }
  report.status=report.pages.every(p=>p.variants.length===3&&p.variants.every(v=>v.status==='captured'&&v.accessibility.status==='checked'))?'captured':'incomplete';
 }catch(e){report.error=cut(e.message);}
 finally{await browser?.close();}
 report.finishedAt=new Date().toISOString();
 await fs.writeFile(path.join(spec.run,'manifest.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});
 const lines=['# Visual QA evidence','',`Capture status: ${report.status}. This is NOT a quality or delivery approval.`,
  `Case: ${spec.caseKey}. Build: ${spec.build.mode} (caller-supplied). Revision: ${spec.build.head??'unknown'}; dirty: ${spec.build.dirty??'unknown'}.`,'',
  'Open manifest.json and the PNGs in this directory before drawing conclusions. Confirm each image depicts the intended product, not a login, challenge, error or stale build.',''];
 for(const p of report.pages){lines.push('## '+p.url);for(const v of p.variants){lines.push(`- ${v.name}: ${v.status}; accessibility ${v.accessibility.status}; overflow ${v.dom?.overflow??'unknown'}; console errors ${v.errors.length}.`);for(const f of v.files)lines.push('  - '+f);if(v.error)lines.push('  - Capture failure: '+v.error);}}
 lines.push('','## Limits',...report.limits.map(s=>'- '+s),'','## Review handoff','Use hq_paper to register this report. Record only material, supported findings with attribution in hq_note. Do not treat generated notes as independent evidence.');
 await fs.writeFile(path.join(spec.run,'report.md'),lines.join('\n')+'\n',{mode:0o600});
 return report;
}

async function main(file){
 const spec=JSON.parse(await fs.readFile(file,'utf8')),req=createRequire(path.join(spec.tool,'package.json'));
 const {chromium}=req('playwright');
 if(!spec.browser){
  try{await fs.access(chromium.executablePath());}catch{
   const cli=path.join(path.dirname(req.resolve('playwright/package.json')),'cli.js');
   const r=spawnSync(process.execPath,[cli,'install','chromium'],{cwd:spec.tool,env:process.env,stdio:['ignore',2,2],timeout:120000});
   if(r.error||r.status!==0)throw new Error('Chromium download failed; use --browser with an installed Chromium or inspect with existing browser tools.');
  }
 }
 const axeSource=await fs.readFile(req.resolve('axe-core/axe.min.js'),'utf8');
 const report=await capture(spec,{chromium,axeSource});return report.status==='captured'?0:1;
}
if(process.argv[1]&&await fs.realpath(process.argv[1]).catch(()=>null)===fileURLToPath(import.meta.url)){
 try{process.exitCode=await main(process.argv[2]);}catch(e){console.error('visual-qa capture: '+e.message);process.exitCode=1;}
}
