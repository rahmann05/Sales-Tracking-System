import React from 'react';

const dateLabel = value => {
 const date = value ? new Date(value) : null;
 return date && Number.isFinite(+date) ? `${date.toLocaleString('id-ID', {timeZone:'Asia/Jakarta'})} WIB` : 'Belum tersedia';
};

export function SalesExceptionDetail({row}) {
 const details = row.details || {};
 const asked = row.decision?.value === 'REQUIRES_CORRECTION';
 const sent = Boolean(details.clarification && details.clarification.requestAt === row.decision?.at);
 const shift = row.kind === 'SHIFT_TIME_RANGE';
 const reason = details.source === 'CONTINUE_NEXT_VISIT'
  ? 'Kunjungan berikutnya dimulai saat kunjungan ini belum memiliki absen keluar.'
  : shift
   ? 'Shift belum ditutup dan melewati batas waktu yang berlaku.'
   : row.kind === 'MISSING_OUT'
    ? 'Absen keluar belum tercatat ketika batas waktu kunjungan terlewati.'
    : 'Presensi ditandai untuk diperiksa oleh SPV.';
 return <div className="space-y-3 pt-3 text-sm">
  <p><strong>{shift ? 'Waktu shift perlu diperiksa' : row.kind === 'MISSING_OUT' ? 'Absen keluar kunjungan belum tercatat' : 'Presensi perlu diperiksa'}</strong></p>
  <p>{reason}</p>
  <dl className="grid gap-2 sm:grid-cols-2">
   {details.startedAt && <div><dt className="text-on-surface-variant">Mulai kunjungan</dt><dd>{dateLabel(details.startedAt)}</dd></div>}
   <div><dt className="text-on-surface-variant">Ditandai pada</dt><dd>{dateLabel(row.createdAt)}</dd></div>
  </dl>
  <p>{asked ? sent ? 'Penjelasan sudah dikirim. Tunggu pemeriksaan SPV.' : 'SPV meminta penjelasan. Isi formulir di bawah untuk menanggapi.' : 'Menunggu pemeriksaan SPV. Formulir penjelasan tersedia jika SPV meminta klarifikasi.'}</p>
  {row.decision?.note && <p>Catatan SPV: {row.decision.note}</p>}
  {details.clarification && <p>Penjelasan Anda: {details.clarification.note}</p>}
 </div>;
}
