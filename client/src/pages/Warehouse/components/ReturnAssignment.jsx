import React, { useState } from 'react';
import { deliveryApi } from '../../../services/api';
import { warehouseStaffEligible } from '../../../../../shared/warehouse-policy.mjs';

const returnAssignPresets = [
  'Pembagian beban pemeriksaan barang kembali',
  'Pemeriksa awal berhalangan / pergantian shift',
  'Perlu pemeriksaan khusus kondisi produk retur',
];

const formatWibInput = (iso) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(iso))
    .replace(' ', 'T');
};

export function ReturnAssignment({ stop, task, people, canManage = true, onChanged }) {
  const [ownerId, setOwnerId] = useState(task?.ownerId || ''),
    [due, setDue] = useState(() => formatWibInput(task?.dueAt)),
    [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (!canManage || !(stop.rejectedCartons > 0) || stop.returnInspection) return null;
  const eligible = people.filter((p) => warehouseStaffEligible(p, 'can_monitor_delivery')),
    invalidOwner = Boolean(ownerId && !eligible.some((p) => p.id === ownerId));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await deliveryApi.assignReturn(stop.id, {
        revision: task?.revision || 0,
        ownerId: ownerId || null,
        dueAt: due ? new Date(`${due}:00+07:00`).toISOString() : null,
        reason,
      });
      setReason('');
      await onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="admin-trip-history">
      <summary>
        Alihkan pemeriksaan barang kembali (opsional) · {task?.ownerName || 'Tim gudang'}
      </summary>
      <p>
        Tim gudang dapat langsung memeriksa barang. Pilih petugas khusus hanya bila perlu membagi
        pekerjaan.
      </p>
      <form className="app-form" onSubmit={save}>
        <label className="app-field">
          Petugas pemeriksa
          <select value={ownerId} disabled={busy} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Antrean gudang</option>
            {invalidOwner && (
              <option disabled value={ownerId}>
                {task?.ownerName || 'PIC sebelumnya'} · Tidak memenuhi izin
              </option>
            )}
            {eligible.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {invalidOwner && (
          <p role="status">
            Pilih pemeriksa aktif yang berwenang atau kembalikan tugas ke antrean gudang.
          </p>
        )}
        <label className="app-field">
          Tenggat WIB
          <input
            type="datetime-local"
            value={due}
            disabled={busy}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-on-surface-variant">
            Pilih alasan cepat:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {returnAssignPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                className="px-2.5 py-1.5 min-h-[36px] text-xs rounded-lg border border-border-glass bg-surface hover:bg-surface-variant cursor-pointer"
                onClick={() => setReason(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <label className="app-field">
          Alasan penugasan
          <textarea
            required
            minLength={5}
            maxLength={2000}
            value={reason}
            disabled={busy}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="app-button"
          disabled={busy || invalidOwner || reason.trim().length < 5}
        >
          {busy ? 'Menyimpan…' : 'Tetapkan pemeriksa retur'}
        </button>
        {error && (
          <p className="app-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </details>
  );
}
