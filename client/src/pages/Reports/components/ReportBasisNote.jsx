import React from 'react';

export function ReportBasisNote({ basis }) {
  if (!basis) return null;
  return <aside className="rounded-lg border border-border-glass p-3 text-xs space-y-1" aria-label="Dasar dan batas laporan">
    <p><strong>Dasar laporan:</strong> {basis.note}</p>
    {basis.archiveNote&&<p><strong>{basis.archiveNote}</strong></p>}
    {basis.legacyAssignmentRecords > 0 && <p>{basis.legacyAssignmentRecords} rencana/pengajuan kunjungan belum memiliki konteks penugasan historis.</p>}
    {basis.channelNote && <p>{basis.channelNote}</p>}
    {basis.calendarNote&&<p>{basis.calendarNote}</p>}
    {basis.calendarMonths&&<p>Kalender: {basis.calendarMonths.map(row=>`${row.month} · ${row.revision?`versi ${row.revision}`:'belum ditetapkan'}`).join('; ')}.</p>}
    {basis.targetNote && <p>{basis.targetNote}</p>}
    {basis.targetCoverage && <p>Target ditetapkan: {basis.targetCoverage.assigned}/{basis.targetCoverage.eligible} sales. {basis.targetCoverage.missing > 0 ? 'Target belum lengkap; persentase total belum dapat dinilai.' : ''}</p>}
    {basis.unverifiedChannelAmount > 0 && <p>Nilai tanpa klasifikasi historis: Rp {basis.unverifiedChannelAmount.toLocaleString('id-ID')}.</p>}
    <p>Dibuat: {new Date(basis.generatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.</p>
  </aside>;
}
