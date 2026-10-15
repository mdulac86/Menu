const C='menu-semaine-v19';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','icon-192.png','apple-touch-icon.png'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(new Request(e.request.url,{cache:'no-cache',credentials:'same-origin'})).then(r=>{if(r.ok){const k=r.clone();caches.open(C).then(c=>c.put(e.request,k))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
