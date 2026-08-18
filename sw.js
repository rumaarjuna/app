const VERSION='ruma-shell-v1.0.0';
const ASSETS=['./','./index.html','./styles.css','./config.js','./app.js','./api.js','./store.js','./demo.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET') return;
  if(u.origin!==self.location.origin) return;
  e.respondWith(caches.match(e.request).then(cached=>{
    const network=fetch(e.request).then(r=>{if(r.ok){const clone=r.clone();caches.open(VERSION).then(c=>c.put(e.request,clone));}return r;}).catch(()=>cached);
    return cached||network;
  }));
});
