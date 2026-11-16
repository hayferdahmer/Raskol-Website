/* РАСКОЛ — компактный фоновый плеер и переходы между страницами */
(() => {
'use strict';
const scriptUrl=document.currentScript&&document.currentScript.src;
const crestUrl=scriptUrl?new URL('../images/raskol-crest.webp',scriptUrl).href:'assets/images/raskol-crest.webp';
const trackUrl='https://opengameart.org/sites/default/files/The_Bards_Tale.mp3';
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const transition=document.createElement('div');
transition.className='rsk-page-transition';transition.setAttribute('aria-hidden','true');
transition.innerHTML='<div class="rsk-transition-core"><img class="rsk-transition-crest" alt="" src="'+crestUrl+'"><span class="rsk-transition-label">РАСКОЛ · ДВЕ КОРОНЫ</span><i class="rsk-transition-line"></i></div>';
document.body.appendChild(transition);
window.addEventListener('pageshow',()=>{transition.classList.remove('is-active');transition.setAttribute('aria-hidden','true')});
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest('a[href]');if(!link||link.target||link.hasAttribute('download')||link.getAttribute('href').startsWith('#'))return;
 let destination;try{destination=new URL(link.href,location.href)}catch(_){return}
 if(destination.origin!==location.origin||destination.pathname===location.pathname)return;
 event.preventDefault();transition.classList.add('is-active');transition.setAttribute('aria-hidden','false');
 window.setTimeout(()=>{location.href=destination.href},reducedMotion?0:180);
});
const player=document.createElement('aside');player.className='rsk-music-player';player.setAttribute('aria-label','Фоновая музыка РАСКОЛА');
player.innerHTML='<img class="rsk-music-crest" src="'+crestUrl+'" alt="Герб РАСКОЛА"><div class="rsk-music-meta"><span class="rsk-music-kicker">Музыка мира</span><span class="rsk-music-title">The Bard’s Tale</span><span class="rsk-music-subtitle">Средневековая фантазия · CC0</span></div><button class="rsk-music-control" type="button" aria-label="Включить музыку" aria-pressed="false">▶</button><button class="rsk-music-collapse" type="button" aria-label="Свернуть плеер" aria-expanded="true">−</button><input class="rsk-music-volume" type="range" min="0" max="1" step="0.01" value="0.22" aria-label="Громкость фоновой музыки"><div class="rsk-music-credit">Музыка: RandomMind · <a href="https://opengameart.org/content/medieval-the-bards-tale" target="_blank" rel="noopener noreferrer">лицензия CC0</a></div>';
const audio=document.createElement('audio');audio.src=trackUrl;audio.loop=true;audio.preload='none';audio.volume=.22;player.appendChild(audio);document.body.appendChild(player);
const play=player.querySelector('.rsk-music-control'),collapse=player.querySelector('.rsk-music-collapse'),volume=player.querySelector('.rsk-music-volume');
play.addEventListener('click',async()=>{
 if(audio.paused){try{await audio.play();player.classList.add('is-playing');play.textContent='Ⅱ';play.setAttribute('aria-label','Поставить музыку на паузу');play.setAttribute('aria-pressed','true')}catch(_){play.textContent='!';play.setAttribute('aria-label','Не удалось загрузить музыку. Попробуй ещё раз')}}
 else{audio.pause();player.classList.remove('is-playing');play.textContent='▶';play.setAttribute('aria-label','Включить музыку');play.setAttribute('aria-pressed','false')}
});
volume.addEventListener('input',()=>{audio.volume=Number(volume.value)});
collapse.addEventListener('click',()=>{const hidden=player.classList.toggle('is-collapsed');collapse.textContent=hidden?'+':'−';collapse.setAttribute('aria-expanded',String(!hidden));collapse.setAttribute('aria-label',hidden?'Развернуть плеер':'Свернуть плеер')});
})();
