import React from 'react';
import { stamp } from '../../OutletManagement/outletPresentation';

const labels = {
  name: 'Nama',
  address: 'Alamat',
  ownerName: 'Pemilik',
  phone: 'Telepon',
  latitude: 'Latitude',
  longitude: 'Longitude',
  taxType: 'Status pajak',
  taxNumber: 'NIK / NPWP',
  taxName: 'Nama dokumen',
  taxAddress: 'Alamat dokumen',
  visitDays: 'Hari kunjungan',
  visitIntervalWeeks: 'Interval minggu',
  channel: 'Channel',
  subChannel: 'Jenis outlet',
  area: 'Area',
  mappingLocation: 'Patokan',
  photoId: 'Referensi foto',
};

export function RegistrationRevisionHistory({ history = [] }) {
  const items = Array.isArray(history) ? history.filter((h) => h && typeof h === 'object') : [];
  if (!items.length) return null;

  return (
    <details className="outlet-disclosure">
      <summary>Riwayat revisi ({items.length})</summary>
      {items.map((h, i) => {
        const title =
          h.reason || h.note || (h.action === 'SUBMITTED' ? 'Pengajuan awal' : 'Revisi pengajuan');
        const meta = [h.at ? stamp(h.at) : null, h.actor?.name || h.actorName || 'Pengguna']
          .filter(Boolean)
          .join(' · ');
        const before = h.before && typeof h.before === 'object' ? h.before : {};
        const after = h.after && typeof h.after === 'object' ? h.after : {};
        const changedKeys = Object.keys(after);

        return (
          <article className="app-form" key={i}>
            <strong>{title}</strong>
            <small>{meta}</small>
            {h.rejectionNote ? <p>Catatan sebelumnya: {h.rejectionNote}</p> : null}
            {changedKeys.length > 0 ? (
              <dl className="outlet-facts">
                {changedKeys.map((k) => (
                  <React.Fragment key={k}>
                    <dt>{labels[k] || k}</dt>
                    <dd>
                      {after[k] !== null && typeof after[k] === 'object'
                        ? 'Referensi diperbarui'
                        : `${before[k] ?? 'Kosong'} → ${after[k] ?? 'Kosong'}`}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            ) : null}
          </article>
        );
      })}
    </details>
  );
}
