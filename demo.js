const now=new Date();
const isoDate=(d=now)=>d.toISOString().slice(0,10);
const tomorrow=new Date(now);tomorrow.setDate(now.getDate()+1);
const month=isoDate().slice(0,7);
const state={
  user:{id:'USR_DEMO_1',name:'Farhan',email:'demo@ruma.local',role:'OWNER',household_id:'HH_DEMO'},
  users:[
    {id:'USR_DEMO_1',name:'Farhan',email:'demo@ruma.local',role:'OWNER',status:'ACTIVE'},
    {id:'USR_DEMO_2',name:'Pasangan',email:'partner@ruma.local',role:'PARTNER',status:'ACTIVE'}
  ],
  accounts:[
    {id:'ACC1',name:'BCA Suami',type:'BANK',owner_user_id:'USR_DEMO_1',scope:'PERSONAL',visibility:'PRIVATE',initial_balance:8500000,balance:8500000,status:'ACTIVE'},
    {id:'ACC2',name:'GoPay',type:'EWALLET',owner_user_id:'USR_DEMO_1',scope:'PERSONAL',visibility:'SUMMARY',initial_balance:450000,balance:450000,status:'ACTIVE'},
    {id:'ACC3',name:'BCA Bersama',type:'BANK',owner_user_id:'',scope:'JOINT',visibility:'SHARED',initial_balance:7250000,balance:7250000,status:'ACTIVE'}
  ],
  categories:[
    {id:'CAT_FOOD',name:'Makan',type:'EXPENSE',icon:'🍜'},{id:'CAT_HOME',name:'Rumah',type:'EXPENSE',icon:'🏠'},{id:'CAT_TRANS',name:'Transport',type:'EXPENSE',icon:'🚗'},{id:'CAT_INCOME',name:'Gaji',type:'INCOME',icon:'💼'},{id:'CAT_OTHER',name:'Lainnya',type:'BOTH',icon:'🧾'}
  ],
  transactions:[
    {id:'TX1',date:isoDate(),type:'EXPENSE',amount:75000,category_id:'CAT_FOOD',account_id:'ACC3',to_account_id:'',description:'Makan siang',scope:'JOINT',created_by:'USR_DEMO_1',status:'ACTIVE'},
    {id:'TX2',date:isoDate(),type:'EXPENSE',amount:150000,category_id:'CAT_TRANS',account_id:'ACC1',to_account_id:'',description:'Bensin',scope:'PERSONAL',created_by:'USR_DEMO_1',status:'ACTIVE'}
  ],
  budgets:[
    {id:'BUD1',month,category_id:'CAT_FOOD',limit_amount:3000000,scope:'JOINT',user_id:'',status:'ACTIVE'},
    {id:'BUD2',month,category_id:'CAT_HOME',limit_amount:2500000,scope:'JOINT',user_id:'',status:'ACTIVE'}
  ],
  bills:[
    {id:'BILL1',name:'Internet',due_date:isoDate(tomorrow),amount:450000,account_id:'ACC3',recurring:'MONTHLY',status_bill:'UPCOMING',scope:'JOINT',status:'ACTIVE'},
    {id:'BILL2',name:'PLN',due_date:isoDate(new Date(now.getFullYear(),now.getMonth(),now.getDate()+5)),amount:750000,account_id:'ACC3',recurring:'MONTHLY',status_bill:'UPCOMING',scope:'JOINT',status:'ACTIVE'}
  ],
  goals:[{id:'GOAL1',name:'Dana Darurat',target_amount:50000000,current_amount:31500000,target_date:'2027-06-30',scope:'JOINT',status:'ACTIVE'}],
  tasks:[
    {id:'TASK1',title:'Beli galon',due_date:isoDate(),assigned_to:'USR_DEMO_2',priority:'NORMAL',done:false,scope:'JOINT',status:'ACTIVE'},
    {id:'TASK2',title:'Service AC',due_date:isoDate(tomorrow),assigned_to:'USR_DEMO_1',priority:'HIGH',done:false,scope:'JOINT',status:'ACTIVE'}
  ],
  events:[{id:'EV1',title:'Meeting',start_at:`${isoDate()}T09:00`,end_at:`${isoDate()}T10:00`,assigned_to:'USR_DEMO_1',scope:'PERSONAL',status:'ACTIVE'}],
  shopping:[{id:'SHOP1',item:'Susu',qty:'2 kotak',assigned_to:'USR_DEMO_1',done:false,status:'ACTIVE'},{id:'SHOP2',item:'Telur',qty:'1 kg',assigned_to:'USR_DEMO_2',done:true,status:'ACTIVE'}],
  notes:[{id:'NOTE1',title:'Ukuran filter AC',body:'40 x 30 cm',scope:'JOINT',owner_user_id:'USR_DEMO_1',status:'ACTIVE'}]
};

