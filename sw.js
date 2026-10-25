/* © 2026 mdulac86. Tous droits réservés. */
/* Catalogue final : 407 illustrations WebP, 25 octobre 2026. */
/* Coherent, versioned shell. Dynamic prices remain network-first. */
importScripts('version.js');
const PRE = self.APP_TEST ? 'menu-test-' : 'menu-semaine-', C = PRE + self.APP_VERSION;
const IMAGES = PRE + 'photos-v1';
const FILES = ['./', 'index.html', 'style.css', 'design.css', 'version.js', 'recettes.js', 'prix-maxi.js', 'photos.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'qr-menu.png'];
const base = new URL('./', self.location.href);
const shell = new Set(FILES.map(f => new URL(f, base).href));
self.addEventListener('install', e => e.waitUntil((async()=>{
  const cache = await caches.open(C);
  await cache.addAll(FILES.map(f => new Request(new URL(f, base), {cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(k=>k.startsWith(PRE)&&k!==C&&k!==IMAGES).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
async function networkFirst(req){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),5000);
  try{
    const response=await fetch(req,{cache:'no-cache',signal:ctl.signal});
    if(response.ok){const cache=await caches.open(C);await cache.put(req,response.clone());return response;}
    return await caches.match(req,{ignoreSearch:true}) || response;
  }catch(e){return await caches.match(req,{ignoreSearch:true}) || new Response('Hors ligne',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  finally{clearTimeout(timer);}
}
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  if(url.pathname.startsWith(new URL('assets/recipes/',base).pathname)){
    e.respondWith((async()=>{const cache=await caches.open(IMAGES),hit=await cache.match(req,{ignoreSearch:true});if(hit)return hit;const r=await fetch(req);if(r.ok)await cache.put(req,r.clone());return r;})());return;
  }
  if(shell.has(url.origin+url.pathname)){
    e.respondWith((async()=>{const cache=await caches.open(C);return await cache.match(req,{ignoreSearch:true}) || (req.mode==='navigate' ? await cache.match(new URL('index.html',base)) : null) || await networkFirst(req);})());return;
  }
  if(req.mode==='navigate'){e.respondWith((async()=>{const r=await networkFirst(req);return r.status===503 ? await caches.match(new URL('index.html',base)) || r : r;})());return;}
  e.respondWith(networkFirst(req));
});
/* Explicit all-library download; failures are reported, never announced as complete. */
self.addEventListener('message',e=>{
  if(e.data?.type!=='CACHE_RECIPE_PHOTOS'||!Array.isArray(e.data.urls))return;
  e.waitUntil((async()=>{
    const cache=await caches.open(IMAGES),urls=[...new Set(e.data.urls)].filter(u=>new URL(u,base).href.startsWith(new URL('assets/recipes/',base).href));
    let done=0,failed=0,next=0;
    await Promise.all(Array.from({length:4},async()=>{while(next<urls.length){const url=new URL(urls[next++],base);try{if(!await cache.match(url)){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(url,{signal:ctl.signal});if(!r.ok)throw Error(r.status);await cache.put(url,r);}finally{clearTimeout(timer);}}done++;}catch(err){failed++;}e.source?.postMessage({type:'PHOTO_CACHE_PROGRESS',done,failed,total:urls.length});}}));
    e.source?.postMessage({type:'PHOTO_CACHE_DONE',done,failed,total:urls.length});
  })());
});
