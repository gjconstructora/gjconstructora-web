/*
  GJ Constructora — Medición

  Google Analytics 4 + píxel de Meta. Este archivo se carga en las 26 páginas.

  Del sitio interesan dos cosas: quién mira la unidad en venta y quién toca
  WhatsApp, que es por donde entra la consulta. Todo lo demás es tráfico.
*/

// === GOOGLE ANALYTICS 4 ===
(function(){
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-CJ24S44XJC';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-CJ24S44XJC');
})();

// === PÍXEL DE META (Facebook / Instagram) ===
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1062947359713024');
fbq('track', 'PageView');

// === EVENTOS PROPIOS ===
(function(){
  var ruta = location.pathname;

  // Ver la unidad en venta. Es el público de remarketing más caliente del
  // sitio: entró a la ficha del dúplex y no escribió.
  if (ruta.indexOf('duplex-ecuador-411-cipolletti') > -1) {
    fbq('track', 'ViewContent', {
      content_name: 'Duplex Ecuador 411 - Cipolletti',
      content_category: 'Unidad en venta',
      content_type: 'product'
    });
    gtag('event', 'ver_unidad', { unidad: 'duplex_ecuador_411' });
  }

  // Clic en WhatsApp o en el teléfono: es la conversión real del sitio.
  // Va en captura para que se registre aunque el enlace abra otra pestaña.
  document.addEventListener('click', function (ev) {
    var el = ev.target;
    var a = el && el.closest ? el.closest('a[href]') : null;
    if (!a) return;

    var href = a.getAttribute('href') || '';
    var canal = href.indexOf('wa.me') > -1 ? 'whatsapp'
              : href.indexOf('tel:') === 0 ? 'telefono'
              : null;
    if (!canal) return;

    if (typeof fbq === 'function') {
      fbq('track', 'Contact', { content_category: canal, content_name: ruta });
    }
    if (typeof gtag === 'function') {
      gtag('event', 'contacto', { metodo: canal, pagina: ruta });
    }
  }, true);
})();
