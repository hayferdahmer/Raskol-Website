/* RASKOL — лёгкие атмосферные частицы и reveal-анимации */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.id = 'rsk-ash';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const targets = document.querySelectorAll(
    'main > *, main section, .class-card, .detail-head, .facts, .fact, .spec, .foot'
  );
  targets.forEach((el, index) => {
    el.classList.add('rsk-reveal');
    el.style.transitionDelay = (Math.min(index % 6, 5) * 70) + 'ms';
  });

  if ('IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    targets.forEach((el) => observer.observe(el));
  } else {
    targets.forEach((el) => el.classList.add('is-visible'));
  }

  if (reduced) {
    canvas.remove();
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  let width = 0, height = 0, dpr = 1, frame = 0;
  const particles = [];
  const count = Math.min(72, Math.max(28, Math.floor(window.innerWidth / 19)));
  const random = (min, max) => min + Math.random() * (max - min);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function createParticle(fromBottom = false) {
    return {
      x: random(0, width),
      y: fromBottom ? height + random(0, 70) : random(0, height),
      r: random(.55, 1.8),
      vy: random(.12, .42),
      vx: random(-.12, .12),
      alpha: random(.12, .48),
      phase: random(0, Math.PI * 2),
      sway: random(.003, .012)
    };
  }
  function init() {
    resize();
    particles.length = 0;
    for (let i = 0; i < count; i++) particles.push(createParticle());
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.phase += p.sway;
      p.x += p.vx + Math.sin(p.phase) * .18;
      p.y -= p.vy;
      if (p.y < -8 || p.x < -12 || p.x > width + 12) Object.assign(p, createParticle(true));
      ctx.beginPath();
      ctx.fillStyle = 'rgba(207, 139, 145,' + p.alpha + ')';
      ctx.shadowBlur = p.r > 1.35 ? 8 : 3;
      ctx.shadowColor = 'rgba(166, 83, 98, .35)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    frame = window.requestAnimationFrame(draw);
  }
  init();
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
    } else if (!reduced) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    }
  });
  draw();
})();
