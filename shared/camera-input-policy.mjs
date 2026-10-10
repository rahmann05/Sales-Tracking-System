export const CAMERA_INPUT_LABELS={CAMERA:'Kamera langsung atau kamera bawaan',LIVE_CAMERA:'Kamera langsung saja',NATIVE_CAMERA:'Kamera bawaan saja',CAMERA_OR_UPLOAD:'Kamera atau unggah gambar'};
export function cameraInputPolicy(value='CAMERA'){
 const mode=Object.hasOwn(CAMERA_INPUT_LABELS,value)?value:'CAMERA';
 return {mode,live:mode!=='NATIVE_CAMERA',native:mode!=='LIVE_CAMERA',upload:mode==='CAMERA_OR_UPLOAD'};
}
export function imageFileError(file){
 if(!file)return null;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))return 'Pilih gambar JPEG, PNG atau WebP.';
 if(!Number.isFinite(file.size)||file.size<=0||file.size>12*1024*1024)return 'Ukuran gambar harus lebih dari nol dan maksimal 12 MB.';
 return null;
}
