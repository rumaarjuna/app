import './demo.js';
import {api,LocalConfig} from './api.js';
import {CacheStore} from './store.js';

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const APP_VERSION=window.RUMA_CONFIG?.APP_VERSION||'1.0.0';
const state={route:'today',moneyTab:'overview',planTab:'tasks',moreTab:'household',user:null,publicConfig:null,data:{},chat:[],loading:false};
const cacheKey=(k)=>`ruma:${LocalConfig.session?.user?.id||'demo'}:${k}`;
const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const currency=(v)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v||0));
const dateFmt=(v)=>v?new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v.length===10?`${v}T00:00:00`:v)):'—';
const timeFmt=(v)=>v?new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'—';
const today=()=>new Date().toISOString().slice(0,10), monthNow=()=>today().slice(0,7);

function toast(message,type='success'){
  const el=document.createElement('div');el.className=`toast ${type}`;el.innerHTML=`<div>${type==='error'?'⚠️':'✓'}</div><div>${esc(message)}</div>`;
  $('#toast-root').appendChild(el);setTimeout(()=>el.remove(),3800);
}
function applyTheme(){
  const t=LocalConfig.theme; const dark=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme=dark?'dark':'light';
}
function setLoading(v){state.loading=v;document.body.style.cursor=v?'progress':'';}
function initials(name='R'){return name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();}
function accountName(id){return state.data.accounts?.find(x=>x.id===id)?.name||'—';}
function userName(id){return state.data.users?.find(x=>x.id===id)?.name||'Bersama';}
function category(id){return state.data.categories?.find(x=>x.id===id)||{name:'Lainnya',icon:'🧾'};}

async function cached(action,key,payload={}){
  const ck=cacheKey(key); const old=await CacheStore.get(ck); if(old!==null) state.data[key]=old;
  try{const fresh=await api.call(action,payload);state.data[key]=fresh;await CacheStore.set(ck,fresh);return fresh;}catch(e){if(old!==null){toast(`Mode cache: ${e.message}`,'error');return old;}throw e;}
}
async function refreshCore(){
  const jobs=[
    cached('users.list','users'),cached('accounts.list','accounts'),cached('categories.list','categories'),
    cached('transactions.list','transactions'),cached('budgets.list','budgets'),cached('bills.list','bills'),
    cached('goals.list','goals'),cached('tasks.list','tasks'),cached('events.list','events'),
    cached('shopping.list','shopping'),cached('notes.list','notes')
  ];
  await Promise.all(jobs);
}
async function refreshDashboard(){
  const d=await cached('dashboard.get','dashboard'); state.data.dashboard=d; if(d?.user)state.user=d.user; return d;
}

function shell(content,{fab=true}={}){
  const user=state.user||LocalConfig.session?.user||{name:'RUMA'};
  return `<header class="topbar"><div class="brand"><div class="brand-mark">R</div><div><strong>RUMA</strong><small>${esc(state.publicConfig?.householdName||'Personal & Household')}</small></div></div><button class="avatar" data-action="profile">${esc(initials(user.name))}</button></header>
  <main class="main">${content}</main>
  ${fab?'<button class="fab" data-action="quick-add" aria-label="Tambah">+</button>':''}
  <nav class="bottom-nav">
    ${nav('today','🏠','Today')}${nav('money','💰','Money')}${nav('ai','✨','AI','ai-nav')}${nav('plan','📅','Plan')}${nav('more','☰','More')}
  </nav>`;
}
function nav(route,icon,label,extra=''){return `<button class="nav-btn ${state.route===route?'active':''} ${extra}" data-route="${route}"><span>${icon}</span><span>${label}</span></button>`;}
function head(title,sub='',action=''){return `<div class="page-head"><div><h1>${esc(title)}</h1>${sub?`<p>${esc(sub)}</p>`:''}</div>${action}</div>`;}
function empty(text){return `<div class="empty">${esc(text)}</div>`;}

async function render(){
  const app=$('#app');
  if(state.route==='today') app.innerHTML=shell(renderToday());
  if(state.route==='money') app.innerHTML=shell(renderMoney());
  if(state.route==='ai') app.innerHTML=shell(renderAI(),{fab:false});
  if(state.route==='plan') app.innerHTML=shell(renderPlan());
  if(state.route==='more') app.innerHTML=shell(renderMore());
}

function renderToday(){
  const d=state.data.dashboard||{};
  const events=d.todayEvents||[],tasks=d.todayTasks||[],bills=d.upcomingBills||[];
  return `${head(`Halo, ${state.user?.name||'Dulur'} 👋`,new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long'}).format(new Date()))}
    <section class="card ai-card"><span class="ai-badge">✨ RUMA AI</span><h2>Ringkasan hari ini</h2><p>${esc(d.insight||'Data sedang disiapkan. Tambahkan transaksi dan agenda agar insight semakin relevan.')}</p><div style="margin-top:12px"><button class="btn btn-primary btn-sm" data-route="ai">Tanya RUMA</button></div></section>
    <div class="grid grid-3" style="margin-top:14px">
      <section class="card"><div class="kpi-label">Saldo saya</div><div class="big">${currency(d.ownBalance)}</div><div class="kpi-delta muted">Rekening yang boleh saya lihat</div></section>
      <section class="card"><div class="kpi-label">Saldo bersama</div><div class="big">${currency(d.jointBalance)}</div><div class="kpi-delta muted">Rekening household</div></section>
      <section class="card"><div class="kpi-label">Pengeluaran bulan ini</div><div class="big">${currency(d.expense)}</div><div class="kpi-delta ${Number(d.income||0)>=Number(d.expense||0)?'positive':'warning'}">Pemasukan ${currency(d.income)}</div></section>
    </div>
    <div class="grid grid-2" style="margin-top:14px">
      <section class="card"><h3>📅 Agenda hari ini</h3><div class="list">${events.length?events.slice(0,4).map(e=>`<div class="list-item"><div class="item-icon">🗓️</div><div class="item-main"><strong>${esc(e.title)}</strong><small>${esc((e.start_at||'').slice(11,16)||'Sepanjang hari')}</small></div></div>`).join(''):empty('Belum ada agenda hari ini.')}</div></section>
      <section class="card"><h3>✅ Task hari ini</h3><div class="list">${tasks.length?tasks.slice(0,4).map(t=>`<div class="list-item"><div class="item-icon">${t.priority==='HIGH'?'🔥':'✓'}</div><div class="item-main"><strong>${esc(t.title)}</strong><small>${esc(userName(t.assigned_to))}</small></div><button class="btn btn-sm" data-toggle-task="${t.id}">Selesai</button></div>`).join(''):empty('Task hari ini sudah beres.')}</div></section>
    </div>
    <section class="card" style="margin-top:14px"><h3>🔔 Tagihan terdekat</h3><div class="list">${bills.length?bills.map(b=>`<div class="list-item"><div class="item-icon">🧾</div><div class="item-main"><strong>${esc(b.name)}</strong><small>${dateFmt(b.due_date)}</small></div><div class="item-end"><strong>${currency(b.amount)}</strong><small>${esc(accountName(b.account_id))}</small></div></div>`).join(''):empty('Tidak ada tagihan dekat.')}</div></section>`;
}

