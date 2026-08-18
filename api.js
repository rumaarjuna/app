const LS = {
  api: 'ruma_api_url', session: 'ruma_session', device: 'ruma_device_id', demo: 'ruma_demo', theme: 'ruma_theme', pin: 'ruma_pin_hash'
};

function randomId(prefix='REQ') {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Array.from(bytes, b=>b.toString(16).padStart(2,'0')).join('')}`;
}

function getDeviceId(){
  let id=localStorage.getItem(LS.device);
  if(!id){ id=randomId('DEV'); localStorage.setItem(LS.device,id); }
  return id;
}

export const LocalConfig = {
  get apiUrl(){ return (window.RUMA_CONFIG?.API_URL || localStorage.getItem(LS.api) || '').trim(); },
  set apiUrl(v){ localStorage.setItem(LS.api,(v||'').trim()); },
  get session(){ try{return JSON.parse(localStorage.getItem(LS.session)||'null');}catch{return null;} },
  set session(v){ if(v) localStorage.setItem(LS.session,JSON.stringify(v)); else localStorage.removeItem(LS.session); },
  get demo(){ return localStorage.getItem(LS.demo)==='1'; },
  set demo(v){ localStorage.setItem(LS.demo,v?'1':'0'); },
  get theme(){ return localStorage.getItem(LS.theme)||'system'; },
  set theme(v){ localStorage.setItem(LS.theme,v); },
  get pinHash(){ return localStorage.getItem(LS.pin)||''; },
  set pinHash(v){ if(v)localStorage.setItem(LS.pin,v); else localStorage.removeItem(LS.pin); },
  deviceId:getDeviceId
};

class Jsonp {
  static request(url, params={}, timeout=10000){
    return new Promise((resolve,reject)=>{
      const cb=`__ruma_cb_${Math.random().toString(36).slice(2)}`;
      const script=document.createElement('script');
      const q=new URLSearchParams({...params,callback:cb,_:Date.now().toString()});
      const timer=setTimeout(()=>cleanup(new Error('Timeout membaca respons server.')),timeout);
      const cleanup=(err,data)=>{
        clearTimeout(timer); delete window[cb]; script.remove();
        err?reject(err):resolve(data);
      };
      window[cb]=(data)=>cleanup(null,data);
      script.onerror=()=>cleanup(new Error('Tidak dapat membaca respons Apps Script.'));
      script.src=`${url}${url.includes('?')?'&':'?'}${q.toString()}`;
      document.head.appendChild(script);
    });
  }
}

export class ApiClient {
  constructor(){ this.timeout=18000; }
  get configured(){ return !!LocalConfig.apiUrl; }

  async public(action='system.publicConfig', payload={}){
    if(!this.configured) throw new Error('Apps Script URL belum diatur.');
    const result=await Jsonp.request(LocalConfig.apiUrl,{action},this.timeout);
    if(!result?.ok) throw new Error(result?.error||'Server menolak permintaan.');
    return result.data;
  }

  async call(action,payload={},opts={}){
    if(LocalConfig.demo) return window.__RUMA_DEMO__.call(action,payload);
    if(!this.configured) throw new Error('Apps Script URL belum diatur.');
    const requestId=randomId();
    const body={
      requestId, action, payload,
      sessionToken: opts.noSession ? '' : (LocalConfig.session?.token||''),
      deviceId:getDeviceId(),
      clientTime:new Date().toISOString()
    };
    try{
      await fetch(LocalConfig.apiUrl,{
        method:'POST',mode:'no-cors',cache:'no-store',redirect:'follow',
        headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(body)
      });
    }catch(err){
      throw new Error('Gagal mengirim data. Periksa koneksi internet dan endpoint Apps Script.');
    }
    const max=opts.polls||28;
    for(let i=0;i<max;i++){
      await new Promise(r=>setTimeout(r,i<3?220:420));
      try{
        const result=await Jsonp.request(LocalConfig.apiUrl,{action:'poll',requestId},5000);
        if(result?.pending) continue;
        if(!result?.ok) throw new Error(result?.error||'Operasi gagal.');
        return result.data;
      }catch(err){
        if(i===max-1) throw err;
      }
    }
    throw new Error('Server tidak memberikan respons tepat waktu.');
  }
}

export const api=new ApiClient();
