import { OutletQualityFlag } from './OutletQualityFlag';
import React from 'react';
import { reviewLabels } from './outletPresentation';
import { canOpenOutletReview } from '../../../../shared/outlet-validation.mjs';

const QUALITY_PILLS = [
  ['ALL', 'Semua'],
  ['FLAGGED', 'Perlu diperiksa'],
  ['MISSING_POINT', 'Tanpa titik GPS'],
  ['UNASSIGNED_CLUSTER', 'Belum berwilayah'],
  ['IN_REVIEW', 'Sedang divalidasi'],
  ['VERIFIED', 'Terverifikasi'],
];

export function OutletDirectory({
  directory: d,
  selected,
  onSelect,
  user,
  canBatchValidate = false,
  batchLimit = 30,
  selectedBatchIds = [],
  onToggleBatch,
  onSelectPageBatch,
  onClearBatch,
  onOpenBatch,
}) {
  const pageEligible = canBatchValidate
    ? d.data.filter(
        (o) =>
          !o.deletedAt &&
          (canOpenOutletReview(o, user) ||
            o.reviews?.some((r) => !['COMPLETED', 'CANCELLED'].includes(r.status)))
      )
    : [];
  return (
    <section className="outlet-panel" aria-label="Direktori outlet">
      <div className="outlet-toolbar">
        <label className="app-field">
          <span>Cari outlet</span>
          <input
            type="search"
            value={d.search}
            onChange={(e) => d.setSearch(e.target.value)}
            placeholder="Nama, kode, alamat atau kontak"
          />
        </label>
        <label className="app-field">
          <span>Wilayah</span>
          <select value={d.cluster} onChange={(e) => d.setCluster(e.target.value)}>
            <option value="">Semua wilayah</option>
            {d.clusters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="app-field">
          <span>Channel</span>
          <select value={d.channel || ''} onChange={(e) => d.setChannel(e.target.value)}>
            <option value="">Semua channel</option>
            <option value="GENERAL_TRADE">General Trade</option>
            <option value="MODERN_TRADE">Modern Trade</option>
          </select>
        </label>
        <label className="app-field">
          <span>Status</span>
          <select value={d.status} onChange={(e) => d.setStatus(e.target.value)}>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
            <option value="ALL">Semua</option>
          </select>
        </label>
      </div>
      <div className="outlet-filter-pills" role="group" aria-label="Saring kualitas dan wilayah">
        {QUALITY_PILLS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="outlet-pill"
            aria-pressed={(d.quality || 'ALL') === key}
            onClick={() => d.setQuality(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="outlet-list-heading">
        <span role="status" aria-atomic="true">
          {d.loading ? 'Memuat direktori…' : `${d.pagination.total} outlet ditemukan`}
        </span>
        <div className="app-actions">
          {canBatchValidate && pageEligible.length > 0 && onSelectPageBatch && (
            <button
              type="button"
              className="app-button"
              disabled={d.loading || selectedBatchIds.length >= batchLimit}
              onClick={() => onSelectPageBatch(pageEligible)}
            >
              Pilih halaman ({pageEligible.length})
            </button>
          )}
          <button type="button" className="app-button" onClick={d.load} disabled={d.loading}>
            Perbarui
          </button>
        </div>
      </div>
      {canBatchValidate && selectedBatchIds.length > 0 && (
        <div className="outlet-bulk-bar" role="region" aria-label="Aksi batch validasi">
          <span>
            <strong>{selectedBatchIds.length}</strong> / {batchLimit} outlet dipilih untuk validasi
          </span>
          <div className="app-actions">
            <button type="button" className="app-button" onClick={onClearBatch}>
              Kosongkan
            </button>
            <button type="button" className="app-button app-button-primary" onClick={onOpenBatch}>
              Validasi / Batch Google
            </button>
          </div>
        </div>
      )}
      {d.error ? (
        <div className="app-error" role="alert">
          {d.error}
          <button type="button" className="app-button" onClick={d.load}>
            Coba lagi
          </button>
        </div>
      ) : (
        <div
          className="outlet-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Tabel direktori outlet"
        >
          <table className="outlet-table">
            <thead>
              <tr>
                {canBatchValidate && <th aria-label="Pilih batch">Pilih</th>}
                <th>Outlet</th>
                <th>Wilayah / Sales</th>
                <th>Status / kualitas data</th>
              </tr>
            </thead>
            <tbody>
              {d.data.map((o) => {
                const eligibleForBatch =
                  canBatchValidate &&
                  !o.deletedAt &&
                  (canOpenOutletReview(o, user) ||
                    o.reviews?.some((r) => !['COMPLETED', 'CANCELLED'].includes(r.status)));
                const isChecked = selectedBatchIds.includes(o.id);
                const unassignedCluster = !o.clusterId || o.cluster?.name === 'Belum Ditugaskan';
                return (
                  <tr key={o.id} aria-selected={selected === o.id}>
                    {canBatchValidate && (
                      <td data-label="Pilih batch">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${o.name} untuk batch validasi`}
                          checked={isChecked}
                          disabled={
                            !eligibleForBatch ||
                            (!isChecked && selectedBatchIds.length >= batchLimit)
                          }
                          onChange={() => onToggleBatch?.(o)}
                        />
                      </td>
                    )}
                    <td data-label="Outlet">
                      <button type="button" className="outlet-name" onClick={() => onSelect(o.id)}>
                        {o.name}
                      </button>
                      <small>
                        {o.outletCode || 'Kode belum tersedia'} ·{' '}
                        {o.channel === 'MODERN_TRADE' ? 'MT' : 'GT'}
                      </small>
                      <p>{o.address}</p>
                    </td>
                    <td data-label="Wilayah / Sales">
                      {unassignedCluster ? (
                        <span className="outlet-badge outlet-badge-warning">Belum Ditugaskan</span>
                      ) : (
                        <strong>{o.cluster?.name}</strong>
                      )}
                      <small>{o.cluster?.assignedSales?.name || 'Sales belum ditugaskan'}</small>
                    </td>
                    <td data-label="Status / kualitas data">
                      <OutletQualityFlag outlet={o} />
                      <span className="outlet-badge">{o.deletedAt ? 'Nonaktif' : 'Aktif'}</span>
                      {o.reviews?.[0] && (
                        <small>Pemeriksaan: {reviewLabels[o.reviews[0].status]}</small>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!d.data.length && !d.loading && (
                <tr>
                  <td colSpan={canBatchValidate ? 4 : 3}>
                    <p className="app-empty">Tidak ada outlet sesuai filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="outlet-pagination">
        <button
          type="button"
          className="app-button"
          disabled={d.loading || d.page <= 1}
          onClick={() => d.setPage(d.page - 1)}
        >
          Sebelumnya
        </button>
        <span>
          {d.page} / {d.pagination.totalPages || 1}
        </span>
        <button
          type="button"
          className="app-button"
          disabled={d.loading || d.page >= d.pagination.totalPages}
          onClick={() => d.setPage(d.page + 1)}
        >
          Berikutnya
        </button>
      </div>
    </section>
  );
}
