import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root=process.cwd();
const routes=[
  '/', '/world/','/factions/','/systems/','/map/','/media/',
  '/classes/','/classes/hunter.html','/classes/mage.html','/classes/priest.html',
  '/classes/rogue.html','/classes/warlock.html','/classes/warrior.html',
  '/classes/specializations.html','/classes/specializations/arms.html',
  '/shop/','/account/','/support/','/offer.html','/privacy.html','/rules.html'
];
const viewports=[{width:1440,height:1000,name:'desktop'},{width:768,height:1024,name:'tablet'},{width:390,height:844,name:'mobile'},{width:320,height:720,name:'small-mobile'}];
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2'};

const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url||'/', 'http://127.0.0.1').pathname);
    let file=resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
    if((await stat(file).catch(()=>null))?.isDirectory())file=resolve(file,'index.html');
    const body=await readFile(file);
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
    res.end(body);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise((ok,fail)=>server.listen(4173,'127.0.0.1',err=>err?fail(err):ok()));

const browser=await chromium.launch({headless:true});
const report={routes:routes.length,viewports:viewports.map(x=>x.width),screenshots:[],overflow:[],axe:[],runtimeErrors:[],keyboard:[],motion:[],interactions:[]};
await mkdir(resolve(root,'artifacts/browser-qa'),{recursive:true});

try{
  for(const route of routes){
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    page.on('pageerror',error=>report.runtimeErrors.push({route,message:error.message}));
    for(const viewport of viewports){
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      await page.goto('http://127.0.0.1:4173'+route,{waitUntil:'domcontentloaded',timeout:20000});
      await page.waitForTimeout(120);
      const metrics=await page.evaluate(()=>({
        title:document.title,
        width:innerWidth,
        documentWidth:Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0),
        hasMain:Boolean(document.querySelector('main')),
        mainCount:document.querySelectorAll('main').length,
        skip:Boolean(document.querySelector('.rsk-skip-link')),
        skipTarget:(()=>{const a=document.querySelector('.rsk-skip-link');return a?Boolean(document.querySelector(a.getAttribute('href'))):false;})(),
        visibleButtons:[...document.querySelectorAll('button')].filter(x=>x.getClientRects().length).length
      }));
      if(metrics.documentWidth>viewport.width+1)report.overflow.push({route,viewport:viewport.width,documentWidth:metrics.documentWidth});
      if(!metrics.hasMain||metrics.mainCount!==1)report.runtimeErrors.push({route,message:'Expected exactly one main landmark'});
      if(!metrics.skip||!metrics.skipTarget)report.keyboard.push({route,viewport:viewport.width,message:'Skip link or its target is missing'});
      if(viewport.width===1440||viewport.width===390){
        const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
        for(const v of axe.violations)report.axe.push({route,viewport:viewport.width,id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.slice(0,8).map(n=>({target:n.target,summary:n.failureSummary?.slice(0,260)}))});
        const shot=resolve(root,'artifacts/browser-qa',route==='/'?'home':route.replaceAll('/','_').replace(/^_+|_+$/g,''));
        if(viewport.width===1440||viewport.width===390){
          const path=shot+'-'+viewport.width+'.png';
          await page.screenshot({path,animations:'disabled'});
          report.screenshots.push(path.replace(root+'/',''));
        }
      }
      if(viewport.width===1440){
        await page.keyboard.press('Tab');
        const firstFocus=await page.evaluate(()=>({className:document.activeElement?.className||'',outline:getComputedStyle(document.activeElement).outlineStyle,outlineWidth:getComputedStyle(document.activeElement).outlineWidth}));
        if(!String(firstFocus.className).includes('rsk-skip-link')||firstFocus.outline==='none'||firstFocus.outlineWidth==='0px')report.keyboard.push({route,viewport:viewport.width,message:'First keyboard focus is not the visible skip link',firstFocus});
      }
      if(viewport.width===390){
        await page.emulateMedia({reducedMotion:'reduce'});
        const motion=await page.evaluate(()=>{
          const duration=getComputedStyle(document.body,'::before').animationDuration;
          const seconds=duration.endsWith('ms')?parseFloat(duration)/1000:parseFloat(duration);
          return {scrollBehavior:getComputedStyle(document.documentElement).scrollBehavior,bodyBeforeDuration:duration,bodyBeforeSeconds:seconds};
        });
        if(motion.scrollBehavior!=='auto'||motion.bodyBeforeSeconds>0.001)report.motion.push({route,...motion});
      }
    }
    await page.close();
  }

  // Отдельный проход по интерактивным состояниям магазина и рулетки.
  const shopContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const shop=await shopContext.newPage();
  await shop.goto('http://127.0.0.1:4173/shop/',{waitUntil:'domcontentloaded'});
  await shop.waitForSelector('#catalogGrid [data-preview]');
  const productTrigger=shop.locator('#catalogGrid [data-preview]').first();
  await productTrigger.click();
  const productOpen=await shop.locator('#productModal').getAttribute('aria-hidden')==='false';
  const productFocus=await shop.evaluate(()=>document.activeElement?.id);
  await shop.keyboard.press('Escape');
  const productClosed=await shop.locator('#productModal').getAttribute('aria-hidden')==='true';
  const productReturned=await shop.evaluate(()=>document.activeElement?.matches('[data-preview]'));
  report.interactions.push({name:'product dialog focus and Escape',passed:productOpen&&productFocus==='closeProductModal'&&productClosed&&productReturned});
  if(!(productOpen&&productFocus==='closeProductModal'&&productClosed&&productReturned))report.runtimeErrors.push({route:'/shop/',message:'Product dialog focus management failed'});

  await shop.locator('#ageCheck').check();
  await shop.locator('#riskCheck').check();
  await shop.locator('#enterCaseHall').click();
  const caseTrigger=shop.locator('#caseGrid [data-case]').first();
  await caseTrigger.click();
  const caseOpen=await shop.locator('#caseModal').getAttribute('aria-hidden')==='false';
  const caseFocus=await shop.evaluate(()=>document.activeElement?.id);
  await shop.keyboard.press('Escape');
  const caseClosed=await shop.locator('#caseModal').getAttribute('aria-hidden')==='true';
  const caseReturned=await shop.evaluate(()=>document.activeElement?.matches('[data-case]'));
  report.interactions.push({name:'case dialog focus and Escape',passed:caseOpen&&caseFocus==='closeModal'&&caseClosed&&caseReturned});
  if(!(caseOpen&&caseFocus==='closeModal'&&caseClosed&&caseReturned))report.runtimeErrors.push({route:'/shop/',message:'Case dialog focus management failed'});

  await caseTrigger.click();
  await shop.locator('#rollBtn').click();
  await shop.waitForFunction(()=>document.querySelector('#rollBtn')?.textContent.includes('Повторить обряд'),null,{timeout:5000});
  const result=await shop.locator('#rollResult').innerText();
  report.interactions.push({name:'reduced-motion roulette completes and announces result',passed:Boolean(result.trim())});
  if(!result.trim())report.runtimeErrors.push({route:'/shop/',message:'Reduced-motion roulette did not announce a result'});
  await shopContext.close();

  // Клавиатурная модель вкладок личного кабинета.
  const accountContext=await browser.newContext({viewport:{width:1280,height:900}});
  const account=await accountContext.newPage();
  await account.goto('http://127.0.0.1:4173/account/',{waitUntil:'domcontentloaded'});
  await account.locator('#tab-balance-trigger').focus();
  await account.keyboard.press('ArrowRight');
  const selected=await account.locator('#tab-topup-trigger').getAttribute('aria-selected');
  const panelLabel=await account.locator('#tab-topup').getAttribute('aria-labelledby');
  const triggerId=await account.locator('#tab-topup-trigger').getAttribute('id');
  const tabsOk=selected==='true'&&panelLabel===triggerId;
  report.interactions.push({name:'account tabs arrow navigation and accessible panel label',passed:tabsOk});
  if(!tabsOk)report.runtimeErrors.push({route:'/account/',message:'Account tabs keyboard or aria-labelledby relationship failed'});
  await accountContext.close();
} finally {
  await browser.close();
  await new Promise(resolveClose=>server.close(resolveClose));
}

