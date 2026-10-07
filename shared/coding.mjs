export const CODE_ENTITIES = [
  {key:'USER',label:'ID pegawai / pengguna',model:'user',field:'staffCode',prefix:'USR',mode:'INCREMENT'},
  {key:'CLUSTER',label:'Kode klaster',model:'cluster',field:'code',prefix:'CLS',mode:'INCREMENT'},
  {key:'PJP',label:'Nomor PJP',model:'pjp',field:'code',prefix:'PJP',mode:'INCREMENT',reset:'DAILY'},
  {key:'NOO',label:'Pengajuan NOO',model:'customerRegistration',field:'registrationCode',prefix:'NOO',mode:'INCREMENT',reset:'MONTHLY'},
  {key:'OUTLET',label:'Outlet / Customer ID',model:'outlet',field:'outletCode',prefix:'OUT',mode:'INCREMENT'},
  {key:'PRODUCT_SKU',label:'SKU produk',model:'product',field:'sku',prefix:'SKU',mode:'MANUAL'},
  {key:'PRODUCT',label:'Kode produk tambahan',model:'product',field:'code',prefix:'PRD',mode:'MANUAL',optional:true},
  {key:'VEHICLE',label:'Kode kendaraan',model:'vehicle',field:'code',prefix:'VEH',mode:'MANUAL'},
  {key:'DIVISION',label:'Kode divisi',model:'division',field:'code',prefix:'DIV',mode:'MANUAL',optional:true},
  {key:'ORDER',label:'Nomor order',model:'order',field:'code',prefix:'ORD',mode:'INCREMENT',reset:'MONTHLY'},
  {key:'PACKING_LIST',label:'Packing list',model:'packingList',field:'code',prefix:'PL',mode:'INCREMENT',reset:'DAILY'},
  {key:'INVOICE',label:'Nomor faktur',model:'invoice',field:'invoiceNumber',prefix:'INV',mode:'MANUAL'},
  {key:'DELIVERY_ROUTE',label:'Rute pengiriman',model:'deliveryRoute',field:'code',prefix:'RT',mode:'INCREMENT',reset:'DAILY'},
];

export const CODE_CONFIG_GROUPS = CODE_ENTITIES.map(entity => ({
  groupKey:`CODING_${entity.key}`,groupLabel:`Pengkodean: ${entity.label}`,groupDescription:'Otomatis berurutan, pola khusus, atau otomatis dimatikan untuk input manual. Berlaku pada data baru.',groupIcon:'LuKey',groupColor:'violet',
  params:[
    {key:`CODE_${entity.key}_MODE`,label:'Mode pengkodean',type:'select',options:['INCREMENT','PATTERN','MANUAL'],defaultValue:entity.mode,description:'INCREMENT: prefix + periode + nomor urut. PATTERN: pola khusus. MANUAL: otomatis OFF dan kode diinput pengguna.'},
    {key:`CODE_${entity.key}_PREFIX`,label:'Prefix kode',type:'text',defaultValue:entity.prefix,description:'Prefix untuk mode INCREMENT dan token {PREFIX}. Contoh OUT atau NOO.'},
    {key:`CODE_${entity.key}_PATTERN`,label:'Pola kode',type:'text',defaultValue:'{PREFIX}-{YYYY}{MM}{DD}-{SEQ}',description:'Token: {PREFIX}, {YYYY}, {YY}, {MM}, {DD}, {SEQ}. Contoh NOO/{YYYY}/{MM}/{SEQ}. {SEQ} wajib agar unik.'},
    {key:`CODE_${entity.key}_START`,label:'Nomor awal',type:'number',min:1,max:1000000000,defaultValue:1,description:'Batas awal saat seri baru dibuat. Menaikkan nilai melompati nomor; menurunkan nilai tidak mengulang nomor yang sudah digunakan.'},
    {key:`CODE_${entity.key}_PADDING`,label:'Panjang minimum nomor urut',type:'number',min:1,max:12,defaultValue:5,description:'Nomor 1 dengan panjang 5 menjadi 00001. Angka terus bertambah ketika melewati panjang ini.'},
    {key:`CODE_${entity.key}_RESET`,label:'Reset nomor urut',type:'select',options:['NONE','DAILY','MONTHLY','YEARLY'],defaultValue:entity.reset || 'NONE',description:'Pergantian periode memakai WIB. Pola harus memuat token tanggal sesuai periode agar kode tidak berulang.'},
  ],
}));

