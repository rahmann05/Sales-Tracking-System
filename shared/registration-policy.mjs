export function registrationRevisionReadiness(row,values=row?.policySnapshot?.values||{},now=Date.now()){
 const count=Array.isArray(row?.revisionHistory)?row.revisionHistory.length:0;
 const limit=Number(values.REGISTRATION_MAX_REVISIONS||0),days=Number(values.REGISTRATION_REVISION_DAYS||0);
 const rejectedAt=Date.parse(row?.updatedAt),deadline=days>0&&Number.isFinite(rejectedAt)?rejectedAt+days*86400000:null;
 const issues=[];
 if(row?.registrationStatus!=='REJECTED')issues.push('Hanya pengajuan ditolak yang dapat diperbaiki.');
 if(values.REGISTRATION_ALLOW_REVISION===false)issues.push('Perbaikan tidak diizinkan oleh aturan pengajuan ini.');
 if(limit>0&&count>=limit)issues.push(`Batas ${limit} kali pengajuan ulang sudah tercapai.`);
 if(days>0&&deadline===null)issues.push('Waktu penolakan belum diketahui. Hubungi Admin sebelum mengajukan ulang.');
 if(deadline!==null&&now>deadline)issues.push(`Batas perbaikan berakhir pada ${new Date(deadline).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB.`);
 return {allowed:issues.length===0,issues,count,limit,deadline:deadline===null?null:new Date(deadline).toISOString()};
}
export function registrationLocation(data,required=true){
 const missing=value=>value===null||value===undefined||value==='';
 if(missing(data.latitude)&&missing(data.longitude)){
  if(required)throw new Error('Koordinat fisik outlet wajib diisi. Ambil GPS atau lengkapi titik sebelum melanjutkan.');
  return {latitude:null,longitude:null};
 }
 if(missing(data.latitude)||missing(data.longitude)||!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude)||Math.abs(data.latitude)>90||Math.abs(data.longitude)>180)throw new Error('Koordinat harus berpasangan, berupa angka sah dan berada dalam rentang lokasi.');
 return {latitude:data.latitude,longitude:data.longitude};
}
