/*
  GJ Constructora — Tracking Scripts
  INSTRUCCIONES:
  1. Reemplazá G-XXXXXXXXXX con tu ID de Google Analytics
  2. Reemplazá XXXXXXXXXXXXXXX con tu ID de Meta Pixel
  3. Una vez que tengas los IDs, agregá este script en el <head> de todas las páginas
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

// === META PIXEL (Facebook/Instagram) ===
// Descomenta las siguientes líneas cuando tengas tu ID:
/*
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'XXXXXXXXXXXXXXX');
fbq('track', 'PageView');
*/
