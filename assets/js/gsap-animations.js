/*
  GJ Constructora — GSAP Animations (todas las páginas)
  Requiere: gsap.min.js + ScrollTrigger.min.js
*/

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Helper: animar solo si hay elementos ─── */
function has(selector) {
  return document.querySelectorAll(selector).length > 0;
}

/* ═══════════════════════════════════════════
   1. HERO — entrada en todas las páginas
   ═══════════════════════════════════════════ */
if (!reduced && has('.hero-section')) {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'all' } });
  tl.from('.hero-section', { opacity: 0, duration: 0.7, delay: 0.1 })
    .from('.hero-section h1, .hero-section h2', { opacity: 0, duration: 0.5 }, '-=0.4')
    .from('.hero-divider', { scaleX: 0, transformOrigin: 'center center', duration: 0.4 }, '-=0.2')
    .from('.hero-subtitle', { opacity: 0, duration: 0.35 }, '-=0.15');
}

/* ═══════════════════════════════════════════
   2. STATS — contadores animados (index.html)
   ═══════════════════════════════════════════ */
function animateCounter(el) {
  const text = el.textContent.trim();
  const match = text.match(/^(\d+)(.*)$/);
  if (!match) return;
  const target = parseInt(match[1], 10);
  const copper = el.querySelector('.copper');
  const suffix = copper ? '' : match[2];
  el.innerHTML = '0' + (copper ? copper.outerHTML : suffix);

  gsap.to({ val: 0 }, {
    val: target,
    duration: 1.8,
    ease: 'power2.out',
    onUpdate: function () {
      el.innerHTML = Math.round(this.targets()[0].val) + (copper ? copper.outerHTML : suffix);
    },
    onComplete: function () {
      el.innerHTML = target + (copper ? copper.outerHTML : suffix);
    }
  });
}

if (has('.stats-bar')) {
  ScrollTrigger.create({
    trigger: '.stats-bar',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      if (!reduced) {
        gsap.from('.stat-item', {
          opacity: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power2.out',
          clearProps: 'all'
        });
      }
      document.querySelectorAll('.stat-number').forEach(animateCounter);
    }
  });
}

/* ═══════════════════════════════════════════
   3. CARDS DESTACADAS (index.html)
   ═══════════════════════════════════════════ */
if (!reduced && has('.featured-ventas-container article')) {
  gsap.from('.featured-ventas-container article', {
    opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out',
    clearProps: 'all',
    scrollTrigger: { trigger: '.featured-ventas-container', start: 'top 85%', once: true }
  });
}

/* ═══════════════════════════════════════════
   4. OBRAS GRID (index.html)
   ═══════════════════════════════════════════ */
if (!reduced && has('#obras-destacadas article')) {
  gsap.from('#obras-destacadas article', {
    opacity: 0, duration: 0.6,
    stagger: { amount: 0.4, from: 'start' }, ease: 'power2.out',
    clearProps: 'all',
    scrollTrigger: { trigger: '#obras-destacadas', start: 'top 80%', once: true }
  });
}

/* ═══════════════════════════════════════════
   5. STORY BLOCKS (nosotros.html)
   ═══════════════════════════════════════════ */
if (!reduced && has('.story-block')) {
  document.querySelectorAll('.story-block').forEach((block, i) => {
    gsap.from(block, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: { trigger: block, start: 'top 80%', once: true }
    });
  });
}

/* ═══════════════════════════════════════════
   6. VALORES CARDS (nosotros.html)
   ═══════════════════════════════════════════ */
if (!reduced && has('.valor-card')) {
  gsap.from('.valor-card', {
    opacity: 0,
    duration: 0.5, stagger: { amount: 0.4, from: 'start' }, ease: 'power2.out',
    clearProps: 'all',
    scrollTrigger: { trigger: '.valores-grid', start: 'top 82%', once: true }
  });
}

/* ═══════════════════════════════════════════
   7. GALERÍA — wrappers + animaciones
   ═══════════════════════════════════════════ */
