/* РАСКОЛ — управление только кинематографической сценой главной страницы. */
(() => {
  'use strict';
  const scenes = Array.from(document.querySelectorAll('[data-rsk-cinemagraph]'));
  if (!scenes.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('rsk-cinema-active', entry.isIntersecting);
      });
    }, { threshold: 0.01 });
    scenes.forEach((scene) => observer.observe(scene));
  } else {
    scenes.forEach((scene) => scene.classList.add('rsk-cinema-active'));
  }

  if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

  let frame = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  const render = () => {
    currentX += (targetX - currentX) * 0.075;
    currentY += (targetY - currentY) * 0.075;
    scenes.forEach((scene) => {
      scene.style.setProperty('--rsk-pointer-x', currentX.toFixed(3));
      scene.style.setProperty('--rsk-pointer-y', currentY.toFixed(3));
    });
    if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
      frame = window.requestAnimationFrame(render);
    } else {
      frame = 0;
    }
  };
  window.addEventListener('pointermove', (event) => {
    targetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    targetY = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    if (!frame) frame = window.requestAnimationFrame(render);
  }, { passive: true });
  window.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    if (!frame) frame = window.requestAnimationFrame(render);
  });
})();
