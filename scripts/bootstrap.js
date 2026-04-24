// Bootstrap
// First-paint viewport sizing and service worker registration.

// Seed the real viewport height before first paint so iOS standalone
// does not start from a too-short 100dvh fallback and then stretch.
(function(){
  var h = window.innerHeight || document.documentElement.clientHeight;
  if(h > 0) document.documentElement.style.setProperty('--app-vh', h + 'px');
  document.documentElement.style.background = '#0d1117';
})();

// Register the service worker after the app shell is available.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js').catch(function() {});
  });
}
