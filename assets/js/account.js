/* RASKOL · вкладки личного кабинета (демонстрационный UI) */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const tabs=[...document.querySelectorAll('[data-tab]')];
  function activate(name){
    tabs.forEach(t=>{const active=t.dataset.tab===name;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});
    document.querySelectorAll('.account-pane').forEach(p=>{const active=p.id==='tab-'+name;p.hidden=!active;p.classList.toggle('active',active);});
    const url=new URL(window.location.href);url.searchParams.set('tab',name);history.replaceState(null,'',url);
  }
  tabs.forEach((t,index)=>{t.addEventListener('click',()=>activate(t.dataset.tab));t.addEventListener('keydown',event=>{const keys=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();let next=index;if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%tabs.length;else next=(index-1+tabs.length)%tabs.length;tabs[next].focus();activate(tabs[next].dataset.tab);});});
  document.querySelectorAll('[data-open-tab]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.openTab)));
  const requested=new URLSearchParams(location.search).get('tab');
  activate(['balance','topup','limits'].includes(requested)?requested:'balance');
  $('#verifyLinkCode').addEventListener('click',()=>{
    const code=($('#linkCode').value||'').replace(/\s/g,'');
    const status=$('#linkStatus');
    if(!/^\d{6,8}$/.test(code)){status.textContent='Введи одноразовый код из 6–8 цифр, который выдала команда /link в игре.';return;}
    status.textContent='Формат кода принят, но Identity API ещё не подключён. Проверка не выполнялась, вход и привязка не созданы.';
  });
  $('#saveLimits').addEventListener('click',()=>{
    const day=Math.min(100000,Math.max(0,Math.floor(Number($('#dailyLimit').value)||0)));
    const month=Math.min(1000000,Math.max(0,Math.floor(Number($('#monthlyLimit').value)||0)));
    $('#dailyLimit').value=String(day);$('#monthlyLimit').value=String(month);
    $('#limitPreview').textContent='Предпросмотр: до '+day.toLocaleString('ru-RU')+' И в сутки и '+month.toLocaleString('ru-RU')+' И за календарный месяц. Настройки не сохранены: требуется вход и Wallet API.';
  });
})();