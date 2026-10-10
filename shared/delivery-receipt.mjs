export const SIGNATURE_MAX_LENGTH=350000;
export function validReceiptSignature(value){
 return typeof value==='string'&&value.length<=SIGNATURE_MAX_LENGTH&&/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value);
}
export function deliveryReceiptError(status,data={},policy={}){
 const name=typeof data.recipientName==='string'?data.recipientName.trim():'';
 const signature=data.signatureDataUrl||'';
 if(status==='REJECTED')return name||signature?'Penolakan penuh tidak memakai bukti penerimaan.':null;
 const nameMode=policy.DELIVERY_RECIPIENT_MODE||'OPTIONAL',signatureMode=policy.DELIVERY_SIGNATURE_MODE||'DISABLED';
 if(nameMode==='DISABLED'&&name)return 'Nama penerima dinonaktifkan pada trip ini.';
 if(signatureMode==='DISABLED'&&signature)return 'Tanda tangan dinonaktifkan pada trip ini.';
 if(name.length>200)return 'Nama penerima maksimal 200 karakter.';
 if((nameMode==='REQUIRED'||signature)&&name.length<2)return 'Isi nama penerima minimal 2 karakter.';
 if(signatureMode==='REQUIRED'&&!signature)return 'Tanda tangan penerima wajib.';
 if(signature&&!validReceiptSignature(signature))return 'Tanda tangan harus berupa gambar PNG, maksimal 350 KB data.';
 return null;
}
