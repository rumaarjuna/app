const CACHE='ruma-pwa-v2.16.1';
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
  if(req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/config.js')||url.pathname.endsWith('/')){
    const network=fetch(req,{cache:'no-store'}).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone()));return r});
    const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('network-first-timeout')),NETWORK_FIRST_TIMEOUT));
    e.respondWith(Promise.race([network,timeout]).catch(()=>caches.match(req).then(x=>x||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(cached=>{
    const network=fetch(req).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone()));return r}).catch(()=>cached);
    return cached||network;
  }));
});

// FCM/web push memakai service worker RUMA yang sama; aplikasi tidak perlu sedang terbuka.
self.addEventListener('push',event=>{
  let payload={};try{payload=event.data?event.data.json():{}}catch(e){payload={notification:{title:'RUMA',body:event.data?event.data.text():'Ada informasi baru.'}}}
  const n=payload.notification||{},d=payload.data||{},title=n.title||'RUMA',body=n.body||'Ada informasi penting dari RUMA.',score=Number(d.score||0),priority=String(d.priority||'').toUpperCase(),urgent=score>=85||priority==='URGENT',important=!urgent&&(score>=65||priority==='HIGH');
  const actions=[];if(d.actionType==='COMPLETE_TASK')actions.push({action:'COMPLETE_TASK',title:'Selesai'});if(d.actionType==='PAY_BILL')actions.push({action:'PAY_BILL',title:'Sudah Dibayar'});if(d.actionType==='SNOOZE')actions.push({action:'SNOOZE',title:'Tunda'});actions.push({action:'OPEN',title:'Buka'});
  const options={body,icon:'./icon-192.png',badge:'./icon-192.png',tag:d.notificationId||undefined,renotify:urgent,requireInteraction:urgent,silent:false,data:d,actions:actions.slice(0,2),vibrate:urgent?[300,150,300,150,500]:(important?[200,100,200]:[120])};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();const data=event.notification.data||{},action=event.action||'OPEN',url='./?notification='+encodeURIComponent(data.notificationId||'')+'&action='+encodeURIComponent(action);
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus'in c){c.postMessage({type:'RUMA_NOTIFICATION_ACTION',notificationId:data.notificationId||'',action});return c.focus()}}return clients.openWindow(url)}));
});
