export const DEFAULT_AUDIT_ITEMS=[
 {key:'stockAvailability',label:'Ketersediaan produk katalog di outlet',required:false},
 {key:'priceCompliance',label:'Kesesuaian harga jual',required:false},
 {key:'posmDisplay',label:'Pajangan produk / POSM rapi',required:false},
 {key:'salesGreeting',label:'Hubungan Sales dengan pemilik outlet baik',required:false},
];
export function parseAuditItems(raw){
 const value=typeof raw==='string'?JSON.parse(raw):raw;
 if(!Array.isArray(value)||value.length>30)throw new Error('Checklist maksimal 30 pertanyaan.');
 const keys=new Set();
 return value.map(item=>{
  if(!item||typeof item!=='object'||Object.keys(item).some(k=>!['key','label','required'].includes(k))||!/^([a-zA-Z][a-zA-Z0-9_]{0,63})$/.test(item.key)||['constructor','prototype','__proto__','state','startKind','finishKind','finishedAt'].includes(item.key)||keys.has(item.key)||typeof item.label!=='string'||item.label.trim().length<3||item.label.length>200||typeof item.required!=='boolean')throw new Error('Setiap pertanyaan harus memiliki kode unik, label 3–200 karakter, dan pilihan wajib jawab.');
  keys.add(item.key);return {key:item.key,label:item.label.trim(),required:item.required};
 });
}
export const auditItems=values=>parseAuditItems(values?.SPV_AUDIT_ITEMS??DEFAULT_AUDIT_ITEMS);
export function auditAnswers(items,answers={}){
 const missing=items.filter(item=>item.required&&typeof answers[item.key]!=='boolean');
 if(missing.length)throw new Error(`Jawab pertanyaan wajib: ${missing.map(i=>i.label).join('; ')}`);
 return Object.fromEntries(items.filter(item=>typeof answers[item.key]==='boolean').map(item=>[item.key,answers[item.key]]));
}
