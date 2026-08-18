const DB_NAME='ruma-cache-v1', DB_VER=1;
let dbPromise;
function db(){
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VER);
    req.onupgradeneeded=()=>{
      const d=req.result;
      if(!d.objectStoreNames.contains('kv')) d.createObjectStore('kv',{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
  return dbPromise;
}
export const CacheStore={
  async get(key){const d=await db();return new Promise((res,rej)=>{const r=d.transaction('kv').objectStore('kv').get(key);r.onsuccess=()=>res(r.result?.value??null);r.onerror=()=>rej(r.error);});},
  async set(key,value){const d=await db();return new Promise((res,rej)=>{const r=d.transaction('kv','readwrite').objectStore('kv').put({key,value,ts:Date.now()});r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error);});},
  async del(key){const d=await db();return new Promise((res,rej)=>{const r=d.transaction('kv','readwrite').objectStore('kv').delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});},
  async clear(){const d=await db();return new Promise((res,rej)=>{const r=d.transaction('kv','readwrite').objectStore('kv').clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
};
