export const REGISTRATION_FIELDS={ownerName:'Pemilik / penanggung jawab',phone:'Nomor telepon',mappingLocation:'Patokan lokasi',subAreaKecamatan:'Kecamatan',kelurahan:'Kelurahan',taxName:'Nama pada dokumen identitas',taxNumber:'NIK / NPWP',taxAddress:'Alamat dokumen identitas',address2:'Alamat tambahan 2',address3:'Alamat tambahan 3',area:'Area',city:'Kota / kabupaten',bankAccountInfo:'Informasi rekening (catatan eksternal)',outletKnownBy:'Sumber pengenalan outlet',visitDays:'Hari kunjungan yang direncanakan'};
export const MASTER_OUTLET_FIELDS={ownerName:'Pemilik / penanggung jawab',phone:'Nomor telepon',taxName:'Nama pada dokumen identitas',taxNumber:'NIK / NPWP',taxAddress:'Alamat dokumen identitas',itineraryCode:'Interval F1/F2/F4'};
export function requiredRegistrationFields(value='',allowed=REGISTRATION_FIELDS){
 if(typeof value!=='string')throw new Error('Persyaratan field harus daftar pilihan yang valid.');
 const keys=value.split(',').map(key=>key.trim()).filter(Boolean);
 if(keys.some(key=>!Object.hasOwn(allowed,key))||new Set(keys).size!==keys.length)throw new Error('Persyaratan field berisi pilihan tidak valid atau berulang.');
 return keys;
}
export function registrationFieldError(data,required='',stage='pengajuan',allowed=REGISTRATION_FIELDS){
 if(data.visitDays&&(!Array.isArray(data.visitDays)||data.visitDays.length)){const days=Array.isArray(data.visitDays)?data.visitDays:typeof data.visitDays==='string'?data.visitDays.split(',').map(d=>d.trim()).filter(Boolean):[];if(!days.length||days.some(d=>!VISIT_DAY_CODES.includes(d))||new Set(days).size!==days.length)return 'Hari kunjungan harus SENIN sampai MINGGU dan tidak berulang.';}
 const missing=requiredRegistrationFields(required,allowed).filter(key=>key==='visitDays'?!(Array.isArray(data[key])?data[key].length:typeof data[key]==='string'&&data[key].trim()):typeof data[key]!=='string'||!data[key].trim());
 return missing.length?`Lengkapi data wajib saat ${stage}: ${missing.map(key=>allowed[key]).join(', ')}.`:null;
}
export const VISIT_DAY_CODES=['SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU','MINGGU'];
export function registrationSupplement(fields){
 const result={};
 for(const [key,raw] of Object.entries(fields)){
  if(!Object.hasOwn(REGISTRATION_FIELDS,key)||typeof raw!=='string'||raw.length>2000)throw new Error('Data pelengkap aktivasi tidak valid.');
  const value=raw.trim();
  if(key==='visitDays'){const days=value.split(',').map(d=>d.trim()).filter(Boolean);if(!days.length||days.some(d=>!VISIT_DAY_CODES.includes(d))||new Set(days).size!==days.length)throw new Error('Hari kunjungan harus kode SENIN sampai MINGGU, dipisahkan koma dan tidak berulang.');result[key]=days.join(',');}
  else result[key]=value;
 }
 return result;
}