export function codePolicy(entityKey, values = {}) {
  const entity = CODE_ENTITIES.find(e=>e.key===entityKey);
  if (!entity) throw new Error('Jenis kode tidak dikenal');
  const prefix = `CODE_${entityKey}_`;
  const defaults = Object.fromEntries(CODE_CONFIG_GROUPS.find(g=>g.groupKey===`CODING_${entityKey}`).params.map(p=>[p.key,p.defaultValue]));
  const read = name => values[prefix+name] ?? defaults[prefix+name];
  return {mode:read('MODE'),prefix:read('PREFIX'),pattern:read('PATTERN'),start:Number(read('START')),padding:Number(read('PADDING')),reset:read('RESET')};
}

export function validateCodePolicy(policy) {
  if (!['INCREMENT','PATTERN','MANUAL'].includes(policy.mode)) throw new Error('Mode kode tidak valid');
  if (!Number.isInteger(policy.start) || policy.start < 1 || policy.start > 1e9) throw new Error('Nomor awal harus bilangan bulat 1–1000000000');
  if (!Number.isInteger(policy.padding) || policy.padding < 1 || policy.padding > 12) throw new Error('Panjang nomor harus bilangan bulat 1–12');
  if (!['NONE','DAILY','MONTHLY','YEARLY'].includes(policy.reset)) throw new Error('Periode reset tidak valid');
  if (typeof policy.prefix !== 'string' || policy.prefix.length > 30 || /[{}\r\n]/.test(policy.prefix)) throw new Error('Prefix maksimal 30 karakter tanpa token atau baris baru');
  if (typeof policy.pattern !== 'string' || policy.pattern.length > 100 || /[\r\n]/.test(policy.pattern)) throw new Error('Pola maksimal 100 karakter tanpa baris baru');
  if (policy.mode === 'PATTERN') {
    const stripped = policy.pattern.replace(/\{(PREFIX|YYYY|YY|MM|DD|SEQ)\}/g,'');
    if (/[{}]/.test(stripped) || !policy.pattern.includes('{SEQ}')) throw new Error('Pola harus memuat {SEQ} dan hanya token yang didukung');
    const year = policy.pattern.includes('{YYYY}') || policy.pattern.includes('{YY}');
    if (policy.reset !== 'NONE' && !year) throw new Error('Reset periode memerlukan token tahun pada pola');
    if (['MONTHLY','DAILY'].includes(policy.reset) && !policy.pattern.includes('{MM}')) throw new Error('Reset bulan/hari memerlukan {MM}');
    if (policy.reset === 'DAILY' && !policy.pattern.includes('{DD}')) throw new Error('Reset harian memerlukan {DD}');
  }
}

export function codePeriod(reset, date = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(date).replace(/-/g,'');
  return reset === 'DAILY' ? day : reset === 'MONTHLY' ? day.slice(0,6) : reset === 'YEARLY' ? day.slice(0,4) : 'ALL';
}

export function formatCode(policy, sequence, date = new Date()) {
  validateCodePolicy(policy);
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error('Nomor urut tidak valid');
  const day = codePeriod('DAILY',date);
  const tokens = {PREFIX:policy.prefix.trim(),YYYY:day.slice(0,4),YY:day.slice(2,4),MM:day.slice(4,6),DD:day.slice(6,8),SEQ:String(sequence).padStart(policy.padding,'0')};
  const period = codePeriod(policy.reset,date);
  const pattern = policy.mode === 'PATTERN' ? policy.pattern : [...(tokens.PREFIX?['{PREFIX}']:[]),...(period==='ALL'?[]:[period]),'{SEQ}'].join('-');
  const code=pattern.replace(/\{(PREFIX|YYYY|YY|MM|DD|SEQ)\}/g,(_,key)=>tokens[key]);
  if (code.length>128) throw new Error('Hasil pola kode melebihi 128 karakter');
  return code;
}

export function manualCodeRequired(entityKey,settings) {
  return codePolicy(entityKey,settings).mode === 'MANUAL';
}
