import React from 'react';
const KIND = {
  OTHER_SALES_SCHEDULED: 'Masih dijadwalkan untuk',
  DOUBLE_BOOKED: 'Terjadwal ganda untuk',
  TEMPLATE_OTHER_SALES: 'Template mingguan masih milik',
};
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export function ClusterImpactReview({ review }) {
  if (!review) return null;
  return (
    <section className="cluster-impact" aria-label="Dampak perubahan wilayah">
      <h3>Tinjau dampak perubahan</h3>
      <p>
        {review.moves.length} perpindahan outlet · {review.templates.length} referensi template ·{' '}
        {review.draftPlans.length} draft rencana · {review.publishedPjps.length} PJP terbit
        terdampak
      </p>
      {review.conflictCount > 0 && (
        <div role={review.blocked ? 'alert' : 'status'} className="admin-feedback error">
          <strong>
            {review.blocked
              ? 'Penempatan bertabrakan dengan jadwal lain'
              : 'Ada jadwal lain yang beririsan'}{' '}
            ({review.conflictCount})
          </strong>
          <ul>
            {review.conflicts.slice(0, 8).map((c) => (
              <li key={`${c.kind}:${c.outletId}:${c.date || c.dayOfWeek}:${c.weekType || ''}`}>
                {c.outletName} · {KIND[c.kind]} {c.salesName}
                {c.date ? ` pada ${c.date}` : ` (${DAYS[c.dayOfWeek]}, ${c.weekType})`}
              </li>
            ))}
          </ul>
          {review.blocked && (
            <p>
              Batalkan atau jadwalkan ulang jadwal tersebut di Jadwal kunjungan, atau ubah outlet
              yang dipilih, lalu tinjau ulang.
            </p>
          )}
        </div>
      )}
      {review.ownerChanged && (
        <p>
          Penanggung jawab wilayah berubah. Jadwal mendatang perlu ditinjau dengan penugasan
          terbaru.
        </p>
      )}
      {review.moves.length > 0 && (
        <ul>
          {review.moves.map((m) => (
            <li key={m.id}>
              <strong>{m.name}</strong>
              <span>
                {m.from} → {m.to}
              </span>
            </li>
          ))}
        </ul>
      )}
      {review.draftPlans.length > 0 && (
        <p>Draft yang perlu diperiksa: {review.draftPlans.map((p) => p.name).join(', ')}.</p>
      )}
      {review.publishedPjps.length > 0 && (
        <p className="app-notice">
          PJP yang telah diterbitkan tetap tersimpan. Koordinasikan penugasan yang beririsan sebelum
          menjalankan perubahan; revisi operasional memakai tindak lanjut rute.
        </p>
      )}
      <p className="admin-footnote">
        Menyimpan menerapkan perpindahan ini. Rute referensi terdampak dibersihkan; planner
        memeriksa ulang wilayah saat penerbitan.
      </p>
    </section>
  );
}
