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
  if(!item||typeof item!=='object'||Object.keys(item).some(k=>!['key','label','required','type','options','min','max','failureBelow','failedValues','requireFailureReason','requireFailurePhoto'].includes(k))||!/^([a-zA-Z][a-zA-Z0-9_]{0,63})$/.test(item.key)||['constructor','prototype','__proto__','state','startKind','finishKind','finishedAt'].includes(item.key)||keys.has(item.key)||typeof item.label!=='string'||item.label.trim().length<3||item.label.length>200||typeof item.required!=='boolean')throw new Error('Setiap pertanyaan harus memiliki kode unik, label 3–200 karakter, dan pilihan wajib jawab.');
  const type=item.type||'BOOLEAN';
  if(!['BOOLEAN','TEXT','NUMBER','SELECT'].includes(type))throw new Error('Tipe pertanyaan tidak dikenal.');
  for(const flag of ['requireFailureReason','requireFailurePhoto'])if(item[flag]!==undefined&&typeof item[flag]!=='boolean')throw new Error('Kewajiban bukti harus berupa pilihan aktif/nonaktif.');
  if(type==='TEXT'&&(item.requireFailureReason||item.requireFailurePhoto))throw new Error('Jawaban teks tidak mempunyai kondisi gagal otomatis.');
  if(type==='SELECT'){
   if(!Array.isArray(item.options)||item.options.length<2||item.options.length>20||item.options.some(v=>typeof v!=='string'||!v.trim()||v!==v.trim()||v.length>100)||new Set(item.options).size!==item.options.length)throw new Error('Pilihan jawaban harus 2–20 nilai unik, maksimal 100 karakter.');
   if(item.failedValues!==undefined&&(!Array.isArray(item.failedValues)||new Set(item.failedValues).size!==item.failedValues.length||item.failedValues.some(v=>!item.options.includes(v))))throw new Error('Kondisi gagal harus memakai pilihan jawaban yang tersedia.');
   if((item.requireFailureReason||item.requireFailurePhoto)&&!item.failedValues?.length)throw new Error('Pilih jawaban yang dianggap gagal sebelum mewajibkan bukti.');
  }else if(item.options!==undefined||item.failedValues!==undefined)throw new Error('Pilihan jawaban hanya berlaku pada tipe pilihan.');
  if(type==='NUMBER'){
   for(const key of ['min','max','failureBelow'])if(item[key]!==undefined&&!Number.isFinite(item[key]))throw new Error('Batas angka harus bernilai valid.');
   if(item.min!==undefined&&item.max!==undefined&&item.min>item.max)throw new Error('Batas minimum tidak boleh melebihi maksimum.');
   if(item.failureBelow!==undefined&&(item.min!==undefined&&item.failureBelow<item.min||item.max!==undefined&&item.failureBelow>item.max))throw new Error('Ambang gagal harus berada dalam rentang jawaban.');
   if((item.requireFailureReason||item.requireFailurePhoto)&&item.failureBelow===undefined)throw new Error('Tentukan ambang gagal angka sebelum mewajibkan bukti.');
  }else if(['min','max','failureBelow'].some(k=>item[k]!==undefined))throw new Error('Batas angka hanya berlaku pada tipe angka.');
  keys.add(item.key);return {...item,label:item.label.trim()};
 });
}
export const auditItems=values=>parseAuditItems(values?.SPV_AUDIT_ITEMS??DEFAULT_AUDIT_ITEMS);
export const auditFailed=(item,value)=>(item.type||'BOOLEAN')==='BOOLEAN'?value===false:item.type==='NUMBER'?Number.isFinite(value)&&item.failureBelow!==undefined&&value<item.failureBelow:item.type==='SELECT'?item.failedValues?.includes(value)===true:false;
export function auditAnswers(items,answers={},evidence=answers?._evidence||{}){
 const result={},proof={};let photoBytes=0;
 if(!answers||typeof answers!=='object'||Array.isArray(answers)||!evidence||typeof evidence!=='object'||Array.isArray(evidence))throw new Error('Format jawaban/bukti tidak valid.');
 for(const item of items){
  const value=answers[item.key],type=item.type||'BOOLEAN',blank=value===null||value===undefined||value==='';
  if(blank){if(item.required)throw new Error(`Jawab pertanyaan wajib: ${item.label}`);continue;}
  const valid=type==='BOOLEAN'?typeof value==='boolean':type==='TEXT'?typeof value==='string'&&value.trim().length>0&&value.length<=4000:type==='SELECT'?item.options.includes(value):Number.isFinite(value)&&(item.min===undefined||value>=item.min)&&(item.max===undefined||value<=item.max);
  if(!valid)throw new Error(`Jawaban tidak valid: ${item.label}`);
  result[item.key]=type==='TEXT'?value.trim():value;
  const entry=evidence[item.key]||{},failed=auditFailed(item,value);
  if(typeof entry!=='object'||Array.isArray(entry)||Object.keys(entry).some(k=>!['reason','photoUrl'].includes(k)))throw new Error(`Bukti tidak valid: ${item.label}`);
  if(entry.reason!==undefined&&(typeof entry.reason!=='string'||entry.reason.length>2000))throw new Error(`Alasan maksimal 2000 karakter: ${item.label}`);
  if(failed&&item.requireFailureReason&&!entry.reason?.trim())throw new Error(`Alasan kondisi gagal wajib: ${item.label}`);
  if(failed&&item.requireFailurePhoto&&!entry.photoUrl)throw new Error(`Foto kondisi gagal wajib: ${item.label}`);
  if(entry.photoUrl){
   if(typeof entry.photoUrl!=='string'||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(entry.photoUrl)||entry.photoUrl.length>2800000)throw new Error(`Foto JPEG/PNG/WebP maksimal 2 MB: ${item.label}`);
   photoBytes+=entry.photoUrl.length;
  }
  if(entry.reason?.trim()||entry.photoUrl)proof[item.key]={...(entry.reason?.trim()?{reason:entry.reason.trim()}:{}),...(entry.photoUrl?{photoUrl:entry.photoUrl}:{})};
 }
 if(photoBytes>11000000)throw new Error('Total bukti foto audit maksimal 8 MB.');
 if(Object.keys(proof).length)result._evidence=proof;
 return result;
}