const summary={
  routes:report.routes,
  viewportWidths:report.viewports,
  screenshots:report.screenshots.length,
  horizontalOverflow:report.overflow.length,
  axeViolations:report.axe.length,
  criticalAxe:report.axe.filter(x=>x.impact==='critical').length,
  seriousAxe:report.axe.filter(x=>x.impact==='serious').length,
  moderateAxe:report.axe.filter(x=>x.impact==='moderate').length,
  runtimeErrors:report.runtimeErrors.length,
  keyboardFindings:report.keyboard.length,
  reducedMotionFindings:report.motion.length,
  interactionChecks:report.interactions
};
await writeFile(resolve(root,'artifacts/browser-qa/report.json'),JSON.stringify({summary,report},null,2));
console.log('BROWSER_QA_SUMMARY '+JSON.stringify(summary));
if(report.overflow.length||report.axe.some(x=>x.impact==='critical'||x.impact==='serious')||report.runtimeErrors.length||report.keyboard.length||report.motion.length||report.interactions.some(x=>!x.passed)){
  console.error('BROWSER_QA_FINDINGS '+JSON.stringify({overflow:report.overflow,axe:report.axe,runtimeErrors:report.runtimeErrors,keyboard:report.keyboard,motion:report.motion,interactions:report.interactions},null,2));
  process.exitCode=1;
}