if (has('.gallery')) {
  // Si el HTML ya tiene gallery-grid/img-wrapper, solo agregar overlays faltantes.
  // Si no, crear la estructura desde JS (compatibilidad con HTML sin grid).
  document.querySelectorAll('.gallery .project-section').forEach(section => {
    const existingGrid = section.querySelector('.gallery-grid');

    if (existingGrid) {
      // Ya tiene estructura — solo agregar img-overlay si falta
      existingGrid.querySelectorAll('.img-wrapper').forEach(wrapper => {
        if (!wrapper.querySelector('.img-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'img-overlay';
          wrapper.appendChild(overlay);
        }
      });
    } else {
      // Estructura legacy: imágenes sueltas → crear grid
      const imgs = [...section.querySelectorAll(':scope > img')];
      if (!imgs.length) return;

      const grid = document.createElement('div');
      grid.className = 'gallery-grid';

      imgs.forEach(img => {
        const wrapper = document.createElement('div');
        wrapper.className = 'img-wrapper';
        const overlay = document.createElement('div');
        overlay.className = 'img-overlay';

        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        wrapper.appendChild(overlay);
        grid.appendChild(wrapper);
      });

      section.appendChild(grid);
    }
  });

  ScrollTrigger.refresh();

  // Animación GSAP — aparición escalonada al scroll
  if (!reduced) {
    document.querySelectorAll('.project-section').forEach(section => {
      const title = section.querySelector('h2');
      const wrappers = section.querySelectorAll('.img-wrapper');

      if (title) {
        gsap.from(title, {
          opacity: 0, duration: 0.5, ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: { trigger: section, start: 'top 85%', once: true }
        });
      }

      if (wrappers.length) {
        gsap.from(wrappers, {
          opacity: 0,
          duration: 0.5, stagger: { amount: 0.3, from: 'start' }, ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: { trigger: section, start: 'top 78%', once: true }
        });
      }
    });
  }
}

/* ═══════════════════════════════════════════
   8. CONTENT PANEL (ventas.html)
   ═══════════════════════════════════════════ */
if (!reduced && has('.content-panel')) {
  gsap.from('.content-panel', {
    opacity: 0, duration: 0.7, ease: 'power2.out',
    clearProps: 'all',
    scrollTrigger: { trigger: '.content-panel', start: 'top 85%', once: true }
  });
}

/* ═══════════════════════════════════════════
   9. GALLERY NAV BUTTONS
   ═══════════════════════════════════════════ */
if (!reduced && has('.gallery-nav')) {
  gsap.from('.gallery-nav a', {
    opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out',
    clearProps: 'all',
    scrollTrigger: { trigger: '.gallery-nav', start: 'top 92%', once: true }
  });
}

/* ═══════════════════════════════════════════
   10. FOOTER
   ═══════════════════════════════════════════ */
if (!reduced && has('#footer')) {
  gsap.from('#footer .inner', {
    opacity: 0, duration: 0.7, ease: 'power2.out',
    clearProps: 'all',
    scrollTrigger: { trigger: '#footer', start: 'top 90%', once: true }
  });
}

/* ═══════════════════════════════════════════
   11. WHATSAPP — entrada + pulso
   ═══════════════════════════════════════════ */
if (!reduced && has('.whatsapp-float')) {
  gsap.from('.whatsapp-float', { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(1.7)', delay: 1.1 });
  gsap.to('.whatsapp-float', {
    scale: 1.12, duration: 0.4, ease: 'power1.inOut',
    yoyo: true, repeat: -1, repeatDelay: 3.5, delay: 3
  });
}

/* ═══════════════════════════════════════════
   12. HEADER — se oscurece al hacer scroll
   ═══════════════════════════════════════════ */
ScrollTrigger.create({
  start: 'top -60',
  end: 99999,
  toggleClass: { className: 'scrolled', targets: '#header' }
});
