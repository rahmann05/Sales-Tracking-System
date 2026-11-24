import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import React, { useState } from 'react';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { useOutletDirectory } from '../../OutletManagement/useOutletDirectory';
import { OutletReviewRequest } from '../../OutletManagement/OutletReviewRequest';
import { useApp } from '../../../context/AppContext';
import {
  canOpenOutletReview,
  outletIssues,
  OUTLET_ISSUE_LABELS,
} from '../../../../../shared/outlet-validation.mjs';
export function ValidationOutletPicker({ onClose, onSaved }) {
  const { user } = useApp(),
    limit = useFeaturePolicy('OUTLET_REVIEW').settings.OUTLET_REVIEW_BATCH_LIMIT || 30;
  const d = useOutletDirectory('reviewPick'),
    [selected, setSelected] = useState([]),
    [next, setNext] = useState(false);
  const eligible = d.data.filter(
    (o) =>
      !o.deletedAt &&
      (canOpenOutletReview(o, user) ||
        o.reviews?.some((r) => !['COMPLETED', 'CANCELLED'].includes(r.status)))
  );
  const toggle = (o) =>
    setSelected((p) =>
      p.some((x) => x.id === o.id)
        ? p.filter((x) => x.id !== o.id)
        : p.length < limit
          ? [...p, o]
          : p
    );
  const selectPagePick = () => {
    setSelected((prev) => {
      const merged = [...new Map([...prev, ...eligible].map((o) => [o.id, o])).values()];
      return merged.slice(0, limit);
    });
  };
  if (next)
    return (
      <OutletReviewRequest outlets={selected} onClose={() => setNext(false)} onSaved={onSaved} />
    );
  return (
    <NativeDialog
      open
      title="Pilih outlet untuk pemeriksaan"
      onClose={onClose}
      className="outlet-dialog"
    >
      <div className="app-form">
        <p className="outlet-muted">
          Pilih maksimal {limit} outlet.{' '}
          {user.role === 'SUPERVISOR'
            ? 'Supervisor hanya dapat memilih outlet berflag atau kasus terbuka.'
            : 'Admin dapat memeriksa semua outlet, termasuk tanpa flag.'}
        </p>
        <div className="ov-picker-filters">
          <label className="app-field">
            Cari outlet
            <input
              type="search"
              value={d.search}
              onChange={(e) => d.setSearch(e.target.value)}
              placeholder="Nama, kode, alamat"
            />
          </label>
          <label className="app-field">
            Wilayah cluster
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
            Kualitas data
            <select value={d.quality || 'ALL'} onChange={(e) => d.setQuality(e.target.value)}>
              <option value="ALL">Semua outlet</option>
              <option value="FLAGGED">Perlu diperiksa (berflag)</option>
              <option value="MISSING_POINT">Tanpa titik GPS</option>
              <option value="UNASSIGNED_CLUSTER">Belum berwilayah</option>
            </select>
          </label>
        </div>
        {d.error && (
          <p className="app-error" role="alert">
            {d.error}
          </p>
        )}
        <div className="outlet-picker-toolbar">
          <span>
            <strong>{selected.length}</strong> / {limit} dipilih
          </span>
          <div className="app-actions">
            {eligible.length > 0 && (
              <button
                type="button"
                className="app-button"
                disabled={selected.length >= limit}
                onClick={selectPagePick}
              >
                Pilih halaman ({eligible.length})
              </button>
            )}
            {selected.length > 0 && (
              <button type="button" className="app-button" onClick={() => setSelected([])}>
                Kosongkan
              </button>
            )}
          </div>
        </div>
        <div className="outlet-picker-list">
          {eligible.map((o) => {
            const flags = outletIssues(o);
            return (
              <label key={o.id} className="outlet-picker-row">
                <input
                  type="checkbox"
                  checked={selected.some((s) => s.id === o.id)}
                  disabled={selected.length >= limit && !selected.some((s) => s.id === o.id)}
                  onChange={() => toggle(o)}
                />
                <span>
                  <strong>{o.name}</strong>
                  <small>
                    {o.outletCode || 'Tanpa kode'} · {o.cluster?.name || 'Belum berwilayah'}
                  </small>
                  <small>{o.address}</small>
                  {flags.length > 0 && (
                    <small className="ov-picker-flags">
                      {flags.map((f) => OUTLET_ISSUE_LABELS[f]).join(' · ')}
                    </small>
                  )}
                </span>
              </label>
            );
          })}
          {d.loading && <p role="status">Memuat outlet…</p>}
          {!d.loading && !eligible.length && (
            <p className="p-4 text-center outlet-muted">Tidak ada outlet sesuai filter.</p>
          )}
        </div>
        <div className="outlet-pagination">
          <button
            type="button"
            className="app-button"
            disabled={d.page <= 1 || d.loading}
            onClick={() => d.setPage(d.page - 1)}
          >
            Sebelumnya
          </button>
          <span>
            {d.page} / {d.pagination.totalPages}
          </span>
          <button
            type="button"
            className="app-button"
            disabled={d.page >= d.pagination.totalPages || d.loading}
            onClick={() => d.setPage(d.page + 1)}
          >
            Berikutnya
          </button>
        </div>
        <footer className="outlet-form-footer">
          <span>{selected.length} outlet dipilih</span>
          <button
            type="button"
            className="app-button app-button-primary"
            disabled={!selected.length}
            onClick={() => setNext(true)}
          >
            Lanjut · alasan pemeriksaan
          </button>
        </footer>
      </div>
    </NativeDialog>
  );
}
