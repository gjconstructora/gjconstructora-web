(function() {
  var images = [];
  var currentIndex = 0;
  var overlay, lbImg, prevBtn, nextBtn;

  function init() {
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML =
      '<button class="lightbox-close" aria-label="Cerrar">&times;</button>' +
      '<button class="lightbox-nav lightbox-prev" aria-label="Anterior">&#8249;</button>' +
      '<img src="" alt="Imagen ampliada" />' +
      '<button class="lightbox-nav lightbox-next" aria-label="Siguiente">&#8250;</button>';
    document.body.appendChild(overlay);

    lbImg = overlay.querySelector('img');
    prevBtn = overlay.querySelector('.lightbox-prev');
    nextBtn = overlay.querySelector('.lightbox-next');

    overlay.querySelector('.lightbox-close').addEventListener('click', close);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });
    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigate(-1);
    });
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigate(1);
    });

    document.addEventListener('keydown', function(e) {
      if (!overlay.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });

    initZoom();

    document.querySelectorAll('.gallery .img-wrapper img, .gallery-grid .img-wrapper img').forEach(function(img) {
      img.addEventListener('click', function() {
        images = Array.from(img.closest('.gallery-grid, .gallery').querySelectorAll('.img-wrapper img'));
        currentIndex = images.indexOf(img);
        open(img.src);
      });
    });
  }

  function open(src) {
    resetZoom();
    lbImg.src = src;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateNav();
  }

  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    resetZoom();
  }

  function navigate(dir) {
    resetZoom();
    currentIndex += dir;
    if (currentIndex < 0) currentIndex = images.length - 1;
    if (currentIndex >= images.length) currentIndex = 0;
    lbImg.src = images[currentIndex].src;
    updateNav();
  }

  /* ---- Ampliar con la rueda del mouse (computadora) ----
     La rueda acerca y aleja hacia donde está el puntero (hasta 3 veces). Con la imagen
     ampliada, arrastrar la mueve. Cambiar de imagen o cerrar vuelve al tamaño normal. */
  var ZOOM_MAX = 3;
  var zs = 1, ztx = 0, zty = 0;                 // escala y desplazamiento actuales
  var arr = null, movio = false;                // arrastre en curso

  function centroBase() {                       // centro de la imagen sin transformar, en la pantalla
    return { x: lbImg.offsetLeft + lbImg.offsetWidth / 2, y: lbImg.offsetTop + lbImg.offsetHeight / 2 };
  }

  function limitar() {                          // la imagen no se despega de los bordes de la pantalla
    if (zs <= 1.001) { zs = 1; ztx = 0; zty = 0; return; }
    var c = centroBase(), W = lbImg.offsetWidth * zs, H = lbImg.offsetHeight * zs;
    var vw = overlay.clientWidth, vh = overlay.clientHeight;
    var ax = W / 2 - c.x, bx = vw - W / 2 - c.x, ay = H / 2 - c.y, by = vh - H / 2 - c.y;
    ztx = Math.min(Math.max(ztx, Math.min(ax, bx)), Math.max(ax, bx));
    zty = Math.min(Math.max(zty, Math.min(ay, by)), Math.max(ay, by));
  }

  function aplicar(transicion) {
    lbImg.style.transition = transicion;
    lbImg.style.transform = 'translate(' + ztx + 'px,' + zty + 'px) scale(' + zs + ')';
    lbImg.style.cursor = zs > 1 ? (arr ? 'grabbing' : 'grab') : '';
  }

  function resetZoom() {
    zs = 1; ztx = 0; zty = 0; arr = null;
    if (lbImg) { lbImg.style.transform = ''; lbImg.style.transition = ''; lbImg.style.cursor = ''; }
  }

  function initZoom() {
    overlay.addEventListener('wheel', function(e) {
      if (!overlay.classList.contains('active')) return;
      e.preventDefault();
      var d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
      var s2 = Math.min(ZOOM_MAX, Math.max(1, zs * Math.exp(-d * 0.0015)));
      if (s2 === zs) return;
      var c = centroBase();
      // el punto de la imagen que está bajo el puntero queda bajo el puntero
      var px = (e.clientX - c.x - ztx) / zs, py = (e.clientY - c.y - zty) / zs;
      ztx = e.clientX - c.x - s2 * px; zty = e.clientY - c.y - s2 * py;
      zs = s2; limitar(); aplicar('transform 0.12s ease-out');
    }, { passive: false });

    lbImg.addEventListener('mousedown', function(e) {
      if (e.button !== 0 || zs <= 1) return;
      e.preventDefault();
      arr = { x: e.clientX, y: e.clientY, tx: ztx, ty: zty }; movio = false;
      aplicar('none');
    });
    window.addEventListener('mousemove', function(e) {
      if (!arr) return;
      var dx = e.clientX - arr.x, dy = e.clientY - arr.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) movio = true;
      ztx = arr.tx + dx; zty = arr.ty + dy; limitar(); aplicar('none');
    });
    window.addEventListener('mouseup', function() {
      if (!arr) return;
      arr = null; aplicar('none');
      if (movio) setTimeout(function() { movio = false; }, 0);
    });
    // soltar el arrastre fuera de la imagen no cierra el visor
    overlay.addEventListener('click', function(e) {
      if (movio) { e.stopImmediatePropagation(); movio = false; }
    }, true);
    lbImg.addEventListener('dragstart', function(e) { e.preventDefault(); });
    window.addEventListener('resize', function() { if (zs > 1) { limitar(); aplicar('none'); } });
  }

  function updateNav() {
    prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
    nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
