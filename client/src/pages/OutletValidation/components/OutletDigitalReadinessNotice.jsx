import React from 'react';
export function OutletDigitalReadinessNotice({readiness,adminAvailable=false}) {
 if(readiness.canConfirm)return null;
 return <section className="ov-notice ov-readiness" aria-label="Alasan konfirmasi Google belum tersedia">
  <strong>{adminAvailable?'Syarat standar belum terpenuhi · pertimbangan Admin tersedia':'Konfirmasi melalui Google belum tersedia'}</strong>
  <ul>{readiness.issues.map(issue=><li key={issue.code}><p><strong>{issue.message}</strong></p>{issue.details?.map(detail=><p key={detail}>{detail}</p>)}<p>{issue.action}</p></li>)}</ul>
  <p>Penjelasan ini berlaku untuk persetujuan baru melalui Google. Keputusan yang sudah disimpan dan bukti lapangan tetap tercatat.</p>
 </section>;
}
