import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import vm from 'node:vm';
const root=process.cwd(),files=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(entry.name))continue;const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else files.push(path);}}
await walk(root);
const htmlFiles=files.filter(path=>extname(path)==='.html'),jsFiles=files.filter(path=>extname(path)==='.js'),cssFiles=files.filter(path=>extname(path)==='.css');
const designTokens=await readFile(resolve(root,'assets/css/tokens.css'),'utf8');
assert.ok(designTokens.includes('--rsk-color-void:#090709')&&designTokens.includes('--rsk-color-gold:#c7a477')&&designTokens.includes('--rsk-font-display:'),'Shared RASKOL design tokens are incomplete');
for(const path of htmlFiles){const html=await readFile(path,'utf8');if(relative(root,path)==='index.html')assert.ok(!html.includes('tokens.css'),'Homepage must remain isolated from the internal design-token layer');else assert.ok(html.includes('tokens.css'),'Internal page must load shared design tokens: '+relative(root,path));}

assert.ok(htmlFiles.length>=5,'Expected public HTML pages');
for(const path of htmlFiles){const html=await readFile(path,'utf8');const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate IDs in '+relative(root,path));for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){const target=m[1].split('#')[0].split('?')[0];if(!target||target.startsWith('http:')||target.startsWith('https:')||target.startsWith('mailto:')||target.startsWith('tel:')||target.startsWith('data:')||target.startsWith('//'))continue;let resolved=resolve(join(path,'..'),decodeURIComponent(target));if(target.endsWith('/'))resolved=resolve(resolved,'index.html');assert.ok(files.includes(resolved),'Broken local reference in '+relative(root,path)+': '+target);}}
for(const path of jsFiles)new vm.Script(await readFile(path,'utf8'),{filename:relative(root,path)});
for(const path of htmlFiles){const html=await readFile(path,'utf8');for(const [index,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries()){if(match[1].trim())new vm.Script(match[1],{filename:relative(root,path)+' inline script '+index});}}
for(const path of cssFiles){let depth=0;for(const ch of await readFile(path,'utf8')){if(ch==='{')depth++;if(ch==='}')depth--;assert.ok(depth>=0,'Unexpected CSS closing brace in '+relative(root,path));}assert.equal(depth,0,'Unclosed CSS block in '+relative(root,path));}
const shop=await readFile(resolve(root,'assets/js/shop.js'),'utf8'),account=await readFile(resolve(root,'assets/js/account.js'),'utf8'),shopHtml=await readFile(resolve(root,'shop/index.html'),'utf8'),accountHtml=await readFile(resolve(root,'account/index.html'),'utf8');
for(const id of ['productModal','caseModal','closeProductModal','closeModal','modalClose2','rouletteTrack','rollBtn','prizePool'])assert.ok(shopHtml.includes('id="'+id+'"'),'Missing shop element '+id);
for(const id of ['linkCode','verifyLinkCode','linkStatus','dailyLimit','monthlyLimit','saveLimits','limitPreview'])assert.ok(accountHtml.includes('id="'+id+'"'),'Missing account element '+id);
assert.ok(shop.includes('getBoundingClientRect()'),'Roulette geometry must be measured from rendered rectangles');assert.ok(shop.includes('function formatPercent(value)')&&shop.includes('formatPercent(chance)')&&shop.includes('formatPercent(weights[i])'),'All case odds must use normalized percentage formatting');assert.ok(!shop.includes("formatPercent(chance)+'%")&&!shop.includes("formatPercent(weights[i])+'%"),'Odds must not append a duplicate percent sign');assert.ok(shop.includes('const itemCenters=Array.from(track.children')&&shop.includes('while(nextTickIndex<itemCenters.length'),'Reel animation must cache item geometry and avoid layout reads per frame');assert.ok(!shop.includes("track.style.filter=speed>24?'blur('"),'Reel animation must not apply per-frame blur on mobile');assert.ok(shop.includes('function reelPhysicsProgress(')&&shop.includes('brakeRate'),'Physical Reel must use a continuous acceleration/cruise/friction model');assert.ok(shop.includes('is-braking')&&shop.includes('is-impact')&&shop.includes('is-landed'),'Physical Reel must expose braking, marker impact and winner lock states');assert.ok(!shop.includes('playReelTone')&&!shop.includes('playReelTick')&&!shop.includes('playReelImpact')&&!shopHtml.includes('reelSoundToggle'),'Synthetic reel sound must stay removed until a proper RASKOL sound is ready');
assert.ok(shop.includes('function getCaseRewards('),'Case-specific reward pools are missing');assert.ok(shop.includes('function getRarityWeights('),'Case-specific tier probability calculation is missing');
assert.ok(shop.includes("$$('.ritual-tier').forEach("),'Ritual tier controls must be selected as a collection');
const oddsMatch=shop.match(/const caseOdds=\{([\s\S]*?)\n  \};/);assert.ok(oddsMatch,'Per-case odds tables are missing');const oddsTables=[...oddsMatch[1].matchAll(/\[([^\]]+)\]/g)].map(m=>m[1].split(',').map(Number));assert.equal(oddsTables.length,8,'Expected one base odds table per case');for(const weights of oddsTables)assert.ok(Math.abs(weights.reduce((sum,n)=>sum+n,0)-100)<0.000001,'Each case odds table must total exactly 100%');
for(const id of ['two-crowns','blood-oath','ashfall','black-embers','winter-solstice','eclipse','old-kingdom','last-vow'])assert.ok(shop.includes("'"+id+"'"),'Missing case reward pool '+id);
assert.ok(!shopHtml.includes('id="reelSoundToggle"'),'Poor-quality synthetic reel sound toggle must not return');assert.ok((await readFile(resolve(root,'assets/css/shop.css'),'utf8')).includes('transform: translate3d(0,0,0)'),'Reel must use a compositor-friendly transform track');
assert.ok(shop.includes('modalReturnFocus')&&shop.includes('activeModal'),'Modal focus management is missing');
assert.ok(account.includes('ArrowRight')&&account.includes('Home')&&account.includes('End'),'Account tab keyboard controls are missing');
const home=await readFile(resolve(root,'index.html'),'utf8'),media=await readFile(resolve(root,'media/index.html'),'utf8'),atmosphere=await readFile(resolve(root,'assets/js/atmosphere.js'),'utf8'),atmosphereCss=await readFile(resolve(root,'assets/css/atmosphere.css'),'utf8'),siteUi=await readFile(resolve(root,'assets/js/site-ui.js'),'utf8'),siteUiCss=await readFile(resolve(root,'assets/css/site-ui.css'),'utf8');
assert.ok(atmosphere.includes('data-rsk-cinemagraph')&&atmosphere.includes('rsk-cinema-active')&&atmosphereCss.includes('rsk-cinema-clouds'),'Cinemagraph scene activation and layer motion primitives are missing');
const support=await readFile(resolve(root,'support/index.html'),'utf8');
assert.ok(files.includes(resolve(root,'assets/images/raskol-crest.webp')),'Shared RASKOL crest asset is missing');
assert.ok(home.includes('raskolpro.play.ski')&&home.includes('raskol.play.ski'),'Both approved public connection addresses must be visible');
assert.ok(home.includes("$$('[data-copy-address]')"),'Homepage address-copy controls must use a collection selector');
assert.ok(!home.includes('encodeURIComponent(IP)'),'Homepage server status must use an approved public hostname, not an undefined IP variable');
assert.ok(!/ip\d+-\d+-\d+-\d+\.joinserver\.xyz/.test(home)&&!/\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(home),'Legacy host and IP must be removed from homepage');
assert.ok(home.includes('Профиль игрока')&&!home.includes('Смотреть трейлер')&&!home.includes('trailerModal'),'Homepage CTA and trailer placeholder must be updated');
const homeNavStart=home.indexOf('<nav class="nav-links"');const homeNavEnd=home.indexOf('</nav>',homeNavStart);const homeNav=home.slice(homeNavStart,homeNavEnd);
assert.ok(!homeNav.includes('Классы')&&!homeNav.includes('FAQ'),'Classes and FAQ must not remain in the homepage top navigation');
assert.ok(home.includes('href="#faq">Частые вопросы</a>'),'FAQ must remain in the footer navigation');
assert.ok(siteUi.includes('opengameart.org/sites/default/files/The_Bards_Tale.mp3')&&siteUi.includes('audio.play()')&&siteUi.includes('audio.preload'),'Background music must use the credited CC0 source');
assert.ok((siteUi.split('opengameart.org/sites/default/files/').length-1)>=6,'The RASKOL soundtrack needs at least six CC0 tracks');
assert.ok(siteUi.includes('shouldAutoplay')&&siteUi.includes('resumeAt')&&siteUi.includes('sessionStorage'),'Autoplay attempt and playback position must persist between page navigations');
assert.ok(siteUi.includes('document.hidden) persist()')&&!siteUi.includes('if (document.hidden) audio.pause()'),'Background music must not pause when the browser tab is hidden');
assert.ok(siteUi.includes('rsk-music-shuffle')&&siteUi.includes('rsk-music-repeat')&&siteUi.includes('rsk-music-progress'),'Music player must provide shuffle, repeat and seeking controls');
assert.ok(siteUi.includes('rsk-page-transition')&&siteUi.includes('rsk-transition-crest')&&siteUiCss.includes('.rsk-music-player')&&siteUiCss.includes('#preloader .preload-crest'),'Global crest transition, branded preloader and compact music player are required');
for(const path of htmlFiles){const html=await readFile(path,'utf8');assert.ok(html.includes('site-ui.js')&&html.includes('site-ui.css'),'Missing global site UI layer on '+relative(root,path));}
assert.ok(media.includes('Прямые эфиры')&&media.includes('Интеграция ещё не подключена'),'Media hub must disclose that stream integration is not connected');
assert.ok(home.includes('support/index.html'),'Homepage must link to the support center');
for(const category of ['Жалоба на игрока','Жалоба на администратора','Обжалование блокировки','Потеря предметов / игрового прогресса','Техническая проблема','Донат и платежи','Предложение по развитию','Другое'])assert.ok(support.includes(category),'Missing support ticket category '+category);
assert.ok(support.includes('не отправляются')&&support.includes('авторизация сайта и серверное хранилище тикетов'),'Support prototype must clearly disclose that ticket submission is not connected');
assert.ok(support.includes('Мои обращения')&&support.includes('База знаний')&&support.includes('Апелляции'),'Support center is missing a core section');
for(const path of htmlFiles){const html=await readFile(path,'utf8');assert.ok(html.includes('rsk-brand-crest')||html.includes('brand-emblem')||html.includes('rsk-document-brand'),'Missing RASKOL crest on '+relative(root,path));assert.ok(!/\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(html)&&!/ip\d+-\d+-\d+-\d+\.joinserver\.xyz/.test(html),'A raw server IP or legacy host is published in '+relative(root,path));}
console.log('PASS: '+htmlFiles.length+' HTML, '+jsFiles.length+' JS and '+cssFiles.length+' CSS files; IDs, local paths, syntax, styles and key interactions checked.');


const ecosystem=await readFile(resolve(root,'systems/index.html'),'utf8'),worldCss=await readFile(resolve(root,'assets/css/world.css'),'utf8');
assert.ok(ecosystem.includes('<h1>Экосистема РАСКОЛА</h1>'),'Systems hub must use the approved Ecosystem name');
assert.ok(ecosystem.includes('href="../classes/index.html">Каталог классов</a>'),'Classes must remain accessible as a subsystem of the ecosystem');
assert.ok(worldCss.includes('@media(max-width:560px)')&&worldCss.includes('min-height:48px'),'Shared portal actions must retain comfortable mobile touch targets');
for(const path of ['world/index.html','factions/index.html','map/index.html','media/index.html','support/index.html']){
 const html=await readFile(resolve(root,path),'utf8');
 assert.ok(html.includes('Экосистема'),'Shared portal navigation must expose the Ecosystem entry');
 assert.ok(!html.includes('>Классы</a>'),'Classes must not be duplicated as a top-level shared portal navigation item');
}

const mobileCss=await readFile(resolve(root,'assets/css/mobile.css'),'utf8'),brandCss=await readFile(resolve(root,'assets/css/brand.css'),'utf8');
assert.ok(brandCss.includes('@import url("./mobile.css")'),'Shared mobile layer must be loaded by branded pages');
for(const width of ['900px','680px','380px'])assert.ok(mobileCss.includes('max-width: '+width),'Missing responsive breakpoint '+width);
assert.ok(mobileCss.includes('.nav a,.world-nav a,.support-nav a')&&mobileCss.includes('display: inline-flex !important'),'Mobile navigation must not hide existing links');
assert.ok(mobileCss.includes('.catalog-grid')&&mobileCss.includes('.roulette-window')&&mobileCss.includes('.account-tabs')&&mobileCss.includes('.support-form-layout'),'Shop, roulette, account and support need mobile layouts');
assert.ok(mobileCss.includes('prefers-reduced-motion')&&mobileCss.includes('hover: none'),'Mobile layer must respect reduced motion and touch input');

assert.ok((await readFile(resolve(root,'shop/index.html'),'utf8')).includes('<body class="shop-page">'),'Shop needs an explicit scope for its mobile component rules');
assert.ok((await readFile(resolve(root,'account/index.html'),'utf8')).includes('<body class="account-page-root">'),'Account needs an explicit mobile page scope');
assert.ok(mobileCss.includes('.shop-page .hero')&&mobileCss.includes('.shop-page .hero-art'),'Shop hero rules must be scoped and must not override the homepage hero');
assert.ok(!/^[ \\t]*\\.hero\\s*\\{/m.test(mobileCss)&&!/^[ \\t]*\\.section\\s*\\{/m.test(mobileCss),'Shared mobile CSS must not globally override homepage hero or section layout');
assert.ok(mobileCss.includes('max-width: 430px')&&mobileCss.includes('.case-grid')&&mobileCss.includes('.class-detail'),'iPhone-width shop roulette and class detail layouts need explicit coverage');
