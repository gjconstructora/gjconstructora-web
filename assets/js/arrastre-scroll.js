/*
  Mauri Jocou Constructora — desplazar la página arrastrando con el mouse (pedido de Arian, 28/09/2026).

  En computadoras con mouse, hacer clic y arrastrar hacia arriba o hacia abajo mueve la página
  como la rueda (la página sigue al mouse, igual que en el celular). Reemplaza la selección de
  texto por arrastre.

  No actúa donde arrastrar ya tiene otra función: links, botones, formularios, videos,
  comparadores modelo/obra, visor 3D, menú y visor de fotos. En celulares y tablets no hace nada.
*/
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var EXCLUIR = 'a, button, input, select, textarea, label, video, audio, iframe, summary, [contenteditable], ' +
                '.comparador, .visor-escena, #menu, .lightbox-overlay, [data-sin-arrastre]';
  var UMBRAL = 5;                 // píxeles antes de empezar a mover (deja pasar los clics)
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raiz = document.documentElement;
  var activo = false, moviendo = false, y0 = 0, s0 = 0, ultY = 0, ultT = 0, vel = 0, raf = 0, anularClic = false;

  var estilo = document.createElement('style');
  estilo.textContent = '.arrastrando, .arrastrando * { cursor: grabbing !important; user-select: none !important; }';
  document.head.appendChild(estilo);

  function irA(y) {
    try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); }
  }

  document.addEventListener('mousedown', function (e) {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (e.clientX >= raiz.clientWidth) return;                   // clic en la barra de desplazamiento
    if (e.target.closest && e.target.closest(EXCLUIR)) return;
    cancelAnimationFrame(raf);
    activo = true; moviendo = false;
    y0 = ultY = e.clientY; s0 = window.scrollY; ultT = performance.now(); vel = 0;
    e.preventDefault();                                           // en lugar de empezar a seleccionar texto
  });

  window.addEventListener('mousemove', function (e) {
    if (!activo) return;
    var dy = e.clientY - y0;
    if (!moviendo) {
      if (Math.abs(dy) < UMBRAL) return;
      moviendo = true; raiz.classList.add('arrastrando');
    }
    irA(s0 - dy);
    var t = performance.now();
    vel = (e.clientY - ultY) / Math.max(1, t - ultT);
    ultY = e.clientY; ultT = t;
  });

  window.addEventListener('mouseup', function () {
    if (!activo) return;
    activo = false;
    if (!moviendo) return;
    raiz.classList.remove('arrastrando');
    anularClic = true; setTimeout(function () { anularClic = false; }, 0);
    if (reducir || performance.now() - ultT > 80) return;       // sin envión si se soltó quieto
    var v = -vel * 16;
    (function envion() {
      if (Math.abs(v) < 0.5) return;
      irA(window.scrollY + v); v *= 0.94;
      raf = requestAnimationFrame(envion);
    })();
  });

  // Después de arrastrar no se dispara el clic del elemento donde se soltó.
  document.addEventListener('click', function (e) {
    if (anularClic) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener('dragstart', function (e) { if (activo) e.preventDefault(); });
  // Cualquier rueda o tecla corta el envión.
  window.addEventListener('wheel', function () { cancelAnimationFrame(raf); }, { passive: true });
  window.addEventListener('keydown', function () { cancelAnimationFrame(raf); });
})();
