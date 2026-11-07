// Real Chromium/WebGL2 integration checks for both p5.brush builds.
// This tests example code and actual pixels, NOT agent autonomy or artistic merit.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {extname, join, resolve, relative, sep, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-chromium';
import {PNG} from 'pngjs';

const root = dirname(fileURLToPath(import.meta.url));
const reportDir = resolve(process.env.ANIMATION_REPORT_DIR || join(root, 'results'));
const MIME = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png'};
const duration = 8;
const times = [0, .25, 1]; // normalized positions in an 8-second loop
const sample = ['start', 'quarter', 'seam'];

function server() {
  return new Promise((res, rej) => {
    const app = createServer(async (req, response) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = resolve(root, '.' + pathname);
      const rel = relative(root, file);
      if (rel === '..' || rel.startsWith('..' + sep) || rel.startsWith(sep)) {
        response.writeHead(403); response.end(); return;
      }
      try {
        const bytes = await readFile(file);
        response.writeHead(200, {'content-type': MIME[extname(file)] || 'application/octet-stream'});
        response.end(bytes);
      } catch {
        response.writeHead(404); response.end('Not found');
      }
    });
    app.listen(0, '127.0.0.1', () => res(app));
    app.on('error', rej);
  });
}
function measure(pngBuffer) {
  const png = PNG.sync.read(pngBuffer);
  let painted=0;
  const bg=[250,246,237];
  for(let i=0;i<png.data.length;i+=4) {
    const d=Math.abs(png.data[i]-bg[0])+Math.abs(png.data[i+1]-bg[1])+Math.abs(png.data[i+2]-bg[2]);
    if (d>75) painted++;
  }
  return {width:png.width,height:png.height,painted,sha256:createHash('sha256').update(pngBuffer).digest('hex')};
}
function imageDelta(a,b) {
  const left=PNG.sync.read(a),right=PNG.sync.read(b);
  assert.equal(left.width,right.width);assert.equal(left.height,right.height);
  let pixels=0, intensity=0;
  for(let i=0;i<left.data.length;i+=4) {
    const d=Math.abs(left.data[i]-right.data[i])+
      Math.abs(left.data[i+1]-right.data[i+1])+
      Math.abs(left.data[i+2]-right.data[i+2]);
    if(d>45)pixels++;
    intensity+=d;
  }
  return {pixels,intensity};
}
let listener, browser;
const report={kind:'real-browser-library-integration-not-agent-evaluation',
 version:{brush:'3.0.0',p5:'2.2.0'},durationSeconds:duration,
 browser:null,tests:[],status:'unknown'};
try{
  await mkdir(reportDir,{recursive:true});
  listener=await server();
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  report.browser=browser.version();
  for (const mode of ['addon','standalone']) {
    const page=await browser.newPage({viewport:{width:400,height:300},deviceScaleFactor:1});
    const errs=[];
    page.on('pageerror',e=>errs.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
    page.on('response',r=>{if(r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
    const test={mode,frameMeasurements:[],errors:errs};
    report.tests.push(test);
    try{
      await page.goto(`http://127.0.0.1:${listener.address().port}/scenes/${mode}.html`,{waitUntil:'load'});
      await page.waitForFunction(()=>window.sceneReady&&typeof window.renderAt==='function',{timeout:30000});
      const canvas=page.locator('canvas').first();
      const context=await page.evaluate(()=>{
        const canvas=document.querySelector('canvas');
        return {w:canvas?.width,h:canvas?.height,webgl2:!!canvas?.getContext('webgl2')};
      });
      assert.equal(context.w,360);assert.equal(context.h,240);
      assert(context.webgl2,'WebGL2 context required for rendering');
      const frames=[];
      for(let i=0;i<times.length;i++){
        await page.evaluate(t=>window.renderAt(t),times[i]);
        await page.waitForTimeout(150);
        const png=await canvas.screenshot();
        frames.push(png);
        await writeFile(join(reportDir,mode+'-'+sample[i]+'.png'),png);
        test.frameMeasurements.push({name:sample[i],atSeconds:duration*times[i],...measure(png)});
      }
      const motion=imageDelta(frames[0],frames[1]),seam=imageDelta(frames[0],frames[2]);
      test.motion=motion;test.seam=seam;test.context=context;
      assert(test.frameMeasurements.every(x=>x.painted>800),'Canvas exists but did not paint enough visible pixels');
      assert(motion.pixels>300,'Animation did not change visibly over time');
      assert(seam.pixels < Math.max(100,Math.floor(motion.pixels*.25)),
        `Loop seam differs too much (seam ${seam.pixels}, motion ${motion.pixels} pixels)`);
      assert.deepEqual(errs,[],'Page or resource errors');
      test.status='pass';
      console.log(`PASS ${mode}: painted=${test.frameMeasurements[0].painted}, movement=${motion.pixels}px, seam=${seam.pixels}px`);
    }catch(e){
      test.status='fail';test.failure=String(e?.stack||e);
      console.error(`FAIL ${mode}: ${e.message}`);
    }finally{await page.close();}
  }
  report.status=report.tests.every(t=>t.status==='pass')?'pass':'fail';
} catch (e) {
  report.status='fail';report.runnerFailure=String(e?.stack||e);
  console.error(report.runnerFailure);
}finally{
  if(browser)await browser.close();
  if(listener)await new Promise(res=>listener.close(res));
  await mkdir(reportDir,{recursive:true});
  await writeFile(join(reportDir,'report.json'),JSON.stringify(report,null,2)+'\n');
}
if(report.status!=='pass')process.exitCode=1;
