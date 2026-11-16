/* РАСКОЛ — единый фоновый саундтрек, сохраняющий состояние между страницами */
(() => {
  'use strict';

  const scriptUrl = document.currentScript && document.currentScript.src;
  const crestUrl = scriptUrl ? new URL('../images/raskol-crest.webp', scriptUrl).href : 'assets/images/raskol-crest.webp';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stateKey = 'rsk.music.state.v2';
  const sessionKey = 'rsk.music.session.v2';
  const tracks = [
    { title: "The Bard’s Tale", author: 'RandomMind', mood: 'Таверны и королевства', url: 'https://opengameart.org/sites/default/files/The_Bards_Tale.mp3', source: 'https://opengameart.org/content/medieval-the-bards-tale' },
    { title: 'Fantasy Orchestral Theme', author: 'Joth', mood: 'Большая история', url: 'https://opengameart.org/sites/default/files/FantasyOrchestralTheme_1.mp3', source: 'https://opengameart.org/content/fantasy-orchestral-theme' },
    { title: 'Medieval: Exploration', author: 'RandomMind', mood: 'Путешествие по землям', url: 'https://opengameart.org/sites/default/files/Exploration_0.mp3', source: 'https://opengameart.org/content/medieval-exploration' },
    { title: 'Medieval: Harvest Season', author: 'RandomMind', mood: 'Жизнь старого мира', url: 'https://opengameart.org/sites/default/files/harvestseason_2.mp3', source: 'https://opengameart.org/content/medieval-harvest-season' },
    { title: 'Hope', author: 'MintoDog', mood: 'Оркестровый подъём', url: 'https://opengameart.org/sites/default/files/hope_orchestral_battle_music_bpm165_0.ogg', source: 'https://opengameart.org/content/hopeorchestral-battle-music' },
    { title: 'Great Labyrinth', author: 'MintoDog', mood: 'Тёмные залы и подземелья', url: 'https://opengameart.org/sites/default/files/great_labyrinth_bpm160_0.ogg', source: 'https://opengameart.org/content/great-labyrinthorchestral-dungeon-music' }
  ];

  const readState = (storage, key) => {
    try { return JSON.parse(storage.getItem(key) || '{}'); } catch (_) { return {}; }
  };
  const saved = readState(localStorage, stateKey);
  const session = readState(sessionStorage, sessionKey);
  const hadSession = sessionStorage.getItem(sessionKey) !== null;
  const shouldAutoplay = !hadSession || Boolean(session.playing);
  let index = Number.isInteger(session.index) ? session.index : (Number.isInteger(saved.index) ? saved.index : 0);
  index = Math.max(0, Math.min(tracks.length - 1, index));
  let resumeAt = session.index === index ? Math.max(0, Number(session.time) || 0) : 0;
  let shuffle = Boolean(saved.shuffle);
  let repeat = Boolean(saved.repeat);
  let autoplayBlocked = false;
  let restoring = true;

  const transition = document.createElement('div');
  transition.className = 'rsk-page-transition';
  transition.setAttribute('aria-hidden', 'true');
  transition.innerHTML = '<div class="rsk-transition-core"><img class="rsk-transition-crest" alt="" src="' + crestUrl + '"><span class="rsk-transition-label">РАСКОЛ · ДВЕ КОРОНЫ</span><i class="rsk-transition-line"></i></div>';
  document.body.appendChild(transition);
  window.addEventListener('pageshow', () => {
    transition.classList.remove('is-active');
    transition.setAttribute('aria-hidden', 'true');
  });
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download') || link.getAttribute('href').startsWith('#')) return;
    let destination;
    try { destination = new URL(link.href, location.href); } catch (_) { return; }
    if (destination.origin !== location.origin || destination.pathname === location.pathname) return;
    event.preventDefault();
    transition.classList.add('is-active');
    transition.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => { location.href = destination.href; }, reducedMotion ? 0 : 180);
  });

  const player = document.createElement('aside');
  player.className = 'rsk-music-player';
  player.setAttribute('aria-label', 'Музыкальный зал РАСКОЛА');
  player.innerHTML = `
    <div class="rsk-music-top">
      <img class="rsk-music-crest" src="${crestUrl}" alt="Герб РАСКОЛА">
      <div class="rsk-music-meta">
        <span class="rsk-music-kicker">Музыкальный зал</span>
        <span class="rsk-music-title"></span>
        <span class="rsk-music-subtitle"></span>
      </div>
      <button class="rsk-music-control rsk-music-play" type="button" aria-label="Включить музыку" aria-pressed="false">▶</button>
      <button class="rsk-music-collapse" type="button" aria-label="Свернуть плеер" aria-expanded="true">−</button>
    </div>
    <div class="rsk-music-progress-row"><span class="rsk-time-current">0:00</span><input class="rsk-music-progress" type="range" min="0" max="1000" value="0" aria-label="Позиция композиции"><span class="rsk-time-total">0:00</span></div>
    <div class="rsk-music-controls">
      <button class="rsk-music-small rsk-music-prev" type="button" aria-label="Предыдущая композиция">↶</button>
      <button class="rsk-music-small rsk-music-shuffle" type="button" aria-label="Случайный порядок" aria-pressed="false">⤨</button>
      <select class="rsk-music-select" aria-label="Выбрать композицию"></select>
      <button class="rsk-music-small rsk-music-repeat" type="button" aria-label="Повтор композиции" aria-pressed="false">↻</button>
      <button class="rsk-music-small rsk-music-next" type="button" aria-label="Следующая композиция">↠</button>
    </div>
    <div class="rsk-music-bottom"><label class="rsk-volume-label">ГРОМКОСТЬ <input class="rsk-music-volume" type="range" min="0" max="1" step="0.01" value="0.22" aria-label="Громкость"></label><span class="rsk-music-status" role="status" aria-live="polite">Пытаемся настроить эфир…</span></div>
    <div class="rsk-music-credit">Музыка · CC0 · <a class="rsk-music-source" href="https://opengameart.org/content/medieval-the-bards-tale" target="_blank" rel="noopener noreferrer">автор и лицензия</a></div>`;
  document.body.appendChild(player);

  const audio = document.createElement('audio');
  audio.preload = 'none';
  audio.volume = Number.isFinite(saved.volume) ? Math.max(0, Math.min(1, saved.volume)) : 0.22;
  audio.setAttribute('playsinline', '');
  player.appendChild(audio);

  const $ = (selector) => player.querySelector(selector);
  const playButton = $('.rsk-music-play');
  const select = $('.rsk-music-select');
  const progress = $('.rsk-music-progress');
  const volume = $('.rsk-music-volume');
  const status = $('.rsk-music-status');
  const formatTime = (value) => {
    if (!Number.isFinite(value)) return '0:00';
    const seconds = Math.max(0, Math.floor(value));
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  };

  tracks.forEach((track, trackIndex) => {
    const option = document.createElement('option');
    option.value = String(trackIndex);
    option.textContent = track.title;
    select.appendChild(option);
  });

  function persist() {
    try {
      localStorage.setItem(stateKey, JSON.stringify({ index, volume: audio.volume, shuffle, repeat, collapsed: player.classList.contains('is-collapsed') }));
      sessionStorage.setItem(sessionKey, JSON.stringify({ index, time: restoring ? resumeAt : (Number.isFinite(audio.currentTime) ? audio.currentTime : 0), playing: !audio.paused }));
    } catch (_) { /* Хранилище может быть отключено настройками браузера. */ }
  }

  function updateTrack() {
    const track = tracks[index];
    $('.rsk-music-title').textContent = track.title;
    $('.rsk-music-subtitle').textContent = track.mood + ' · ' + track.author;
    $('.rsk-music-source').href = track.source;
    select.value = String(index);
  }

  function updatePlayback() {
    const playing = !audio.paused;
    player.classList.toggle('is-playing', playing);
    playButton.textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label', playing ? 'Поставить музыку на паузу' : 'Включить музыку');
    playButton.setAttribute('aria-pressed', String(playing));
    if (playing) status.textContent = 'Саундтрек звучит';
    persist();
  }

  async function startPlayback() {
    try {
      await audio.play();
      autoplayBlocked = false;
      updatePlayback();
      status.textContent = 'Саундтрек звучит';
    } catch (_) {
      autoplayBlocked = true;
      updatePlayback();
      status.textContent = 'Нажми ▶, чтобы включить звук';
      playButton.classList.add('needs-gesture');
    }
  }

  function loadTrack(nextIndex, shouldPlay, startAt = 0) {
    index = (nextIndex + tracks.length) % tracks.length;
    updateTrack();
    audio.src = tracks[index].url;
    audio.load();
    audio.addEventListener('loadedmetadata', function restorePosition() {
      audio.removeEventListener('loadedmetadata', restorePosition);
      if (startAt > 0 && Number.isFinite(audio.duration)) audio.currentTime = Math.min(startAt, Math.max(0, audio.duration - 1));
    });
    if (shouldPlay) startPlayback();
    persist();
  }

  function nextTrack() {
    const next = shuffle ? (() => {
      if (tracks.length < 2) return index;
      let candidate = index;
      while (candidate === index) candidate = Math.floor(Math.random() * tracks.length);
      return candidate;
    })() : index + 1;
    loadTrack(next, true);
  }

  function previousTrack() {
    if (audio.currentTime > 4) {
      audio.currentTime = 0;
      return;
    }
    loadTrack(index - 1, true);
  }

  playButton.addEventListener('click', () => {
    playButton.classList.remove('needs-gesture');
    if (audio.paused) {
      if (!audio.src) loadTrack(index, false);
      startPlayback();
    } else {
      audio.pause();
      updatePlayback();
      status.textContent = 'Музыка на паузе';
    }
  });
  $('.rsk-music-next').addEventListener('click', nextTrack);
  $('.rsk-music-prev').addEventListener('click', previousTrack);
  $('.rsk-music-shuffle').addEventListener('click', () => {
    shuffle = !shuffle;
    $('.rsk-music-shuffle').setAttribute('aria-pressed', String(shuffle));
    $('.rsk-music-shuffle').classList.toggle('is-active', shuffle);
    persist();
  });
  $('.rsk-music-repeat').addEventListener('click', () => {
    repeat = !repeat;
    audio.loop = repeat;
    $('.rsk-music-repeat').setAttribute('aria-pressed', String(repeat));
    $('.rsk-music-repeat').classList.toggle('is-active', repeat);
    persist();
  });
  select.addEventListener('change', () => loadTrack(Number(select.value), true));
  volume.value = String(audio.volume);
  volume.addEventListener('input', () => { audio.volume = Number(volume.value); persist(); });
  progress.addEventListener('input', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = audio.duration * Number(progress.value) / 1000;
  });
  audio.addEventListener('timeupdate', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      if (!progress.matches(':active')) progress.value = String(Math.round(audio.currentTime / audio.duration * 1000));
      $('.rsk-time-current').textContent = formatTime(audio.currentTime);
      $('.rsk-time-total').textContent = formatTime(audio.duration);
    }
  });
  audio.addEventListener('play', updatePlayback);
  audio.addEventListener('pause', updatePlayback);
  audio.addEventListener('ended', () => { if (!repeat) nextTrack(); });
  audio.addEventListener('error', () => { status.textContent = 'Трек недоступен · попробуй следующий'; });

  const collapse = $('.rsk-music-collapse');
  collapse.addEventListener('click', () => {
    const collapsed = player.classList.toggle('is-collapsed');
    collapse.textContent = collapsed ? '+' : '−';
    collapse.setAttribute('aria-expanded', String(!collapsed));
    collapse.setAttribute('aria-label', collapsed ? 'Развернуть плеер' : 'Свернуть плеер');
    persist();
  });
  const initialCollapsed = typeof saved.collapsed === 'boolean' ? saved.collapsed : window.matchMedia('(max-width: 800px)').matches;\n  if (initialCollapsed) {
    player.classList.add('is-collapsed');
    collapse.textContent = '+';
    collapse.setAttribute('aria-expanded', 'false');
  }
  $('.rsk-music-shuffle').setAttribute('aria-pressed', String(shuffle));
  $('.rsk-music-shuffle').classList.toggle('is-active', shuffle);
  $('.rsk-music-repeat').setAttribute('aria-pressed', String(repeat));
  $('.rsk-music-repeat').classList.toggle('is-active', repeat);
  audio.loop = repeat;
  updateTrack();
  audio.src = tracks[index].url;
  audio.load();
  audio.addEventListener('loadedmetadata', () => {
    if (session.time > 0 && session.index === index && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.min(resumeAt, Math.max(0, audio.duration - 1));
    }
    restoring = false;
    persist();
  }, { once: true });

  // Автозапуск пробуем сразу; запрет браузера не обходим, а показываем понятную кнопку.
  if (shouldAutoplay) startPlayback();
  else status.textContent = 'Музыка выключена';
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => {
    // Не вызываем pause(): музыка продолжает играть в фоновой вкладке.
    if (!document.hidden) persist();
  });
  window.addEventListener('pageshow', () => { if (!restoring) persist(); });
})();
