const CACHE='ruma-pwa-v2.11.2';
const STATIC=['./','./index.html','./config.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const NETWORK_FIRST_TIMEOUT=2600;
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ruma-')&&k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
]))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin)return;
  // HTML & config: network-first, tetapi jangan biarkan koneksi lambat menahan pembukaan PWA.
  if(req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/config.js')||url.pathname.endsWith('/')){
    const network=fetch(req,{cache:'no-store'}).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone()));return r});
    const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('network-first-timeout')),NETWORK_FIRST_TIMEOUT));
    e.respondWith(Promise.race([network,timeout]).catch(()=>caches.match(req).then(x=>x||caches.match('./index.html'))));
    return;
  }
  // Static assets: cache-first + quiet refresh.
  e.respondWith(caches.match(req).then(cached=>{
    const network=fetch(req).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone()));return r}).catch(()=>cached);
    return cached||network;
  }));
});