function id(prefix){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`.toUpperCase();}
function find(arr,idv){return arr.find(x=>x.id===idv);}
function recomputeBalances(){
  state.accounts.forEach(a=>a.balance=Number(a.initial_balance||0));
  state.transactions.filter(x=>x.status!=='DELETED').forEach(t=>{
    const amount=Number(t.amount||0),a=find(state.accounts,t.account_id),b=find(state.accounts,t.to_account_id);
    if(t.type==='EXPENSE'&&a)a.balance-=amount;
    if(t.type==='INCOME'&&a)a.balance+=amount;
    if(t.type==='TRANSFER'){if(a)a.balance-=amount;if(b)b.balance+=amount;}
  });
}
function saveEntity(key,payload,prefix){
  const arr=state[key];let row=payload.id?find(arr,payload.id):null;
  if(row) Object.assign(row,payload,{updated_at:new Date().toISOString()});
  else{row={...payload,id:id(prefix),status:'ACTIVE',created_at:new Date().toISOString(),updated_at:new Date().toISOString()};arr.unshift(row);}
  if(key==='transactions')recomputeBalances();
  return row;
}
function delEntity(key,idv){const row=find(state[key],idv);if(row)row.status='DELETED';if(key==='transactions')recomputeBalances();return true;}
function active(key){return state[key].filter(x=>x.status!=='DELETED');}
function dashboard(){
  recomputeBalances();
  const tx=active('transactions'), monthTx=tx.filter(t=>(t.date||'').slice(0,7)===month);
  const expense=monthTx.filter(t=>t.type==='EXPENSE').reduce((a,b)=>a+Number(b.amount||0),0);
  const income=monthTx.filter(t=>t.type==='INCOME').reduce((a,b)=>a+Number(b.amount||0),0);
  const own=state.accounts.filter(a=>a.owner_user_id===state.user.id&&a.status!=='DELETED').reduce((a,b)=>a+Number(b.balance||0),0);
  const joint=state.accounts.filter(a=>a.scope==='JOINT'&&a.status!=='DELETED').reduce((a,b)=>a+Number(b.balance||0),0);
  return {user:state.user,ownBalance:own,jointBalance:joint,income,expense,todayEvents:active('events').filter(e=>(e.start_at||'').slice(0,10)===isoDate()),todayTasks:active('tasks').filter(t=>t.due_date===isoDate()&&!t.done),upcomingBills:active('bills').filter(b=>b.status_bill!=='PAID').slice(0,3),insight:expense>1000000?'Pengeluaran bulan ini mulai meningkat. Cek kategori terbesar agar target tabungan tetap aman.':'Arus kas masih terkendali. Pertahankan pencatatan transaksi agar analisis makin akurat.'};
}

window.__RUMA_DEMO__={
  async call(action,p={}){
    await new Promise(r=>setTimeout(r,100));
    switch(action){
      case 'dashboard.get':return dashboard();
      case 'users.list':return active('users');
      case 'accounts.list':recomputeBalances();return active('accounts');
      case 'categories.list':return state.categories;
      case 'transactions.list':return active('transactions');
      case 'budgets.list':return active('budgets');
      case 'bills.list':return active('bills');
      case 'goals.list':return active('goals');
      case 'tasks.list':return active('tasks');
      case 'events.list':return active('events');
      case 'shopping.list':return active('shopping');
      case 'notes.list':return active('notes');
      case 'accounts.save':return saveEntity('accounts',p,'ACC');
      case 'transactions.save':return saveEntity('transactions',p,'TX');
      case 'budgets.save':return saveEntity('budgets',p,'BUD');
      case 'bills.save':return saveEntity('bills',p,'BILL');
      case 'goals.save':return saveEntity('goals',p,'GOAL');
      case 'tasks.save':return saveEntity('tasks',p,'TASK');
      case 'events.save':return saveEntity('events',p,'EVT');
      case 'shopping.save':return saveEntity('shopping',p,'SHOP');
      case 'notes.save':return saveEntity('notes',p,'NOTE');
      case 'accounts.delete':return delEntity('accounts',p.id);
      case 'transactions.delete':return delEntity('transactions',p.id);
      case 'budgets.delete':return delEntity('budgets',p.id);
      case 'bills.delete':return delEntity('bills',p.id);
      case 'goals.delete':return delEntity('goals',p.id);
      case 'tasks.delete':return delEntity('tasks',p.id);
      case 'events.delete':return delEntity('events',p.id);
      case 'shopping.delete':return delEntity('shopping',p.id);
      case 'notes.delete':return delEntity('notes',p.id);
      case 'tasks.toggle':{const r=find(state.tasks,p.id);if(r)r.done=!r.done;return r;}
      case 'shopping.toggle':{const r=find(state.shopping,p.id);if(r)r.done=!r.done;return r;}
      case 'ai.feedback':return {text:'Ringkasan demo: pengeluaran terbesar saat ini berasal dari kebutuhan rutin. Pastikan tagihan Internet dan PLN sudah tercakup, lalu arahkan sisa kas ke target Dana Darurat. Pembagian tugas rumah juga sebaiknya dicek mingguan agar tetap seimbang.',provider:'DEMO'};
      case 'ai.chat':return {text:`Saya membaca data demo RUMA. Untuk pertanyaan “${p.message||''}”, fokus utama saat ini adalah menjaga tagihan terdekat tetap terbayar, memantau pengeluaran makan, dan menyelesaikan task rumah yang jatuh tempo.`,provider:'DEMO'};
      case 'auth.logout':return true;
      case 'system.health':return {ok:true,mode:'DEMO',version:'1.0.0'};
      default:throw new Error(`Demo action belum tersedia: ${action}`);
    }
  }
};
