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
const report={routes:routes.length,viewports:viewports.map(x=>x.width),screenshots:[],overflow:[],diagnostics:[],axe:[],runtimeErrors:[],keyboard:[],motion:[],interactions:[]};
await mkdir(resolve(root,'artifacts/browser-qa'),{recursive:true});

try{
  for(const route of routes){
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    await page.addInitScript(()=>{try{localStorage.clear();sessionStorage.clear();}catch(_){}});
    page.on('pageerror',error=>report.runtimeErrors.push({route,message:error.message}));
    for(const viewport of viewports){
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      await page.goto('http://127.0.0.1:4173'+route,{waitUntil:'domcontentloaded',timeout:20000});

      await page.waitForTimeout(120);
      if(route==='/'){
        const atmosphere=await page.evaluate(async()=>{
          const art=document.querySelector('#heroArt'),embers=art?.querySelector('.rsk-cinema-embers'),canvas=document.querySelector('#embers');
          const layers=['clouds','mist-back','mist-front'].map(name=>{
            const el=art?.querySelector('[data-rsk-cinema-layer="'+name+'"]');
            const image=getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
            return {name,image,opacity:getComputedStyle(el).opacity};
          });
          const resources=await Promise.all(layers.map(async layer=>({name:layer.name,ok:layer.image?((await fetch(layer.image)).ok):false})));
          return {layers,resources,emberDuration:embers?getComputedStyle(embers).animationDuration:null,emberOpacity:embers?getComputedStyle(embers).getPropertyValue('--rsk-cinema-opacity').trim():null,canvas:Boolean(canvas)};
        });
        if(atmosphere.layers.some(layer=>!layer.image)||atmosphere.resources.some(resource=>!resource.ok)||atmosphere.emberDuration!=='38s'||atmosphere.emberOpacity!=='.16'||!atmosphere.canvas){
          report.runtimeErrors.push({route,viewport:viewport.width,message:'Cinematic texture loading or sparse ember regression',atmosphere});
        }
        if(viewport.width===390){
          await page.emulateMedia({reducedMotion:'reduce'});
          const stopped=await page.locator('#heroArt .rsk-cinema-layer').evaluateAll(els=>els.every(el=>getComputedStyle(el).animationDuration==='0s'));
          if(!stopped)report.motion.push({route,viewport:viewport.width,message:'Cinematic layers must stop under reduced motion'});
          await page.emulateMedia({reducedMotion:'no-preference'});
        }
      }
      const metrics=await page.evaluate(()=>({
        title:document.title,
        width:innerWidth,
        documentWidth:document.documentElement.scrollWidth,
        bodyWidth:document.body?.scrollWidth||0,
        hasMain:Boolean(document.querySelector('main')),
        mainCount:document.querySelectorAll('main').length,
        skip:Boolean(document.querySelector('.rsk-skip-link')),
        skipTarget:(()=>{const a=document.querySelector('.rsk-skip-link');return a?Boolean(document.querySelector(a.getAttribute('href'))):false;})(),
        visibleButtons:[...document.querySelectorAll('button')].filter(x=>x.getClientRects().length).length,
        overflowElements:[...document.querySelectorAll('body *')].filter(el=>{const rect=el.getBoundingClientRect();if(rect.width<=0||rect.height<=0||rect.right<=innerWidth+1||el.closest('.hero-art'))return false;for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const ox=getComputedStyle(p).overflowX;if(ox==='auto'||ox==='scroll')return false;}return true;}).slice(0,10).map(el=>{const r=el.getBoundingClientRect(),st=getComputedStyle(el);return {tag:el.tagName.toLowerCase(),id:el.id,className:typeof el.className==='string'?el.className:'',left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),fontSize:st.fontSize,overflowX:st.overflowX};}),
        scrollOverflow:[...document.querySelectorAll('body *')].filter(el=>el.scrollWidth>el.clientWidth+1&&!['auto','scroll'].includes(getComputedStyle(el).overflowX)&&!el.closest('.hero-art')).slice(0,10).map(el=>({tag:el.tagName.toLowerCase(),id:el.id,className:typeof el.className==='string'?el.className:'',scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,overflowX:getComputedStyle(el).overflowX})),
        filterStyles:location.pathname.includes('specializations')?[...document.querySelectorAll('.filter')].slice(0,3).map(el=>{const st=getComputedStyle(el);return {text:el.textContent.trim(),color:st.color,background:st.backgroundColor,opacity:st.opacity,fontSize:st.fontSize};}):[],
        shopNavVisible:(()=>{const nav=document.querySelector('.top .nav');return nav?getComputedStyle(nav).display!=='none':false;})(),
        h1:(()=>{const el=document.querySelector('main h1');if(!el)return null;const r=el.getBoundingClientRect();return {text:el.textContent.trim(),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),fontSize:getComputedStyle(el).fontSize};})()
      }));
      if(metrics.documentWidth>viewport.width+1||metrics.overflowElements.length)report.overflow.push({route,viewport:viewport.width,documentWidth:metrics.documentWidth,bodyWidth:metrics.bodyWidth,elements:metrics.overflowElements,scrollOverflow:metrics.scrollOverflow});
      if((route==='/classes/specializations.html'&&(viewport.width===320||viewport.width===390))||((route==='/shop/'||route==='/support/')&&viewport.width===320)||(route==='/shop/'&&viewport.width===768)||(route.startsWith('/classes/')&&route.endsWith('.html')&&viewport.width===320)||(route==='/'&&viewport.width===768))report.diagnostics.push({route,viewport:viewport.width,bodyWidth:metrics.bodyWidth,documentWidth:metrics.documentWidth,h1:metrics.h1,filterStyles:metrics.filterStyles});
      if(!metrics.hasMain||metrics.mainCount!==1)report.runtimeErrors.push({route,message:'Expected exactly one main landmark'});
      if(route==='/shop/'&&viewport.width<=980&&!metrics.shopNavVisible)report.keyboard.push({route,viewport:viewport.width,message:'Shop navigation is hidden on tablet or mobile'});
      if(!metrics.skip||!metrics.skipTarget)report.keyboard.push({route,viewport:viewport.width,message:'Skip link or its target is missing'});
      if([1440,768,390,320].includes(viewport.width)){
        await page.addStyleTag({content:'.reveal,.rsk-reveal{opacity:1!important;transform:none!important;transition:none!important}'});
        const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
        for(const v of axe.violations)report.axe.push({route,viewport:viewport.width,id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.slice(0,8).map(n=>({target:n.target,summary:n.failureSummary?.slice(0,260)}))});
        const shot=resolve(root,'artifacts/browser-qa',route==='/'?'home':route.replaceAll('/','_').replace(/^_+|_+$/g,''));
        if([1440,768,390,320].includes(viewport.width)){
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
        await page.emulateMedia({reducedMotion:'no-preference'});
      }
    }
    await page.close();
  }

  // Отдельный проход по интерактивным состояниям магазина и рулетки.
  const shopContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const shop=await shopContext.newPage();
  await shop.goto('http://127.0.0.1:4173/shop/',{waitUntil:'domcontentloaded'});
  await shop.waitForSelector('#catalogGrid [data-preview]');
  await shop.locator('#productSearch').focus();
  const searchFocus=await shop.locator('#productSearch').evaluate(el=>{const style=getComputedStyle(el);return style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>=2;});
  if(!searchFocus)report.keyboard.push({route:'/shop/',viewport:1440,message:'Product search has no visible keyboard focus ring'});
  const productTrigger=shop.locator('#catalogGrid [data-preview]').first();
  await productTrigger.click();
  await shop.waitForFunction(()=>document.activeElement?.id==='closeProductModal',null,{timeout:2500});
  const productOpen=await shop.locator('#productModal').getAttribute('aria-hidden')==='false';
  const productFocus=await shop.evaluate(()=>document.activeElement?.id);
  await shop.keyboard.press('Escape');
  await shop.waitForFunction(()=>document.activeElement?.matches('[data-preview]'),null,{timeout:2500});
  const productClosed=await shop.locator('#productModal').getAttribute('aria-hidden')==='true';
  const productReturned=await shop.evaluate(()=>document.activeElement?.matches('[data-preview]'));
  report.interactions.push({name:'product dialog focus and Escape',passed:productOpen&&productFocus==='closeProductModal'&&productClosed&&productReturned,details:{productOpen,productFocus,productClosed,productReturned,triggerConnected:await productTrigger.evaluate(el=>el.isConnected)}});
  if(!(productOpen&&productFocus==='closeProductModal'&&productClosed&&productReturned))report.runtimeErrors.push({route:'/shop/',message:'Product dialog focus management failed'});

  await shop.locator('#ageCheck').check();
  await shop.locator('#riskCheck').check();
  await shop.locator('#enterCaseHall').click();
  const caseTrigger=shop.locator('#caseGrid [data-case]').first();
  await caseTrigger.click();
  await shop.waitForFunction(()=>document.activeElement?.id==='closeModal',null,{timeout:2500});
  const caseOpen=await shop.locator('#caseModal').getAttribute('aria-hidden')==='false';
  const caseFocus=await shop.evaluate(()=>document.activeElement?.id);
  await shop.keyboard.press('Escape');
  await shop.waitForFunction(()=>document.activeElement?.matches('[data-case]'),null,{timeout:2500});
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

  // На широком экране плеер тоже начинает с компактного состояния.
  const desktopPlayerContext=await browser.newContext({viewport:{width:1440,height:900}});
  const desktopPlayerPage=await desktopPlayerContext.newPage();
  await desktopPlayerPage.addInitScript(()=>{try{localStorage.clear();sessionStorage.clear();}catch(_){}});
  await desktopPlayerPage.goto('http://127.0.0.1:4173/world/',{waitUntil:'domcontentloaded'});
  await desktopPlayerPage.waitForSelector('.rsk-music-player');
  const desktopPlayerCollapsed=await desktopPlayerPage.locator('.rsk-music-player').evaluate(el=>el.classList.contains('is-collapsed'));
  await desktopPlayerPage.locator('.rsk-music-collapse').click();
  const desktopPlayerExpanded=!(await desktopPlayerPage.locator('.rsk-music-player').evaluate(el=>el.classList.contains('is-collapsed')));
  const desktopPlayerOk=desktopPlayerCollapsed&&desktopPlayerExpanded;
  report.interactions.push({name:'desktop player starts compact and expands on demand',passed:desktopPlayerOk});
  if(!desktopPlayerOk)report.runtimeErrors.push({route:'/world/',message:'Desktop player compact default or expand control failed'});
  await desktopPlayerContext.close();

  // На узких экранах плеер не перекрывает текст, но остаётся доступен для раскрытия.
  const mobilePlayerContext=await browser.newContext({viewport:{width:390,height:844}});
  const mobilePlayerPage=await mobilePlayerContext.newPage();
  await mobilePlayerPage.goto('http://127.0.0.1:4173/classes/hunter.html',{waitUntil:'domcontentloaded'});
  await mobilePlayerPage.waitForSelector('.rsk-music-player');
  const playerCollapsed=await mobilePlayerPage.locator('.rsk-music-player').evaluate(el=>el.classList.contains('is-collapsed'));
  await mobilePlayerPage.locator('.rsk-music-collapse').click();
  const playerExpanded=!(await mobilePlayerPage.locator('.rsk-music-player').evaluate(el=>el.classList.contains('is-collapsed')));
  const expandedState=await mobilePlayerPage.locator('.rsk-music-collapse').getAttribute('aria-expanded');
  const mobilePlayerOk=playerCollapsed&&playerExpanded&&expandedState==='true';
  report.interactions.push({name:'mobile player starts compact and expands on demand',passed:mobilePlayerOk});
  if(!mobilePlayerOk)report.runtimeErrors.push({route:'/classes/hunter.html',message:'Mobile player compact default or expand control failed'});
  await mobilePlayerContext.close();
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
console.log('BROWSER_QA_DIAGNOSTICS '+JSON.stringify(report.diagnostics));
console.log('BROWSER_QA_SUMMARY '+JSON.stringify(summary));
if(report.overflow.length||report.axe.some(x=>x.impact==='critical'||x.impact==='serious')||report.runtimeErrors.length||report.keyboard.length||report.motion.length||report.interactions.some(x=>!x.passed)){
  console.error('BROWSER_QA_FINDINGS '+JSON.stringify({overflow:report.overflow,axe:report.axe,runtimeErrors:report.runtimeErrors,keyboard:report.keyboard,motion:report.motion,interactions:report.interactions},null,2));
  process.exitCode=1;
}
