/* RASKOL · интерактивная витрина и демонстрационный Чертог */
(() => {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const products = [
    {id:'sigil-crown',cat:'appearance',name:'Печать двух корон',type:'Геральдический облик',desc:'Церемониальный знак над головой персонажа.',price:390,icon:'♜',collection:'regalia',flag:'Знак дома'},
    {id:'mantle-ash',cat:'appearance',name:'Мантия пепла',type:'Косметический облик',desc:'Сдержанный силуэт с дымчатой отделкой.',price:690,icon:'♟',collection:'ash',flag:'Пепел'},
    {id:'crimson-mark',cat:'appearance',name:'Багряный знак',type:'Облик',desc:'Алый орнамент старого королевского дома.',price:450,icon:'✦',collection:'crimson'},
    {id:'ash-trail',cat:'effects',name:'След углей',type:'Эффект передвижения',desc:'Медленно гаснущие частицы за шагом.',price:290,icon:'✧',collection:'ash'},
    {id:'crown-aura',cat:'effects',name:'Аура регента',type:'Косметическая аура',desc:'Тонкое золотистое свечение без боевых эффектов.',price:590,icon:'◈',collection:'regalia',flag:'Избранное'},
    {id:'red-mist',cat:'effects',name:'Багряный туман',type:'Окружающий эффект',desc:'Короткий шлейф красной дымки.',price:490,icon:'〰',collection:'crimson'},
    {id:'raven-pet',cat:'pets',name:'Ворон-вестник',type:'Декоративный питомец',desc:'Спутник без атаки, лута и игровых бонусов.',price:890,icon:'♧',collection:'regalia'},
    {id:'moth-pet',cat:'pets',name:'Пепельная моль',type:'Декоративный питомец',desc:'Мягкое свечение и спокойная анимация.',price:650,icon:'❋',collection:'ash'},
    {id:'title-exile',cat:'titles',name:'Изгнанник',type:'Титул',desc:'Короткая подпись для профиля и чата.',price:180,icon:'†',collection:'ash'},
    {id:'title-keeper',cat:'titles',name:'Хранитель клятвы',type:'Титул',desc:'Знак верности выбранному пути.',price:250,icon:'⚜',collection:'regalia'},
    {id:'frame-garnet',cat:'interface',name:'Гранатовая рамка',type:'Оформление интерфейса',desc:'Бордовая рамка профиля и карточек.',price:220,icon:'▣',collection:'crimson'},
    {id:'banner-court',cat:'interface',name:'Знамя двора',type:'Оформление профиля',desc:'Фон профиля с геральдическим орнаментом.',price:320,icon:'⚑',collection:'regalia'},
    {id:'bundle-embers',cat:'bundles',name:'Набор «Тлеющий двор»',type:'Коллекционный набор',desc:'Только визуальные предметы: след углей, титул и рамка профиля. Без характеристик и игровых эффектов.',price:790,icon:'❖',collection:'ash',flag:'Набор'},
    {id:'bundle-crown',cat:'bundles',name:'Набор «Две короны»',type:'Коллекционный набор',desc:'Только визуальные предметы: печать, аура и знамя двора. Без характеристик и игровых эффектов.',price:1090,icon:'♛',collection:'regalia',flag:'Набор'},
    {id:'season-winter',cat:'season',name:'Снежная печать',type:'Сезонная косметика',desc:'Только визуальный зимний орнамент ограниченного сезона.',price:350,icon:'❄',collection:'season'},
    {id:'season-eclipse',cat:'season',name:'Затмение',type:'Сезонный эффект',desc:'Только декоративное кольцо тени с серебряными искрами; не влияет на бой и характеристики.',price:520,icon:'☾',collection:'season'},
    {id:'subscription-court',cat:'subscription',name:'Покровительство двора',type:'Косметическая подписка · 30 дней',desc:'Ежемесячная подборка обликов профиля, рамок и титулов. Без ускорения прогресса и игровых бонусов.',price:490,icon:'♛',collection:'regalia',flag:'Подписка'},
    {id:'subscription-ash',cat:'subscription',name:'Пепельный договор',type:'Косметическая подписка · 30 дней',desc:'Сезонная косметика, декоративные следы и оформление профиля. Никаких боевых преимуществ.',price:390,icon:'✧',collection:'ash',flag:'Подписка'},
    {id:'pass-season',cat:'battlepass',name:'Путь двух корон',type:'Боевой пропуск · сезон',desc:'Косметическая дорожка наград за игровые задания: титулы, рамки, облики и визуальные эффекты. Не даёт опыта, валюты или усиления персонажа.',price:790,icon:'⚜',collection:'regalia',flag:'Сезонный пропуск'}
  ];
  const cases = [
    {id:'two-crowns',name:'Две короны',group:'crown',price:249,items:11,desc:'Геральдика, титулы и регалии двух старых домов.',icon:'♛',glow:'rgba(199,164,119,.28)'},
    {id:'blood-oath',name:'Кровавая клятва',group:'crown',price:399,items:11,desc:'Багряные эффекты и церемониальные облики.',icon:'⚔',glow:'rgba(166,58,76,.3)'},
    {id:'ashfall',name:'Пеплопад',group:'ash',price:99,items:11,desc:'Пыльные следы, дымка и сумрачные спутники.',icon:'✧',glow:'rgba(151,129,135,.24)'},
    {id:'black-embers',name:'Чёрные угли',group:'ash',price:179,items:11,desc:'Тёмные ауры и редкие титулы забытого двора.',icon:'◈',glow:'rgba(118,62,76,.3)'},
    {id:'winter-solstice',name:'Зимнее солнцестояние',group:'season',price:299,items:11,desc:'Сезонные украшения, доступные в зимней коллекции.',icon:'❄',glow:'rgba(122,154,190,.25)'},
    {id:'eclipse',name:'Затмение',group:'season',price:499,items:11,desc:'Серебро, тень и редкие эффекты ночного неба.',icon:'☾',glow:'rgba(126,119,173,.3)'},
    {id:'old-kingdom',name:'Старое королевство',group:'archive',price:149,items:11,desc:'Архивная подборка ранних косметических серий.',icon:'♜',glow:'rgba(172,128,84,.24)'},
    {id:'last-vow',name:'Последний обет',group:'archive',price:349,items:11,desc:'Архивные знаки, титулы и памятные эффекты.',icon:'†',glow:'rgba(148,68,87,.28)'}
  ];
  const rewards = [
    {name:'Знак старого дома',icon:'♜',rarity:'common',label:'Обычная'},
    {name:'Пепельный след',icon:'✧',rarity:'common',label:'Обычная'},
    {name:'Титул странника',icon:'†',rarity:'common',label:'Обычная'},
    {name:'Гранатовая рамка',icon:'▣',rarity:'uncommon',label:'Необычная'},
    {name:'Сумрачный шлейф',icon:'〰',rarity:'uncommon',label:'Необычная'},
    {name:'Знамя забытого двора',icon:'⚑',rarity:'uncommon',label:'Необычная'},
    {name:'Аура регента',icon:'◈',rarity:'rare',label:'Редкая'},
    {name:'Ворон-вестник',icon:'♧',rarity:'rare',label:'Редкая'},
    {name:'Мантия пепла',icon:'♟',rarity:'relic',label:'Реликтовая'},
    {name:'Печать двух корон',icon:'♛',rarity:'relic',label:'Реликтовая'},
    {name:'Корона затмения',icon:'✦',rarity:'legendary',label:'Легендарная'}
  ];
  const ritualTiers = {
    standard:{surcharge:0,weights:[65,25,9,.9,.1]},
    tempered:{surcharge:100,weights:[50,30,15,4,1]},
    royal:{surcharge:250,weights:[35,30,22,10,3]},
    imperial:{surcharge:500,weights:[20,25,30,18,7]}
  };
  let currentTier='standard';
  const rarityNames = {common:'Обычная',uncommon:'Необычная',rare:'Редкая',relic:'Реликтовая',legendary:'Легендарная'};
  const rarityIcons = {common:'✧',uncommon:'❖',rare:'◈',relic:'♛',legendary:'✦'};
  const rarityColors = {common:'#aaa4a1',uncommon:'#83b18c',rare:'#86a9dc',relic:'#d5a4e8',legendary:'#e7bd76'};
  const rarityGlows = {common:'rgba(170,164,161,.24)',uncommon:'rgba(131,177,140,.3)',rare:'rgba(134,169,220,.35)',relic:'rgba(213,164,232,.42)',legendary:'rgba(231,189,118,.5)'};
  const rarityBackgrounds = {common:'rgba(170,164,161,.1)',uncommon:'rgba(131,177,140,.12)',rare:'rgba(134,169,220,.13)',relic:'rgba(213,164,232,.14)',legendary:'rgba(231,189,118,.16)'};
  const categoryNames = {appearance:'Облик',effects:'Эффект',pets:'Спутник',titles:'Титул',interface:'Оформление',bundles:'Набор',season:'Сезонное',subscription:'Подписка',battlepass:'Боевой пропуск'};
  let currentCategory='all', currentCollection=null, currentCase=null, rolling=false, currentWinner=null;
  const art = icon => '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 8 101 31 101 83 60 110 19 83 19 31Z" fill="none" stroke="#c7a477" stroke-opacity=".7"/><path d="M60 22 88 38 88 75 60 92 32 75 32 38Z" fill="#542432" stroke="#a66a75"/><text x="60" y="69" text-anchor="middle" font-size="36" fill="#e0c5a3">'+icon+'</text><path d="M60 8V22M19 31 32 38M101 31 88 38" stroke="#e1c49e"/></svg>';
  const chestSvg = '<svg class="chest" viewBox="0 0 140 110" aria-hidden="true"><defs><linearGradient id="wood" x1="0" x2="1"><stop stop-color="#29151d"/><stop offset=".5" stop-color="#77404a"/><stop offset="1" stop-color="#211018"/></linearGradient><linearGradient id="metal"><stop stop-color="#76502f"/><stop offset=".5" stop-color="#e0bd83"/><stop offset="1" stop-color="#70482d"/></linearGradient></defs><path d="M17 42Q20 12 70 12t53 30v17H17Z" fill="url(#wood)" stroke="url(#metal)" stroke-width="3"/><path d="M12 55h116v43H12z" fill="url(#wood)" stroke="url(#metal)" stroke-width="3"/><path d="M27 55v43M113 55v43M60 55v43" stroke="#c69d68" stroke-width="3"/><path d="M60 38h20v29H60z" fill="url(#metal)" stroke="#e2c18d" stroke-width="2"/><circle cx="70" cy="51" r="5" fill="#2a131a"/><path d="M17 70h111M22 91h106" stroke="#d0a773" stroke-width="2"/></svg>';
  function renderProducts(){
    const query = ($('#productSearch').value || '').trim().toLocaleLowerCase('ru');
    const sort = $('#productSort').value;
    let list = products.filter(p => (currentCategory==='all'||p.cat===currentCategory) && (!currentCollection||p.collection===currentCollection) && (!query||(p.name+' '+p.type+' '+p.desc).toLocaleLowerCase('ru').includes(query)));
    if(sort==='low') list.sort((a,b)=>a.price-b.price);
    if(sort==='high') list.sort((a,b)=>b.price-a.price);
    $('#catalogGrid').innerHTML = list.map(p=>'<article class="product"><div class="product-art">'+(p.flag?'<span class="product-flag">'+p.flag+'</span>':'')+art(p.icon)+'</div><div class="product-type">'+p.type+'</div><h3>'+p.name+'</h3><p>'+p.desc+'</p><div class="product-bottom"><div class="price">'+p.price+' <small>ИМП.</small></div><button class="buy" type="button" data-preview="'+p.id+'">Подробнее</button></div></article>').join('') || '<div class="empty">Ничего не найдено. Попробуй изменить запрос или категорию.</div>';
  }
  renderProducts();
  $('#filters').addEventListener('click',e=>{const button=e.target.closest('[data-cat]');if(!button)return;currentCategory=button.dataset.cat;currentCollection=null;$$('.filter').forEach(x=>x.classList.toggle('active',x===button));$$('.collection').forEach(x=>x.classList.remove('selected'));renderProducts();});
  $('#productSearch').addEventListener('input',renderProducts);
  $('#productSort').addEventListener('change',renderProducts);
  $$('.collection').forEach(card=>card.addEventListener('click',()=>{currentCollection=card.dataset.collection;currentCategory='all';$$('.filter').forEach(x=>x.classList.toggle('active',x.dataset.cat==='all'));renderProducts();}));
  const productModal=$('#productModal');
  function openProduct(id){
    const p=products.find(x=>x.id===id);if(!p)return;
    $('#productModalType').textContent=p.type+' · '+(p.collection==='regalia'?'Регалии двух корон':p.collection==='ash'?'Пепел':p.collection==='crimson'?'Багрянец':'Сезонная серия');
    $('#productModalTitle').textContent=p.name;$('#productModalDesc').textContent=p.desc;$('#productModalArt').innerHTML=art(p.icon);$('#productModalPrice').innerHTML=p.price+' <small>ИМП.</small>';
    productModal.classList.add('open');document.body.style.overflow='hidden';
  }
  function closeModal(modal){modal.classList.remove('open');if(!$('.modal.open'))document.body.style.overflow='';}
  $('#catalogGrid').addEventListener('click',e=>{const b=e.target.closest('[data-preview]');if(b)openProduct(b.dataset.preview);});
  $('#closeProductModal').addEventListener('click',()=>closeModal(productModal));
  productModal.addEventListener('click',e=>{if(e.target===productModal)closeModal(productModal);});
  function renderCases(group='all'){
    const list=cases.filter(c=>group==='all'||c.group===group);
    $('#caseGrid').innerHTML=list.map(c=>'<article class="case-card" style="--case-glow:'+c.glow+'"><div class="case-visual">'+chestSvg+'</div><div class="case-rank"><span>'+({crown:'Королевская серия',ash:'Пепельная серия',season:'Сезонная серия',archive:'Архив'}[c.group])+'</span><span>✦ '+c.items+'</span></div><h3 class="case-name">'+c.name+'</h3><p>'+c.desc+'</p><div class="project-price">Проектная цена · не списывается</div><div class="price">'+c.price+' <small>ИМП.</small></div><button class="case-open" type="button" data-case="'+c.id+'">Открыть ларец · демо ↗</button></article>').join('');
  }
  renderCases();
  $('#caseGrid').addEventListener('click',e=>{const b=e.target.closest('[data-case]');if(!b)return;openCase(cases.find(c=>c.id===b.dataset.case));});
  $('#caseTabs').addEventListener('click',e=>{const b=e.target.closest('[data-group]');if(!b)return;$$('.case-tab').forEach(x=>x.classList.toggle('active',x===b));renderCases(b.dataset.group);});
  const ageCheck=$('#ageCheck'),riskCheck=$('#riskCheck'),enter=$('#enterCaseHall');
  function updateGate(){enter.disabled=!(ageCheck.checked&&riskCheck.checked);}
  ageCheck.addEventListener('change',updateGate);riskCheck.addEventListener('change',updateGate);
  enter.addEventListener('click',()=>{if(enter.disabled)return;$('#caseGate').hidden=true;$('#caseContent').hidden=false;$('#caseContent').scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});});
  const caseModal=$('#caseModal'),dialog=$('#caseDialog');
  function openCase(c){
    if(rolling)return;currentCase=c;currentWinner=null;
    $('#modalTitle').textContent=c.name;$('#modalDesc').textContent=c.desc+' В коллекции — '+c.items+' косметических реликвий. Открытие бесплатное и не списывает указанную проектную цену.';
    $('#rollResult').textContent='Ларец запечатан. Готов ли ты снять печать?';
    $('#prizePool').innerHTML=rewards.map(item=>'<div class="prize-pool-item '+item.rarity+'"><span>'+item.icon+'</span><b>'+item.name+'</b><small>'+item.label+'</small></div>').join('');
    currentTier='standard';renderRitual();$('#rollProgress').style.transform='scaleX(0)';
    $('#winPanel').className='win-panel';$('#winPanel').innerHTML='';
    dialog.classList.remove('is-rolling','is-won');
    $('#rollBtn').disabled=false;$('#rollBtn').textContent='Начать обряд';
    buildIdleReel();caseModal.classList.add('open');document.body.style.overflow='hidden';
  }
  function buildIdleReel(){
    const track=$('#rouletteTrack');track.style.transition='none';track.style.transform='translateX(0)';
    track.innerHTML=Array.from({length:12},(_,i)=>{const item=rewards[i%rewards.length];return '<div class="roll-item '+item.rarity+'"><span class="roll-icon">'+item.icon+'</span><small>'+item.name+'</small></div>';}).join('');
  }
  function chooseReward(){
    const keys=['common','uncommon','rare','relic','legendary'];
    const weights=ritualTiers[currentTier].weights;
    const roll=Math.random()*100;let edge=0,rarity='common';
    for(let i=0;i<keys.length;i++){edge+=weights[i];if(roll<edge){rarity=keys[i];break;}}
    const pool=rewards.filter(item=>item.rarity===rarity);
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function renderRitual(){
    if(!currentCase)return;
    const tier=ritualTiers[currentTier],total=currentCase.price+tier.surcharge;
    $('#ritualTotal').innerHTML=total+' <i>ИМП.</i>';
    $('#ritualTotalNote').textContent='Ларец '+currentCase.price+' И + подношение '+tier.surcharge+' И = '+total+' И. Сумма демонстрационная, не списывается.';
    const keys=['common','uncommon','rare','relic','legendary'];
    const labels=['Обычная','Необычная','Редкая','Реликтовая','Легендарная'];
    $('#oddsDisplay').innerHTML=keys.map((key,i)=>'<div class="o-'+key+'"><b>'+String(tier.weights[i]).replace('.',',')+'%</b><small>'+labels[i]+'</small></div>').join('');
    $$('.ritual-tier').forEach(button=>button.classList.toggle('active',button.dataset.tier===currentTier));
  }
  $('#ritualTiers').addEventListener('click',e=>{
    const button=e.target.closest('[data-tier]');
    if(!button||rolling)return;
    currentTier=button.dataset.tier;renderRitual();
  });
  function makeReel(winner){
    const sequence=Array.from({length:36},(_,i)=>rewards[(i*7+Math.floor(Math.random()*rewards.length))%rewards.length]);
    const winnerIndex=31;sequence[winnerIndex]=winner;
    const track=$('#rouletteTrack');track.style.transition='none';track.style.transform='translateX(0)';
    track.innerHTML=sequence.map(item=>'<div class="roll-item '+item.rarity+'"><span class="roll-icon">'+item.icon+'</span><small>'+item.name+'</small></div>').join('');
    return {track,winnerIndex};
  }
  function celebrate(rarity){
    const host=$('#celebration');host.innerHTML='';
    const amount=rarity==='legendary'?54:rarity==='relic'?38:rarity==='rare'?25:15;
    for(let i=0;i<amount;i++){
      const spark=document.createElement('i');spark.className='spark';
      spark.style.left=(Math.random()*100)+'%';spark.style.top=(32+Math.random()*45)+'%';
      spark.style.color=rarityColors[rarity];spark.style.background=rarityColors[rarity];
      spark.style.setProperty('--dx',(Math.random()*300-150)+'px');spark.style.setProperty('--dy',(Math.random()*-240-30)+'px');
      spark.style.animationDelay=(Math.random()*.22)+'s';host.appendChild(spark);
    }
    setTimeout(()=>host.replaceChildren(),1900);
  }
  function showWinner(item){
    currentWinner=item;dialog.classList.remove('is-rolling');dialog.classList.add('is-won');
    $('#rollResult').textContent='Печать сорвана. Реликвия найдена.';
    $('#rollProgress').style.transform='scaleX(1)';
    const panel=$('#winPanel');panel.style.setProperty('--rarity-color',rarityColors[item.rarity]);panel.style.setProperty('--rarity-glow',rarityGlows[item.rarity]);panel.style.setProperty('--rarity-bg',rarityBackgrounds[item.rarity]);
    panel.innerHTML='<div class="win-kicker">Твоя находка · демонстрационный результат</div><div class="win-icon">'+item.icon+'</div><h3>'+item.name+'</h3><p>Косметическая реликвия · '+(item.rarity==='legendary'?'особая находка':'не влияет на игровой баланс')+'</p><span class="win-rarity">'+rarityNames[item.rarity]+' редкость</span>';
    panel.classList.add('show');$('#rollBtn').disabled=false;$('#rollBtn').textContent='Повторить обряд';celebrate(item.rarity);
  }
  function roll(){
    if(rolling)return;rolling=true;currentWinner=null;
    const winner=chooseReward();const {track,winnerIndex}=makeReel(winner);
    dialog.classList.remove('is-won');dialog.classList.add('is-charging','is-rolling');
    $('#winPanel').className='win-panel';$('#winPanel').innerHTML='';
    $('#rollBtn').disabled=true;$('#rollBtn').textContent='Печать снимается…';
    $('#rollResult').textContent='Древняя печать откликается…';
    $('#rollProgress').style.transform='scaleX(0)';
    const winnerCard=track.children[winnerIndex];
    const target=winnerCard.offsetLeft+(winnerCard.offsetWidth/2)-($('.roulette-window').clientWidth/2);
    const duration=reducedMotion?100:7800;
    const begin=()=>{
      dialog.classList.remove('is-charging');
      const started=performance.now();
      const tick=now=>{
        const p=Math.min(1,(now-started)/duration);
        const eased=p*p*(3-2*p);
        track.style.transform='translate3d('+(-target*eased)+'px,0,0)';
        $('#rollProgress').style.transform='scaleX('+p+')';
        if(p<.18)$('#rollResult').textContent='Печать трескается…';
        else if(p<.72)$('#rollResult').textContent='Реликвии проходят перед взором…';
        else if(p<.94)$('#rollResult').textContent='Последние мгновения…';
        else $('#rollResult').textContent='Печать почти сорвана…';
        if(p<1)requestAnimationFrame(tick);
        else {rolling=false;dialog.classList.remove('is-rolling');showWinner(winner);}
      };
      requestAnimationFrame(tick);
    };
    if(reducedMotion)begin();else window.setTimeout(begin,720);
  }
  $('#rollBtn').addEventListener('click',roll);
  function closeCaseModal(){if(rolling)return;closeModal(caseModal);}
  $('#closeModal').addEventListener('click',closeCaseModal);$('#modalClose2').addEventListener('click',closeCaseModal);
  caseModal.addEventListener('click',e=>{if(e.target===caseModal)closeCaseModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(productModal.classList.contains('open'))closeModal(productModal);if(caseModal.classList.contains('open'))closeCaseModal();}});

  const linkCode=$('#linkCode'),linkStatus=$('#linkStatus');
  $('#verifyLinkCode').addEventListener('click',()=>{
    const code=(linkCode.value||'').replace(/\s/g,'');
    if(!/^\d{6,8}$/.test(code)){linkStatus.textContent='Введи одноразовый код из 6–8 цифр, выданный командой /link.';return;}
    linkStatus.textContent='Код принят интерфейсом, но не проверен: Identity API не подключён. Привязка UUID не выполнена.';
  });
  const dailyLimit=$('#dailyLimit'),monthlyLimit=$('#monthlyLimit');
  $('#saveLimits').addEventListener('click',()=>{
    const day=Math.max(0,Math.floor(Number(dailyLimit.value)||0));
    const month=Math.max(0,Math.floor(Number(monthlyLimit.value)||0));
    $('#limitPreview').textContent='Предпросмотр: не более '+day.toLocaleString('ru-RU')+' И в сутки и '+month.toLocaleString('ru-RU')+' И за месяц. Это локальный макет, сервер не применяет лимит.';
  });
  const revealTargets=$('.reveal');
  if('IntersectionObserver'in window&&!reducedMotion){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.1,rootMargin:'0px 0px -35px 0px'});
    revealTargets.forEach(el=>observer.observe(el));
  }else revealTargets.forEach(el=>el.classList.add('visible'));
})();