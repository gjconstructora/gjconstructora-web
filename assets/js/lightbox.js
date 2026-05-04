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

    document.querySelectorAll('.gallery .img-wrapper img, .gallery-grid .img-wrapper img').forEach(function(img) {
      img.addEventListener('click', function() {
        images = Array.from(img.closest('.gallery-grid, .gallery').querySelectorAll('.img-wrapper img'));
        currentIndex = images.indexOf(img);
        open(img.src);
      });
    });
  }

  function open(src) {
    lbImg.src = src;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateNav();
  }

  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigate(dir) {
    currentIndex += dir;
    if (currentIndex < 0) currentIndex = images.length - 1;
    if (currentIndex >= images.length) currentIndex = 0;
    lbImg.src = images[currentIndex].src;
    updateNav();
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
