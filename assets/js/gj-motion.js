/*
  GJ Constructora — capa de movimiento (complemento)

  NO reemplaza gsap-animations.js: solo agrega lo que ese archivo no cubre
  (el hero nuevo con video, la sección del gemelo y la banda de destacados).
  Se carga DESPUÉS y usa la misma guarda: si el CDN de GSAP no cargó, sale en
  silencio y todo queda visible, porque nada depende de la animación para verse.

  Criterio: poco y lento. Entradas de 0,5-0,7 s, una sola vez, sin loops ni
  parallax. Respeta prefers-reduced-motion.
*/
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[GJ] GSAP no disponible: movimiento extra desactivado.');
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var hay = function (sel) { return document.querySelectorAll(sel).length > 0; };

  /* 1. HERO — el resto del bloque entra escalonado detrás del h1.
        gsap-animations.js ya anima h1, .hero-divider y .hero-subtitle;
        acá van las piezas nuevas para que el bloque entre como una unidad. */
  if (hay('.hero-video .hero-kicker')) {
    gsap.from('.hero-video .hero-kicker', {
      opacity: 0, y: 14, duration: 0.6, delay: 0.15, ease: 'power2.out', clearProps: 'all'
    });
    gsap.from('.hero-video .hero-acciones > *', {
      opacity: 0, y: 16, duration: 0.55, delay: 0.75, stagger: 0.1,
      ease: 'power2.out', clearProps: 'all'
    });
    gsap.from('.hero-video .hero-nota', {
      opacity: 0, duration: 0.6, delay: 1.15, ease: 'power1.out', clearProps: 'all'
    });
  }

  /* 2. CIFRAS — la línea superior se dibuja cuando entra la banda.
        Los números ya los cuenta gsap-animations.js. */
  if (hay('.stats-bar')) {
    gsap.from('.stats-bar', {
      scaleX: 0.92, opacity: 0, duration: 0.7, ease: 'power2.out',
      transformOrigin: 'center center', clearProps: 'all',
      scrollTrigger: { trigger: '.stats-bar', start: 'top 90%', once: true }
    });
  }

  /* 3. GEMELO DIGITAL — texto y tarjetas, escalonado.
        Esta sección no estaba contemplada en el archivo original. */
  if (hay('.gemelo-section')) {
    gsap.from('.gemelo-text > *', {
      opacity: 0, y: 18, duration: 0.6, stagger: 0.12, ease: 'power2.out', clearProps: 'all',
      scrollTrigger: { trigger: '.gemelo-section', start: 'top 78%', once: true }
    });
    gsap.from('.gemelo-card', {
      opacity: 0, y: 20, duration: 0.5, stagger: 0.08, ease: 'power2.out', clearProps: 'all',
      scrollTrigger: { trigger: '.gemelo-images', start: 'top 82%', once: true }
    });
  }

  /* 4. DESTACADOS — la etiqueta de precio entra un instante después de la tarjeta,
        que es lo que hace que el ojo la registre. */
  if (hay('.destacado-duplex .etiqueta-venta')) {
    gsap.from('.destacado-duplex .etiqueta-venta', {
      opacity: 0, y: -8, duration: 0.45, delay: 0.25, ease: 'back.out(1.6)', clearProps: 'all',
      scrollTrigger: { trigger: '.destacado-duplex', start: 'top 85%', once: true }
    });
  }

  /* 5. TÍTULOS de sección en páginas internas: una entrada corta y sobria. */
  if (hay('#main .inner > h1.centered-title, #main .inner > h2.centered-title')) {
    gsap.utils.toArray('#main .inner > h1.centered-title, #main .inner > h2.centered-title')
      .forEach(function (el) {
        gsap.from(el, {
          opacity: 0, y: 16, duration: 0.55, ease: 'power2.out', clearProps: 'all',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });
  }
})();
