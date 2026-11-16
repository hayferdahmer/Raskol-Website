/* RASKOL — атмосферный слой: пепел, мягкое свечение и появление контента */
(() => {
  'use strict';

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(pointer: fine)');
  const body = document.body;
  if (!body) return;

  const targets = body.querySelectorAll(
    'main > *, main section, .class-card, .detail-head, .facts, .fact, .spec, .foot, .world-card, .world-section'
  );

  targets.forEach((element, index) => {
    element.classList.add('rsk-reveal');
    element.style.transitionDelay = (Math.min(index % 6, 5) * 65) + 'ms';
  });

  const revealImmediately = () => targets.forEach((element) => element.classList.add('is-visible'));
  if (motionQuery.matches || !('IntersectionObserver' in window)) {
    revealImmediately();
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });
    targets.forEach((element) => observer.observe(element));
  }

  // Слои синематографа включаются только после появления реальной разметки и масок.
  const cinemaScenes = body.querySelectorAll('[data-rsk-cinemagraph]');
  if (cinemaScenes.length && 'IntersectionObserver' in window) {
    const cinemaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('rsk-cinema-active', entry.isIntersecting));
    }, { threshold: 0.01 });
    cinemaScenes.forEach((scene) => cinemaObserver.observe(scene));
  } else if (cinemaScenes.length && !motionQuery.matches) {
    cinemaScenes.forEach((scene) => scene.classList.add('rsk-cinema-active'));
  }

  if (motionQuery.matches) return;

  // Небольшой 2.5D-параллакс ограничен несколькими пикселями и не двигает сам арт.
  const parallaxScenes = Array.from(cinemaScenes);
  if (finePointerQuery.matches && parallaxScenes.length) {
    let pointerFrame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const renderParallax = () => {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;
      parallaxScenes.forEach((scene) => {
        scene.style.setProperty('--rsk-pointer-x', currentX.toFixed(3));
        scene.style.setProperty('--rsk-pointer-y', currentY.toFixed(3));
      });
      if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
        pointerFrame = window.requestAnimationFrame(renderParallax);
      } else {
        pointerFrame = 0;
      }
    };
    window.addEventListener('pointermove', (event) => {
      targetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      targetY = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(renderParallax);
    }, { passive: true });
    window.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(renderParallax);
    });
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'rsk-ash';
  canvas.setAttribute('aria-hidden', 'true');
  body.appendChild(canvas);

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) {
    canvas.remove();
    return;
  }

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let animationFrame = 0;
  const particles = [];
  const particleCount = Math.min(68, Math.max(24, Math.floor(window.innerWidth / 21)));
  const random = (min, max) => min + Math.random() * (max - min);

  function resizeCanvas() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function createParticle(fromBottom = false) {
    return {
      x: random(0, width),
      y: fromBottom ? height + random(4, 90) : random(0, height),
      radius: random(0.55, 1.65),
      speed: random(0.1, 0.38),
      drift: random(-0.1, 0.1),
      alpha: random(0.1, 0.38),
      phase: random(0, Math.PI * 2),
      pulse: random(0.002, 0.009)
    };
  }

  function resetParticles() {
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push(createParticle());
    }
  }

  const pointer = {
    active: false,
    targetX: -100,
    targetY: -100,
    x: -100,
    y: -100
  };
  let glow;
  let cursor;

  if (finePointerQuery.matches) {
    glow = document.createElement('div');
    cursor = document.createElement('div');
    glow.className = 'cursor-glow';
    cursor.className = 'custom-cursor';
    glow.setAttribute('aria-hidden', 'true');
    cursor.setAttribute('aria-hidden', 'true');
    body.append(glow, cursor);
    body.classList.add('cursor-ready');

    window.addEventListener('pointermove', (event) => {
      pointer.active = true;
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      body.classList.add('cursor-active');
    }, { passive: true });

    window.addEventListener('pointerout', (event) => {
      if (event.relatedTarget !== null) return;
      pointer.active = false;
      body.classList.remove('cursor-active', 'cursor-hover');
    });

    const interactive = 'a, button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';
    document.addEventListener('pointerover', (event) => {
      if (event.target.closest?.(interactive)) body.classList.add('cursor-hover');
    });
    document.addEventListener('pointerout', (event) => {
      if (!event.relatedTarget?.closest?.(interactive)) body.classList.remove('cursor-hover');
    });
    window.addEventListener('blur', () => {
      pointer.active = false;
      body.classList.remove('cursor-active', 'cursor-hover');
    });
  }

  function draw() {
    context.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.phase += particle.pulse;
      particle.x += particle.drift + Math.sin(particle.phase) * 0.16;
      particle.y -= particle.speed;

      if (particle.y < -10 || particle.x < -14 || particle.x > width + 14) {
        Object.assign(particle, createParticle(true));
      }

      context.beginPath();
      context.fillStyle = 'rgba(207, 139, 145,' + particle.alpha + ')';
      context.shadowBlur = particle.radius > 1.25 ? 7 : 2;
      context.shadowColor = 'rgba(166, 83, 98, .3)';
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.shadowBlur = 0;

    if (pointer.active && cursor && glow) {
      pointer.x += (pointer.targetX - pointer.x) * 0.24;
      pointer.y += (pointer.targetY - pointer.y) * 0.24;
      cursor.style.left = pointer.x + 'px';
      cursor.style.top = pointer.y + 'px';
      glow.style.left = pointer.x + 'px';
      glow.style.top = pointer.y + 'px';
    }

    animationFrame = window.requestAnimationFrame(draw);
  }

  resizeCanvas();
  resetParticles();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(draw);
    }
  });

  draw();
})();
