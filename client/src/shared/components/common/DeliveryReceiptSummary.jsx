import React from 'react';
export function DeliveryReceiptSummary({stop}){
 const proof=stop.receiptEvidence;
 if(!proof)return null;
 return <section className="rounded-xl border border-border-glass p-3 space-y-2" aria-label="Bukti penerima barang"><p>Penerima: <strong>{proof.recipientName}</strong></p><small>Dicatat {new Date(proof.recordedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}</small>{proof.signatureDataUrl&&<details><summary>Lihat tanda tangan penerima</summary><img className="bg-white rounded-xl max-w-full w-96" src={proof.signatureDataUrl} alt={`Tanda tangan ${proof.recipientName}`}/></details>}</section>;
}
