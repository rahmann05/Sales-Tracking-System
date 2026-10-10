export const EVIDENCE_IMAGE_DEFAULTS={EVIDENCE_IMAGE_MAX_KB:2000,EVIDENCE_IMAGE_FORMATS:'JPEG,PNG,WEBP',EVIDENCE_ALLOW_REMOTE_IMAGES:true};
export const EVIDENCE_IMAGE_KEYS=Object.keys(EVIDENCE_IMAGE_DEFAULTS);
const mime={JPEG:'image/jpeg',PNG:'image/png',WEBP:'image/webp'};
export function evidenceImageFormats(value=EVIDENCE_IMAGE_DEFAULTS.EVIDENCE_IMAGE_FORMATS){
 if(typeof value!=='string')throw new Error('Format foto harus daftar JPEG, PNG, WEBP dipisahkan koma');
 const formats=value.split(',').map(v=>v.trim());
 if(!formats.length||formats.some(f=>!mime[f])||new Set(formats).size!==formats.length)throw new Error('Pilih format unik JPEG, PNG, WEBP; minimal satu format');
 return formats;
}
export function evidenceImageError(value,values={},label='Foto'){
 if(value===null||value===undefined||value==='')return null;
 if(typeof value!=='string')return `${label}: bukti harus berupa gambar atau URL foto.`;
 const settings={...EVIDENCE_IMAGE_DEFAULTS,...values},limit=settings.EVIDENCE_IMAGE_MAX_KB*1024;
 if(!value.startsWith('data:')){
  if(settings.EVIDENCE_ALLOW_REMOTE_IMAGES===false)return `${label}: tautan foto eksternal tidak diizinkan. Ambil atau unggah gambar.`;
  try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||value.length>2048)throw new Error();return null;}catch{return `${label}: URL foto tidak valid; gunakan HTTP/HTTPS atau gambar.`;}
 }
 const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
 if(!match||match[2].length%4!==0)return `${label}: gunakan gambar JPEG/PNG/WebP dengan encoding base64 yang valid.`;
 // Check the final quartet too: a valid header alone must not hide malformed padding.
 try{const tail=match[2].slice(-4);if(btoa(atob(tail))!==tail)throw new Error();}catch{return `${label}: encoding gambar tidak valid.`;}
 const [,type,encoded]=match,bytes=encoded.length/4*3-(encoded.endsWith('==')?2:encoded.endsWith('=')?1:0);
 if(bytes<=0||bytes>limit)return `${label}: ukuran gambar maksimal ${settings.EVIDENCE_IMAGE_MAX_KB} KB.`;
 if(!evidenceImageFormats(settings.EVIDENCE_IMAGE_FORMATS).some(f=>mime[f]===type))return `${label}: format diizinkan ${settings.EVIDENCE_IMAGE_FORMATS}.`;
 let head;try{head=atob(encoded.slice(0,44));}catch{return `${label}: encoding gambar tidak valid.`;}
 const starts=prefix=>prefix.every((b,i)=>head.charCodeAt(i)===b);
 const valid=type==='image/jpeg'?starts([255,216,255]):type==='image/png'?starts([137,80,78,71,13,10,26,10]):head.slice(0,4)==='RIFF'&&head.slice(8,12)==='WEBP';
 return valid?null:`${label}: isi berkas tidak sesuai format gambar ${type}. Ambil atau unggah ulang.`;
}
