export const REGISTRATION_FIELDS={ownerName:'Pemilik / penanggung jawab',phone:'Nomor telepon',mappingLocation:'Patokan lokasi',subAreaKecamatan:'Kecamatan',kelurahan:'Kelurahan',taxName:'Nama pada dokumen identitas',taxNumber:'NIK / NPWP',taxAddress:'Alamat dokumen identitas'};
export function requiredRegistrationFields(value=''){
 if(typeof value!=='string')throw new Error('Persyaratan field harus daftar pilihan yang valid.');
 const keys=value.split(',').map(key=>key.trim()).filter(Boolean);
 if(keys.some(key=>!Object.hasOwn(REGISTRATION_FIELDS,key))||new Set(keys).size!==keys.length)throw new Error('Persyaratan field berisi pilihan tidak valid atau berulang.');
 return keys;
}
export function registrationFieldError(data,required='',stage='pengajuan'){
 const missing=requiredRegistrationFields(required).filter(key=>typeof data[key]!=='string'||!data[key].trim());
 return missing.length?`Lengkapi data wajib saat ${stage}: ${missing.map(key=>REGISTRATION_FIELDS[key]).join(', ')}.`:null;
}