function moneyTabs(){return `<div class="tabs">${['overview','transactions','accounts','budget','bills','goals'].map(x=>`<button class="tab ${state.moneyTab===x?'active':''}" data-money-tab="${x}">${({overview:'Ringkasan',transactions:'Transaksi',accounts:'Rekening',budget:'Budget',bills:'Tagihan',goals:'Goals'})[x]}</button>`).join('')}</div>`;}
function renderMoney(){
  let body='';
  if(state.moneyTab==='overview') body=moneyOverview();
  if(state.moneyTab==='transactions') body=transactionsView();
  if(state.moneyTab==='accounts') body=accountsView();
  if(state.moneyTab==='budget') body=budgetView();
  if(state.moneyTab==='bills') body=billsView();
  if(state.moneyTab==='goals') body=goalsView();
  return `${head('Money','Keuangan pribadi dan rumah tangga')}${moneyTabs()}${body}`;
}
function moneyOverview(){
  const tx=state.data.transactions||[],m=monthNow();
  const exp=tx.filter(x=>x.type==='EXPENSE'&&(x.date||'').slice(0,7)===m).reduce((a,b)=>a+Number(b.amount||0),0);
  const inc=tx.filter(x=>x.type==='INCOME'&&(x.date||'').slice(0,7)===m).reduce((a,b)=>a+Number(b.amount||0),0);
  const accounts=state.data.accounts||[];
  return `<div class="grid grid-3"><section class="card"><div class="kpi-label">Pemasukan</div><div class="big positive">${currency(inc)}</div></section><section class="card"><div class="kpi-label">Pengeluaran</div><div class="big">${currency(exp)}</div></section><section class="card"><div class="kpi-label">Cashflow</div><div class="big ${inc-exp>=0?'positive':'negative'}">${currency(inc-exp)}</div></section></div>
  <section class="card" style="margin-top:14px"><div class="page-head"><div><h3>Rekening & Wallet</h3></div><button class="btn btn-sm" data-money-tab="accounts">Kelola</button></div><div class="list">${accounts.length?accounts.slice(0,5).map(a=>accountItem(a)).join(''):empty('Belum ada rekening.')}</div></section>`;
}
function accountItem(a){return `<div class="list-item"><div class="item-icon">${a.type==='EWALLET'?'📱':a.type==='CASH'?'💵':'🏦'}</div><div class="item-main"><strong>${esc(a.name)}</strong><small>${a.scope==='JOINT'?'Bersama':esc(userName(a.owner_user_id))} · ${esc(a.visibility||'PRIVATE')}</small></div><div class="item-end">${a.balance===null||a.balance===undefined?'<strong>Privat</strong>':`<strong>${currency(a.balance)}</strong>`}<small>${esc(a.type||'BANK')}</small></div></div>`;}
function transactionsView(){
  const arr=[...(state.data.transactions||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary" data-add="transaction">+ Transaksi</button></div><section class="card"><div class="list">${arr.length?arr.map(t=>{const c=category(t.category_id);return `<div class="list-item"><div class="item-icon">${esc(c.icon||'🧾')}</div><div class="item-main"><strong>${esc(t.description||c.name)}</strong><small>${dateFmt(t.date)} · ${esc(accountName(t.account_id))}${t.type==='TRANSFER'?` → ${esc(accountName(t.to_account_id))}`:''}</small></div><div class="item-end"><strong class="${t.type==='INCOME'?'positive':t.type==='EXPENSE'?'':'muted'}">${t.type==='INCOME'?'+':t.type==='EXPENSE'?'-':'↔ '}${currency(t.amount)}</strong><button class="btn btn-sm" data-edit="transaction" data-id="${t.id}">Edit</button></div></div>`}).join(''):empty('Belum ada transaksi.')}</div></section>`;
}
function accountsView(){const arr=state.data.accounts||[];return `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary" data-add="account">+ Rekening / Wallet</button></div><div class="grid grid-2">${arr.length?arr.map(a=>`<section class="card"><div class="page-head"><div><div class="kpi-label">${esc(a.scope==='JOINT'?'BERSAMA':userName(a.owner_user_id))}</div><h3>${esc(a.name)}</h3></div><button class="btn btn-sm" data-edit="account" data-id="${a.id}">Edit</button></div><div class="big">${a.balance===null||a.balance===undefined?'Privat':currency(a.balance)}</div><p class="muted">${esc(a.type||'BANK')} · <span class="privacy">${esc(a.visibility||'PRIVATE')}</span></p></section>`).join(''):empty('Belum ada rekening.')}</div>`;}
function budgetView(){
  const arr=state.data.budgets||[], tx=state.data.transactions||[], m=monthNow();
  return `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary" data-add="budget">+ Budget</button></div><div class="grid grid-2">${arr.length?arr.map(b=>{const c=category(b.category_id);const used=tx.filter(t=>t.type==='EXPENSE'&&t.category_id===b.category_id&&(t.date||'').slice(0,7)===(b.month||m)).reduce((a,x)=>a+Number(x.amount||0),0);const pct=Math.min(100,Math.round(used/Math.max(1,Number(b.limit_amount))*100));return `<section class="card"><div class="page-head"><div><h3>${esc(c.icon)} ${esc(c.name)}</h3><p>${esc(b.scope||'JOINT')} · ${esc(b.month||m)}</p></div><button class="btn btn-sm" data-edit="budget" data-id="${b.id}">Edit</button></div><div class="big">${currency(used)} <span class="muted" style="font-size:13px">/ ${currency(b.limit_amount)}</span></div><div class="progress" style="margin-top:12px"><i style="width:${pct}%"></i></div><div class="kpi-delta ${pct>=90?'negative':pct>=75?'warning':'positive'}">${pct}% terpakai</div></section>`}).join(''):empty('Belum ada budget.')}</div>`;
}
function billsView(){const arr=state.data.bills||[];return `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary" data-add="bill">+ Tagihan</button></div><section class="card"><div class="list">${arr.length?arr.map(b=>`<div class="list-item"><div class="item-icon">🧾</div><div class="item-main"><strong>${esc(b.name)}</strong><small>${dateFmt(b.due_date)} · ${esc(b.recurring||'ONE_TIME')} · ${esc(b.status_bill||'UPCOMING')}</small></div><div class="item-end"><strong>${currency(b.amount)}</strong><button class="btn btn-sm" data-edit="bill" data-id="${b.id}">Edit</button></div></div>`).join(''):empty('Belum ada tagihan.')}</div></section>`;}
function goalsView(){const arr=state.data.goals||[];return `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary" data-add="goal">+ Goal</button></div><div class="grid grid-2">${arr.length?arr.map(g=>{const pct=Math.min(100,Math.round(Number(g.current_amount||0)/Math.max(1,Number(g.target_amount||0))*100));return `<section class="card"><div class="page-head"><div><h3>🎯 ${esc(g.name)}</h3><p>Target ${dateFmt(g.target_date)}</p></div><button class="btn btn-sm" data-edit="goal" data-id="${g.id}">Edit</button></div><div class="big">${currency(g.current_amount)}</div><p class="muted">dari ${currency(g.target_amount)}</p><div class="progress"><i style="width:${pct}%"></i></div><div class="kpi-delta positive">${pct}% tercapai</div></section>`}).join(''):empty('Belum ada goal.')}</div>`;}

function renderAI(){
  const msgs=state.chat.length?state.chat:[{role:'ai',text:'Halo 👋 Saya RUMA AI. Saya dapat membaca data yang diizinkan untuk akunmu dan memberi feedback keuangan, agenda, tagihan, serta pekerjaan rumah. Data rekening privat pasangan tidak akan saya gunakan.'}];
  return `${head('RUMA AI','Feedback berbasis data rumah tangga')}
    <div class="chip-row"><button class="chip" data-ai-prompt="Analisis keuangan bulan ini dan beri 3 prioritas.">💰 Analisis keuangan</button><button class="chip" data-ai-prompt="Apa yang harus saya perhatikan besok?">📅 Persiapkan besok</button><button class="chip" data-ai-feedback>✨ Review otomatis</button></div>
    <div class="chat-wrap"><div class="chat-messages">${msgs.map(m=>`<div class="bubble ${m.role==='user'?'user':'ai'}">${esc(m.text)}</div>`).join('')}</div></div>
    <form class="chat-input" id="chat-form"><input id="chat-message" autocomplete="off" placeholder="Tanya RUMA..."><button class="btn btn-primary" type="submit">Kirim</button></form>`;
}

function planTabs(){return `<div class="tabs"><button class="tab ${state.planTab==='tasks'?'active':''}" data-plan-tab="tasks">Tasks</button><button class="tab ${state.planTab==='events'?'active':''}" data-plan-tab="events">Calendar</button></div>`;}
function renderPlan(){return `${head('Plan','Agenda, task, dan reminder')}${planTabs()}${state.planTab==='tasks'?tasksView():eventsView()}`;}
function tasksView(){const arr=state.data.tasks||[];return `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary" data-add="task">+ Task</button></div><section class="card"><div class="list">${arr.length?arr.map(t=>`<div class="list-item" style="opacity:${t.done?'.58':'1'}"><button class="icon-btn" data-toggle-task="${t.id}">${t.done?'✓':'○'}</button><div class="item-main"><strong>${esc(t.title)}</strong><small>${dateFmt(t.due_date)} · ${esc(userName(t.assigned_to))} · ${esc(t.priority||'NORMAL')}</small></div><button class="btn btn-sm" data-edit="task" data-id="${t.id}">Edit</button></div>`).join(''):empty('Belum ada task.')}</div></section>`;}
function eventsView(){const arr=[...(state.data.events||[])].sort((a,b)=>(a.start_at||'').localeCompare(b.start_at||''));return `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary" data-add="event">+ Agenda</button></div><section class="card"><div class="list">${arr.length?arr.map(e=>`<div class="list-item"><div class="item-icon">📅</div><div class="item-main"><strong>${esc(e.title)}</strong><small>${dateFmt((e.start_at||'').slice(0,10))} · ${(e.start_at||'').slice(11,16)||'All day'} · ${esc(userName(e.assigned_to))}</small></div><button class="btn btn-sm" data-edit="event" data-id="${e.id}">Edit</button></div>`).join(''):empty('Belum ada agenda.')}</div></section>`;}

function moreTabs(){return `<div class="tabs"><button class="tab ${state.moreTab==='household'?'active':''}" data-more-tab="household">Household</button><button class="tab ${state.moreTab==='notes'?'active':''}" data-more-tab="notes">Notes</button><button class="tab ${state.moreTab==='settings'?'active':''}" data-more-tab="settings">Settings</button></div>`;}
function renderMore(){let b=state.moreTab==='household'?householdView():state.moreTab==='notes'?notesView():settingsView();return `${head('More','Rumah tangga dan pengaturan')}${moreTabs()}${b}`;}
function householdView(){
  const users=state.data.users||[],shop=state.data.shopping||[];
  return `<div class="grid grid-2"><section class="card"><div class="page-head"><div><h3>👥 Anggota Household</h3></div><button class="btn btn-sm" data-add="user">Kelola</button></div><div class="list">${users.map(u=>`<div class="list-item"><div class="avatar">${esc(initials(u.name))}</div><div class="item-main"><strong>${esc(u.name)}</strong><small>${esc(u.role)} · ${esc(u.email)}</small></div></div>`).join('')}</div></section>
  <section class="card"><div class="page-head"><div><h3>🛒 Shopping List</h3></div><button class="btn btn-sm" data-add="shopping">+ Item</button></div><div class="list">${shop.length?shop.map(s=>`<div class="list-item" style="opacity:${s.done?'.58':'1'}"><button class="icon-btn" data-toggle-shopping="${s.id}">${s.done?'✓':'○'}</button><div class="item-main"><strong>${esc(s.item)}</strong><small>${esc(s.qty||'')} · ${esc(userName(s.assigned_to))}</small></div><button class="btn btn-sm" data-edit="shopping" data-id="${s.id}">Edit</button></div>`).join(''):empty('Daftar belanja kosong.')}</div></section></div>`;
}
function notesView(){const arr=state.data.notes||[];return `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-primary" data-add="note">+ Catatan</button></div><div class="grid grid-2">${arr.length?arr.map(n=>`<section class="card"><div class="page-head"><div><h3>${esc(n.title)}</h3><p>${esc(n.scope||'PERSONAL')}</p></div><button class="btn btn-sm" data-edit="note" data-id="${n.id}">Edit</button></div><p style="white-space:pre-wrap">${esc(n.body)}</p></section>`).join(''):empty('Belum ada catatan.')}</div>`;}
function settingsView(){
  const s=LocalConfig.session;return `<div class="grid grid-2"><section class="card"><h3>🎨 Tampilan</h3><div class="field"><label>Tema</label><select class="select" id="theme-select"><option value="system" ${LocalConfig.theme==='system'?'selected':''}>Ikuti perangkat</option><option value="light" ${LocalConfig.theme==='light'?'selected':''}>Light</option><option value="dark" ${LocalConfig.theme==='dark'?'selected':''}>Dark</option></select></div></section>
  <section class="card"><h3>🔐 Sesi & App Lock</h3><p class="muted">${LocalConfig.demo?'Mode demo lokal':esc(s?.user?.email||'')}</p><div class="chip-row"><button class="btn" data-action="pin-settings">${LocalConfig.pinHash?'Ubah / hapus PIN':'Aktifkan PIN perangkat'}</button><button class="btn btn-danger" data-action="logout">Keluar</button></div></section>
  <section class="card"><h3>🤖 AI</h3><p class="muted">Gemini sebagai default. Groq dapat diaktifkan dari konfigurasi backend.</p><button class="btn" data-action="ai-settings">Pengaturan AI</button></section>
  <section class="card"><h3>⚙️ Sistem</h3><p class="muted">RUMA ${esc(APP_VERSION)} · PWA cache + IndexedDB</p><div class="chip-row"><button class="btn btn-sm" data-action="health">Cek koneksi</button><button class="btn btn-sm" data-action="clear-cache">Bersihkan cache</button><button class="btn btn-sm" data-action="backup">Backup sekarang</button></div></section></div>`;
}

function options(arr,value,label='name'){return (arr||[]).map(x=>`<option value="${esc(x.id)}" ${String(x.id)===String(value)?'selected':''}>${esc(x[label]||x.name||x.id)}</option>`).join('');}
function modal(title,body,actions=''){const root=$('#modal-root');root.innerHTML=`<div class="modal-backdrop" data-close-backdrop><div class="modal"><div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close-modal>✕</button></div><div class="modal-body">${body}${actions}</div></div></div>`;}
function closeModal(){$('#modal-root').innerHTML='';}
function commonActions(type,id){return `<div class="modal-actions">${id?`<button type="button" class="btn btn-danger" data-delete="${type}" data-id="${id}">Hapus</button>`:''}<button type="button" class="btn" data-close-modal>Batal</button><button type="submit" class="btn btn-primary">Simpan</button></div>`;}
function findEntity(type,id){const map={account:'accounts',transaction:'transactions',budget:'budgets',bill:'bills',goal:'goals',task:'tasks',event:'events',shopping:'shopping',note:'notes',user:'users'};return (state.data[map[type]]||[]).find(x=>x.id===id)||{};}
function openForm(type,row={}){
  const users=state.data.users||[],accounts=state.data.accounts||[],usableAccounts=accounts.filter(a=>a.balance!==null&&a.balance!==undefined),cats=state.data.categories||[];let fields='';
  if(type==='account') fields=`<div class="form-row"><div class="field"><label>Nama rekening/wallet</label><input class="input" name="name" required value="${esc(row.name||'')}"></div><div class="field"><label>Jenis</label><select class="select" name="type">${['BANK','EWALLET','CASH','SAVING','CREDIT_CARD','INVESTMENT','OTHER'].map(x=>`<option ${row.type===x?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="form-row"><div class="field"><label>Scope</label><select class="select" name="scope"><option value="PERSONAL" ${row.scope!=='JOINT'?'selected':''}>Personal</option><option value="JOINT" ${row.scope==='JOINT'?'selected':''}>Bersama</option></select></div><div class="field"><label>Pemilik</label><select class="select" name="owner_user_id"><option value="">Household/Bersama</option>${options(users,row.owner_user_id)}</select></div></div><div class="form-row"><div class="field"><label>Saldo awal</label><input class="input" type="number" min="0" step="1" name="initial_balance" value="${Number(row.initial_balance||0)}"></div><div class="field"><label>Privasi</label><select class="select" name="visibility">${['PRIVATE','SUMMARY','SHARED'].map(x=>`<option ${row.visibility===x?'selected':''}>${x}</option>`).join('')}</select></div></div>`;
  if(type==='transaction') fields=`<div class="form-row"><div class="field"><label>Jenis</label><select class="select" name="type" id="tx-type">${['EXPENSE','INCOME','TRANSFER'].map(x=>`<option ${row.type===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Tanggal</label><input class="input" type="date" name="date" required value="${esc(row.date||today())}"></div></div><div class="field"><label>Deskripsi</label><input class="input" name="description" required value="${esc(row.description||'')}"></div><div class="form-row"><div class="field"><label>Nominal</label><input class="input" type="number" min="0" step="1" name="amount" required value="${Number(row.amount||0)}"></div><div class="field"><label>Kategori</label><select class="select" name="category_id"><option value="">—</option>${options(cats,row.category_id)}</select></div></div><div class="form-row"><div class="field"><label>Dari / Rekening</label><select class="select" name="account_id" required>${options(usableAccounts,row.account_id)}</select></div><div class="field"><label>Ke rekening (transfer)</label><select class="select" name="to_account_id"><option value="">—</option>${options(usableAccounts,row.to_account_id)}</select></div></div><div class="field"><label>Scope transaksi</label><select class="select" name="scope"><option ${row.scope==='PERSONAL'?'selected':''}>PERSONAL</option><option ${row.scope!=='PERSONAL'?'selected':''}>JOINT</option></select></div>`;
  if(type==='budget') fields=`<div class="form-row"><div class="field"><label>Bulan</label><input class="input" type="month" name="month" value="${esc(row.month||monthNow())}"></div><div class="field"><label>Kategori</label><select class="select" name="category_id" required>${options(cats.filter(c=>c.type!=='INCOME'),row.category_id)}</select></div></div><div class="field"><label>Batas budget</label><input class="input" type="number" min="0" name="limit_amount" required value="${Number(row.limit_amount||0)}"></div><div class="field"><label>Scope</label><select class="select" name="scope"><option ${row.scope==='PERSONAL'?'selected':''}>PERSONAL</option><option ${row.scope!=='PERSONAL'?'selected':''}>JOINT</option></select></div>`;
  if(type==='bill') fields=`<div class="field"><label>Nama tagihan</label><input class="input" name="name" required value="${esc(row.name||'')}"></div><div class="form-row"><div class="field"><label>Jatuh tempo</label><input class="input" type="date" name="due_date" required value="${esc(row.due_date||today())}"></div><div class="field"><label>Nominal</label><input class="input" type="number" min="0" name="amount" required value="${Number(row.amount||0)}"></div></div><div class="form-row"><div class="field"><label>Rekening</label><select class="select" name="account_id"><option value="">Belum dipilih</option>${options(usableAccounts,row.account_id)}</select></div><div class="field"><label>Berulang</label><select class="select" name="recurring">${['ONE_TIME','WEEKLY','MONTHLY','YEARLY'].map(x=>`<option ${row.recurring===x?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="form-row"><div class="field"><label>Status</label><select class="select" name="status_bill">${['UPCOMING','PAID','OVERDUE'].map(x=>`<option ${row.status_bill===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Scope</label><select class="select" name="scope"><option ${row.scope==='PERSONAL'?'selected':''}>PERSONAL</option><option ${row.scope!=='PERSONAL'?'selected':''}>JOINT</option></select></div></div>`;
  if(type==='goal') fields=`<div class="field"><label>Nama goal</label><input class="input" name="name" required value="${esc(row.name||'')}"></div><div class="form-row"><div class="field"><label>Target</label><input class="input" type="number" min="0" name="target_amount" required value="${Number(row.target_amount||0)}"></div><div class="field"><label>Saat ini</label><input class="input" type="number" min="0" name="current_amount" value="${Number(row.current_amount||0)}"></div></div><div class="form-row"><div class="field"><label>Target tanggal</label><input class="input" type="date" name="target_date" value="${esc(row.target_date||'')}"></div><div class="field"><label>Scope</label><select class="select" name="scope"><option ${row.scope==='PERSONAL'?'selected':''}>PERSONAL</option><option ${row.scope!=='PERSONAL'?'selected':''}>JOINT</option></select></div></div>`;
  if(type==='task') fields=`<div class="field"><label>Task</label><input class="input" name="title" required value="${esc(row.title||'')}"></div><div class="form-row"><div class="field"><label>Deadline</label><input class="input" type="date" name="due_date" value="${esc(row.due_date||today())}"></div><div class="field"><label>Assigned to</label><select class="select" name="assigned_to"><option value="">Bersama</option>${options(users,row.assigned_to)}</select></div></div><div class="form-row"><div class="field"><label>Prioritas</label><select class="select" name="priority">${['LOW','NORMAL','HIGH'].map(x=>`<option ${row.priority===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Scope</label><select class="select" name="scope"><option ${row.scope==='PERSONAL'?'selected':''}>PERSONAL</option><option ${row.scope!=='PERSONAL'?'selected':''}>JOINT</option></select></div></div>`;
  if(type==='event') fields=`<div class="field"><label>Judul agenda</label><input class="input" name="title" required value="${esc(row.title||'')}"></div><div class="form-row"><div class="field"><label>Mulai</label><input class="input" type="datetime-local" name="start_at" required value="${esc(row.start_at||`${today()}T09:00`)}"></div><div class="field"><label>Selesai</label><input class="input" type="datetime-local" name="end_at" value="${esc(row.end_at||`${today()}T10:00`)}"></div></div><div class="form-row"><div class="field"><label>Untuk</label><select class="select" name="assigned_to"><option value="">Bersama</option>${options(users,row.assigned_to)}</select></div><div class="field"><label>Scope</label><select class="select" name="scope"><option ${row.scope==='PERSONAL'?'selected':''}>PERSONAL</option><option ${row.scope!=='PERSONAL'?'selected':''}>JOINT</option></select></div></div>`;
  if(type==='shopping') fields=`<div class="field"><label>Barang</label><input class="input" name="item" required value="${esc(row.item||'')}"></div><div class="form-row"><div class="field"><label>Jumlah</label><input class="input" name="qty" value="${esc(row.qty||'')}"></div><div class="field"><label>Ditugaskan</label><select class="select" name="assigned_to"><option value="">Bersama</option>${options(users,row.assigned_to)}</select></div></div>`;
  if(type==='note') fields=`<div class="field"><label>Judul</label><input class="input" name="title" required value="${esc(row.title||'')}"></div><div class="field"><label>Catatan</label><textarea class="textarea" name="body" required>${esc(row.body||'')}</textarea></div><div class="field"><label>Scope</label><select class="select" name="scope"><option ${row.scope==='PERSONAL'?'selected':''}>PERSONAL</option><option ${row.scope!=='PERSONAL'?'selected':''}>JOINT</option></select></div>`;
  if(type==='user') fields=`<div class="field"><label>Pilih user</label><select class="select" name="id" id="user-edit-select">${options(users,row.id||users[0]?.id)}</select></div><div class="field"><label>Nama</label><input class="input" name="name" required value="${esc(row.name||users[0]?.name||'')}"></div><div class="field"><label>Email login</label><input class="input" type="email" name="email" required value="${esc(row.email||users[0]?.email||'')}"></div><div class="field"><label>Role</label><select class="select" name="role"><option value="OWNER" ${row.role==='OWNER'?'selected':''}>OWNER</option><option value="PARTNER" ${row.role==='PARTNER'?'selected':''}>PARTNER</option></select></div>`;
  modal(`${row.id?'Edit':'Tambah'} ${type}`,`<form class="form" id="entity-form" data-type="${type}" data-id="${esc(row.id||'')}">${fields}${commonActions(type,type==='user'?'':row.id)}</form>`);
}

async function saveForm(form){
  const type=form.dataset.type,id=form.dataset.id;const fd=Object.fromEntries(new FormData(form).entries());
  ['amount','initial_balance','limit_amount','target_amount','current_amount'].forEach(k=>{if(k in fd)fd[k]=Number(fd[k]||0)});if(id)fd.id=id;
  if(type==='transaction'&&fd.type==='TRANSFER'&&(!fd.to_account_id||fd.to_account_id===fd.account_id)){toast('Transfer membutuhkan rekening tujuan yang berbeda.','error');return;}
  const actionMap={account:'accounts.save',transaction:'transactions.save',budget:'budgets.save',bill:'bills.save',goal:'goals.save',task:'tasks.save',event:'events.save',shopping:'shopping.save',note:'notes.save',user:'users.save'};
  setLoading(true);try{await api.call(actionMap[type],fd);closeModal();toast('Data tersimpan.');await reloadAfterMutation(type);}catch(e){toast(e.message,'error');}finally{setLoading(false);}
}
async function deleteEntity(type,id){if(!confirm('Hapus data ini? Data akan di-soft-delete dan tetap tercatat di audit log.'))return;const actionMap={account:'accounts.delete',transaction:'transactions.delete',budget:'budgets.delete',bill:'bills.delete',goal:'goals.delete',task:'tasks.delete',event:'events.delete',shopping:'shopping.delete',note:'notes.delete'};try{await api.call(actionMap[type],{id});closeModal();toast('Data dihapus.');await reloadAfterMutation(type);}catch(e){toast(e.message,'error');}}
async function reloadAfterMutation(type){
  const map={account:['accounts.list','accounts'],transaction:['transactions.list','transactions'],budget:['budgets.list','budgets'],bill:['bills.list','bills'],goal:['goals.list','goals'],task:['tasks.list','tasks'],event:['events.list','events'],shopping:['shopping.list','shopping'],note:['notes.list','notes'],user:['users.list','users']};
  const [a,k]=map[type];await cached(a,k);if(type==='user'){const me=(state.data.users||[]).find(u=>u.id===state.user?.id);if(me){state.user={...state.user,...me};if(LocalConfig.session){LocalConfig.session={...LocalConfig.session,user:{...LocalConfig.session.user,...me}};}}}if(['account','transaction','bill','task','event','user'].includes(type))await refreshDashboard();render();
}
async function toggle(action,id,key,listAction){try{await api.call(action,{id});await cached(listAction,key);await refreshDashboard();render();}catch(e){toast(e.message,'error');}}

async function sendAI(message){
  if(!message.trim())return;state.chat.push({role:'user',text:message.trim()});state.chat.push({role:'ai',text:'Menganalisis data…'});render();
  try{const r=await api.call('ai.chat',{message:message.trim()},{polls:45});state.chat[state.chat.length-1]={role:'ai',text:r.text||'Tidak ada jawaban.'};}catch(e){state.chat[state.chat.length-1]={role:'ai',text:`Maaf, AI gagal merespons: ${e.message}`};}render();setTimeout(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}),30);
}
async function aiFeedback(){state.route='ai';state.chat.push({role:'user',text:'Berikan review otomatis kondisi keuangan, jadwal, dan household saya.'},{role:'ai',text:'Menyiapkan review…'});render();try{const r=await api.call('ai.feedback',{}, {polls:45});state.chat[state.chat.length-1]={role:'ai',text:r.text};}catch(e){state.chat[state.chat.length-1]={role:'ai',text:`Gagal membuat review: ${e.message}`};}render();}

function quickAdd(){modal('Tambah cepat',`<div class="grid grid-2"><button class="btn" data-add="transaction">💸 Transaksi</button><button class="btn" data-add="task">✅ Task</button><button class="btn" data-add="event">📅 Agenda</button><button class="btn" data-add="shopping">🛒 Belanja</button><button class="btn" data-add="note">📝 Catatan</button><button class="btn" data-route="ai" data-close-modal>✨ Tanya AI</button></div>`);}

async function loadApp(){
  setLoading(true);try{await Promise.all([refreshDashboard(),refreshCore()]);render();}catch(e){
    if(/session|login|Unauthorized|Sesi/i.test(e.message)){LocalConfig.session=null;state.user=null;showLogin();}else{toast(e.message,'error');render();}
  }finally{setLoading(false);}
}

function connectionScreen(){
  $('#app').innerHTML=`<div class="setup-shell"><section class="auth-card"><div class="auth-logo">R</div><h1>Hubungkan RUMA</h1><p>Masukkan URL Web App Google Apps Script yang berakhiran <b>/exec</b>. URL ini hanya disimpan di perangkat sampai Anda memasukkannya ke <code>config.js</code>.</p><form class="form" id="connect-form"><div class="field"><label>Apps Script Web App URL</label><input class="input" name="api" type="url" required placeholder="https://script.google.com/macros/s/.../exec"></div><button class="btn btn-primary btn-block">Hubungkan</button><button class="btn btn-block" type="button" data-demo>Masuk Demo Lokal</button></form></section></div>`;
}
function bootstrapScreen(){
  $('#app').innerHTML=`<div class="setup-shell"><section class="auth-card"><div class="auth-logo">R</div><h1>Setup pertama</h1><p>Jalankan <code>setupApp()</code> di Apps Script terlebih dahulu, lalu masukkan kode setup yang muncul di Execution log.</p><form class="form" id="bootstrap-form"><div class="field"><label>Setup code</label><input class="input" name="setupCode" required autocomplete="off"></div><div class="field"><label>Nama household</label><input class="input" name="householdName" required value="Rumah Kita"></div><div class="form-row"><div class="field"><label>Nama suami</label><input class="input" name="ownerName" required></div><div class="field"><label>Email Google suami</label><input class="input" name="ownerEmail" type="email" required></div></div><div class="form-row"><div class="field"><label>Nama istri</label><input class="input" name="partnerName" required></div><div class="field"><label>Email Google istri</label><input class="input" name="partnerEmail" type="email" required></div></div><div class="field"><label>Google Web Client ID</label><input class="input" name="googleClientId" required placeholder="...apps.googleusercontent.com"><div class="help">Tambahkan domain GitHub Pages Anda ke Authorized JavaScript origins di Google Cloud.</div></div><div class="field"><label>Gemini API Key (opsional sekarang)</label><input class="input" name="geminiApiKey" type="password" autocomplete="new-password"></div><button class="btn btn-primary btn-block">Selesaikan setup</button></form></section></div>`;
}
function showLogin(){
  const c=state.publicConfig||{};$('#app').innerHTML=`<div class="login-shell"><section class="auth-card"><div class="auth-logo">R</div><h1>${esc(c.householdName||'RUMA')}</h1><p>Masuk menggunakan salah satu akun Google yang sudah terdaftar sebagai suami/istri.</p><div id="google-login" style="min-height:44px;margin:18px 0"></div><button class="btn btn-block" data-demo>Demo lokal</button><p class="help" style="margin-top:16px">Login Google diverifikasi oleh backend, lalu RUMA membuat session token sendiri. Aktifkan PIN perangkat dari Settings jika ingin lapisan kunci lokal tambahan.</p></section></div>`;waitGoogleButton(c.googleClientId);
}
function waitGoogleButton(clientId,tries=30){
  if(!clientId){$('#google-login').innerHTML='<div class="warning">Google Client ID belum dikonfigurasi.</div>';return;}
  if(window.google?.accounts?.id){
    window.handleGoogleCredential=async(resp)=>{try{setLoading(true);const data=await api.call('auth.google',{credential:resp.credential,deviceId:LocalConfig.deviceId()},{noSession:true,polls:35});LocalConfig.session=data;sessionStorage.setItem('ruma_unlocked','1');state.user=data.user;await loadApp();}catch(e){toast(e.message,'error');}finally{setLoading(false);}};
    google.accounts.id.initialize({client_id:clientId,callback:window.handleGoogleCredential,auto_select:false,cancel_on_tap_outside:true});
    google.accounts.id.renderButton($('#google-login'),{theme:'outline',size:'large',width:330,text:'signin_with',shape:'pill'});
  } else if(tries>0) setTimeout(()=>waitGoogleButton(clientId,tries-1),250); else $('#google-login').innerHTML='<div class="warning">Google Identity gagal dimuat. Periksa koneksi/CSP.</div>';
}

async function hashPin(pin){
  const bytes=new TextEncoder().encode(String(pin));const out=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(out),b=>b.toString(16).padStart(2,'0')).join('');
}
function showLock(){
  $('#app').innerHTML=`<div class="login-shell"><section class="auth-card"><div class="auth-logo">R</div><h1>RUMA terkunci</h1><p>Masukkan PIN 6 digit perangkat ini.</p><form class="form" id="unlock-form"><div class="field"><label>PIN</label><input class="input" name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" type="password" required autofocus></div><button class="btn btn-primary btn-block">Buka RUMA</button><button class="btn btn-block" type="button" data-action="logout-local">Login ulang Google</button></form></section></div>`;
}
function openPinSettings(){
  modal('PIN perangkat',`<form class="form" id="pin-form"><div class="field"><label>PIN baru (6 digit)</label><input class="input" name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="Kosongkan untuk menghapus"></div><div class="help">PIN hanya melindungi sesi pada perangkat ini. Login utama tetap menggunakan Google.</div><div class="modal-actions"><button class="btn" type="button" data-close-modal>Batal</button><button class="btn btn-primary">Simpan</button></div></form>`);
}

async function initial(){
  if(new URLSearchParams(location.search).get('demo')==='1') LocalConfig.demo=true;
  applyTheme();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  if(LocalConfig.session&&LocalConfig.pinHash&&sessionStorage.getItem('ruma_unlocked')!=='1')return showLock();
  if(LocalConfig.demo){state.publicConfig={householdName:'RUMA Demo'};state.user=window.__RUMA_DEMO__?{id:'USR_DEMO_1',name:'Farhan',email:'demo@ruma.local'}:null;return loadApp();}
  if(!api.configured)return connectionScreen();
  if(!navigator.onLine && LocalConfig.session){state.publicConfig=JSON.parse(localStorage.getItem('ruma_public_config')||'{}');state.user=LocalConfig.session.user;return loadApp();}
  try{state.publicConfig=await api.public('system.publicConfig');localStorage.setItem('ruma_public_config',JSON.stringify(state.publicConfig));if(!state.publicConfig.bootstrapped)return bootstrapScreen();if(LocalConfig.session){state.user=LocalConfig.session.user;return loadApp();}showLogin();}catch(e){if(LocalConfig.session){state.publicConfig=JSON.parse(localStorage.getItem('ruma_public_config')||'{}');state.user=LocalConfig.session.user;return loadApp();}connectionScreen();toast(e.message,'error');}
}

async function openAISettings(){
  try{const s=await api.call('system.aiSettings.get');modal('Pengaturan AI',`<form class="form" id="ai-settings-form"><div class="field"><label>Provider</label><select class="select" name="provider"><option value="GEMINI" ${s.provider==='GEMINI'?'selected':''}>Gemini</option><option value="GROQ" ${s.provider==='GROQ'?'selected':''}>Groq</option><option value="AUTO" ${s.provider==='AUTO'?'selected':''}>Auto</option></select></div><div class="field"><label>Gemini fast model</label><input class="input" name="geminiFastModel" value="${esc(s.geminiFastModel||'gemini-3.5-flash-lite')}"></div><div class="field"><label>Gemini smart model</label><input class="input" name="geminiSmartModel" value="${esc(s.geminiSmartModel||'gemini-3.7-flash')}"></div><div class="field"><label>Gemini API key baru</label><input class="input" type="password" name="geminiApiKey" placeholder="Kosongkan untuk mempertahankan key"><div class="help">Status: ${s.hasGeminiKey?'✓ tersimpan':'belum ada'}</div></div><div class="field"><label>Groq model</label><input class="input" name="groqModel" value="${esc(s.groqModel||'openai/gpt-oss-20b')}"></div><div class="field"><label>Groq API key baru</label><input class="input" type="password" name="groqApiKey" placeholder="Kosongkan untuk mempertahankan key"><div class="help">Status: ${s.hasGroqKey?'✓ tersimpan':'belum ada'}</div></div><div class="modal-actions"><button class="btn" type="button" data-close-modal>Batal</button><button class="btn btn-primary">Simpan</button></div></form>`);}catch(e){toast(e.message,'error');}
}

// Event delegation
addEventListener('click',async e=>{
  const route=e.target.closest('[data-route]')?.dataset.route;if(route){closeModal();state.route=route;render();return;}
  const mt=e.target.closest('[data-money-tab]')?.dataset.moneyTab;if(mt){state.moneyTab=mt;render();return;}
  const pt=e.target.closest('[data-plan-tab]')?.dataset.planTab;if(pt){state.planTab=pt;render();return;}
  const xt=e.target.closest('[data-more-tab]')?.dataset.moreTab;if(xt){state.moreTab=xt;render();return;}
  if(e.target.closest('[data-close-modal]') || e.target.hasAttribute('data-close-backdrop')){closeModal();return;}
  const add=e.target.closest('[data-add]')?.dataset.add;if(add){const row=add==='user'?(state.data.users||[])[0]||{}:{};openForm(add,row);return;}
  const edit=e.target.closest('[data-edit]');if(edit){openForm(edit.dataset.edit,findEntity(edit.dataset.edit,edit.dataset.id));return;}
  const del=e.target.closest('[data-delete]');if(del){await deleteEntity(del.dataset.delete,del.dataset.id);return;}
  const tt=e.target.closest('[data-toggle-task]');if(tt){await toggle('tasks.toggle',tt.dataset.toggleTask,'tasks','tasks.list');return;}
  const ts=e.target.closest('[data-toggle-shopping]');if(ts){await toggle('shopping.toggle',ts.dataset.toggleShopping,'shopping','shopping.list');return;}
  if(e.target.closest('[data-action="quick-add"]')){quickAdd();return;}
  if(e.target.closest('[data-ai-feedback]')){await aiFeedback();return;}
  const aip=e.target.closest('[data-ai-prompt]')?.dataset.aiPrompt;if(aip){await sendAI(aip);return;}
  if(e.target.closest('[data-demo]')){LocalConfig.demo=true;LocalConfig.session=null;location.reload();return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='logout'){try{if(!LocalConfig.demo)await api.call('auth.logout',{});}catch{}LocalConfig.demo=false;LocalConfig.session=null;sessionStorage.removeItem('ruma_unlocked');await CacheStore.clear();location.reload();}
  if(action==='profile'){state.route='more';state.moreTab='settings';render();}
  if(action==='health'){try{const r=await api.call('system.health');toast(`Koneksi OK · DB ${r.dbVersion||'-'} · ${r.mode||'ONLINE'}`);}catch(err){toast(err.message,'error');}}
  if(action==='clear-cache'){await CacheStore.clear();toast('Cache lokal dibersihkan.');}
  if(action==='backup'){try{const r=await api.call('system.backup');toast(`Backup dibuat: ${r.name||'selesai'}`);}catch(err){toast(err.message,'error');}}
  if(action==='ai-settings'){await openAISettings();}
  if(action==='pin-settings'){openPinSettings();}
  if(action==='logout-local'){LocalConfig.session=null;sessionStorage.removeItem('ruma_unlocked');location.reload();}
});

addEventListener('submit',async e=>{
  if(e.target.id==='connect-form'){e.preventDefault();LocalConfig.apiUrl=new FormData(e.target).get('api');location.reload();return;}
  if(e.target.id==='bootstrap-form'){e.preventDefault();const p=Object.fromEntries(new FormData(e.target).entries());try{setLoading(true);await api.call('system.bootstrap',p,{noSession:true,polls:40});toast('Setup berhasil.');setTimeout(()=>location.reload(),600);}catch(err){toast(err.message,'error');}finally{setLoading(false);}return;}
  if(e.target.id==='unlock-form'){e.preventDefault();const pin=String(new FormData(e.target).get('pin')||'');if(await hashPin(pin)===LocalConfig.pinHash){sessionStorage.setItem('ruma_unlocked','1');location.reload();}else toast('PIN salah.','error');return;}
  if(e.target.id==='pin-form'){e.preventDefault();const pin=String(new FormData(e.target).get('pin')||'').trim();if(pin&& !/^\d{6}$/.test(pin)){toast('PIN harus 6 digit.','error');return;}LocalConfig.pinHash=pin?await hashPin(pin):'';sessionStorage.setItem('ruma_unlocked','1');closeModal();toast(pin?'PIN perangkat aktif.':'PIN perangkat dihapus.');return;}
  if(e.target.id==='entity-form'){e.preventDefault();await saveForm(e.target);return;}
  if(e.target.id==='chat-form'){e.preventDefault();const inp=$('#chat-message');const m=inp.value;inp.value='';await sendAI(m);return;}
  if(e.target.id==='ai-settings-form'){e.preventDefault();try{await api.call('system.aiSettings.save',Object.fromEntries(new FormData(e.target).entries()));closeModal();toast('Pengaturan AI tersimpan.');}catch(err){toast(err.message,'error');}return;}
});

addEventListener('change',e=>{
  if(e.target.id==='theme-select'){LocalConfig.theme=e.target.value;applyTheme();render();}
  if(e.target.id==='user-edit-select'){
    const u=(state.data.users||[]).find(x=>x.id===e.target.value);if(!u)return;const f=e.target.form;f.dataset.id=u.id;f.elements.name.value=u.name;f.elements.email.value=u.email;f.elements.role.value=u.role;
  }
});

addEventListener('online',()=>toast('Koneksi kembali online.'));
addEventListener('offline',()=>toast('Offline. Data cache tetap dapat dibaca.','error'));
initial();
