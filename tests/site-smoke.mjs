import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import vm from 'node:vm';
const root=process.cwd(),files=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(entry.name))continue;const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else files.push(path);}}
await walk(root);
const htmlFiles=files.filter(path=>extname(path)==='.html'),jsFiles=files.filter(path=>extname(path)==='.js'),cssFiles=files.filter(path=>extname(path)==='.css');
assert.ok(htmlFiles.length>=5,'Expected public HTML pages');
for(const path of htmlFiles){const html=await readFile(path,'utf8');const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate IDs in '+relative(root,path));for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){const target=m[1].split('#')[0].split('?')[0];if(!target||target.startsWith('http:')||target.startsWith('https:')||target.startsWith('mailto:')||target.startsWith('tel:')||target.startsWith('data:')||target.startsWith('//'))continue;let resolved=resolve(join(path,'..'),decodeURIComponent(target));if(target.endsWith('/'))resolved=resolve(resolved,'index.html');assert.ok(files.includes(resolved),'Broken local reference in '+relative(root,path)+': '+target);}}
for(const path of jsFiles)new vm.Script(await readFile(path,'utf8'),{filename:relative(root,path)});
for(const path of cssFiles){let depth=0;for(const ch of await readFile(path,'utf8')){if(ch==='{')depth++;if(ch==='}')depth--;assert.ok(depth>=0,'Unexpected CSS closing brace in '+relative(root,path));}assert.equal(depth,0,'Unclosed CSS block in '+relative(root,path));}
const shop=await readFile(resolve(root,'assets/js/shop.js'),'utf8'),account=await readFile(resolve(root,'assets/js/account.js'),'utf8'),shopHtml=await readFile(resolve(root,'shop/index.html'),'utf8'),accountHtml=await readFile(resolve(root,'account/index.html'),'utf8');
for(const id of ['productModal','caseModal','closeProductModal','closeModal','modalClose2','rouletteTrack','rollBtn','prizePool'])assert.ok(shopHtml.includes('id="'+id+'"'),'Missing shop element '+id);
for(const id of ['linkCode','verifyLinkCode','linkStatus','dailyLimit','monthlyLimit','saveLimits','limitPreview'])assert.ok(accountHtml.includes('id="'+id+'"'),'Missing account element '+id);
assert.ok(shop.includes('getBoundingClientRect()'),'Roulette geometry must be measured from rendered rectangles');assert.ok(shop.includes('t+t*t*t-t*t*t*t'),'Roulette deceleration must ease continuously into its stop');
assert.ok(shop.includes('function getCaseRewards('),'Case-specific reward pools are missing');assert.ok(shop.includes('function getRarityWeights('),'Case-specific tier probability calculation is missing');
assert.ok(shop.includes("$('.ritual-tier').forEach("),'Ritual tier controls must be selected as a collection');
assert.ok(!/(?<!\\$)\\$\\('\.ritual-tier'\\)\\.forEach/.test(shop),'A single querySelector result cannot be iterated as a collection');
const oddsMatch=shop.match(/const caseOdds=\{([\s\S]*?)\n  \};/);assert.ok(oddsMatch,'Per-case odds tables are missing');const oddsTables=[...oddsMatch[1].matchAll(/\[([^\]]+)\]/g)].map(m=>m[1].split(',').map(Number));assert.equal(oddsTables.length,8,'Expected one base odds table per case');for(const weights of oddsTables)assert.ok(Math.abs(weights.reduce((sum,n)=>sum+n,0)-100)<0.000001,'Each case odds table must total exactly 100%');
for(const id of ['two-crowns','blood-oath','ashfall','black-embers','winter-solstice','eclipse','old-kingdom','last-vow'])assert.ok(shop.includes("'"+id+"'"),'Missing case reward pool '+id);
assert.ok(shop.includes('modalReturnFocus')&&shop.includes('activeModal'),'Modal focus management is missing');
assert.ok(account.includes('ArrowRight')&&account.includes('Home')&&account.includes('End'),'Account tab keyboard controls are missing');
console.log('PASS: '+htmlFiles.length+' HTML, '+jsFiles.length+' JS and '+cssFiles.length+' CSS files; IDs, local paths, syntax, styles and key interactions checked.');
