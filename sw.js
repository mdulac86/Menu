/* Service worker : réseau d'abord (toujours la dernière version en ligne), cache en secours (hors ligne). */
importScripts('version.js');
const PRE = self.APP_TEST ? 'menu-test-' : 'menu-semaine-', C = PRE + self.APP_VERSION;
const FILES = ['./', 'index.html', 'style.css', 'version.js', 'recettes.js', 'prix-maxi.js', 'js/base.js', 'js/plats.js', 'js/semaine.js', 'js/liste-prix.js', 'js/generation.js', 'js/epiceries.js', 'js/ecrans.js', 'js/profil.js', 'js/app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'qr-menu.png'];

self.addEventListener('install', e => {
  /* cache:'reload' : on contourne le cache HTTP pour ne pas mélanger d'anciens fichiers avec les nouveaux */
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PRE) && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);   /* réseau lent : on bascule sur le cache après 8 s */
    try{
      const r = await fetch(req.url, {cache: 'no-cache', credentials: 'same-origin', signal: ctl.signal});
      clearTimeout(t);
      if(r.ok){ const k = r.clone(); caches.open(C).then(c => c.put(req, k)).catch(() => {}); return r; }
      /* erreur du serveur (404, 500… pendant une mise en ligne) : la copie gardée vaut mieux qu'une page cassée */
      return (await caches.match(req, {ignoreSearch: true})) || r;
    }catch(err){
      clearTimeout(t);
      const hit = await caches.match(req, {ignoreSearch: true});
      if(hit) return hit;
      if(req.mode === 'navigate'){ const home = await caches.match(self.APP_TEST ? 'test.html' : 'index.html') || await caches.match('./'); if(home) return home; }
      return new Response('Hors ligne', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
    }
  })());
});
