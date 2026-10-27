const CACHE_NAME='tokyo-journal-shell-v2';
const FILES=['./','./index.html','./style.css','./app.js','./data.js','./manifest.webmanifest','./assets/icon.svg','./assets/tokyo-hero.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET' || new URL(req.url).origin !== self.location.origin)return;
  event.respondWith(fetch(req).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));}return resp;}).catch(()=>caches.match(req)));
});
