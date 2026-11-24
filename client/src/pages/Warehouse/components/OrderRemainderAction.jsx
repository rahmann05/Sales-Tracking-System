import React, { useState } from 'react';
import { ordersApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { canOrderOperation } from '../../../../../shared/order-operation-permissions.mjs';
export function OrderRemainderAction({ order, onChanged }) {
  const { user } = useApp();
  const [quantities, setQuantities] = useState({}),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const lines = order.fulfillmentLines.filter((i) => i.unpacked > 0);
  if (!canOrderOperation(user, 'CANCEL_REMAINDER') || order.status !== 'APPROVED' || !lines.length)
    return null;
  const submit = async (e) => {
    e.preventDefault();
    const selected = lines
      .map((i) => ({ id: i.id, quantity: Number(quantities[i.id] || 0) }))
      .filter((i) => i.quantity > 0);
    if (!selected.length) {
      setError('Isi jumlah sisa yang dibatalkan.');
      return;
    }
    if (
      !window.confirm(
        `Batalkan sisa ${selected.length} item pada order ${order.code || ''} atas konfirmasi pelanggan? Tindakan tidak dapat dibatalkan.`
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await ordersApi.cancelRemainder(order.id, { note, lines: selected });
      await onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="border rounded-xl p-3">
      <summary className="cursor-pointer min-h-11">
        Batalkan sisa order atas konfirmasi pelanggan
      </summary>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm">
          Hanya jumlah yang belum dipacking dapat dibatalkan. Jumlah dipesan dan diterima tetap
          tersimpan; alasan pembatalan masuk riwayat.
        </p>
        <fieldset disabled={busy} className="space-y-3">
          <button
            type="button"
            className="admin-button"
            onClick={() =>
              setQuantities(Object.fromEntries(lines.map((i) => [i.id, String(i.unpacked)])))
            }
          >
            Isi semua sisa belum dipacking
          </button>
          {lines.map((i) => (
            <label className="block" key={i.id}>
              {i.product?.name} · Maksimal {i.unpacked}
              <input
                className="form-input block w-full"
                type="number"
                min="0"
                max={i.unpacked}
                step="1"
                value={quantities[i.id] || ''}
                onChange={(e) => setQuantities({ ...quantities, [i.id]: e.target.value })}
              />
            </label>
          ))}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-on-surface-variant">
              Pilih alasan cepat pembatalan sisa:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Pelanggan membatalkan sisa pesanan',
                'Toko tidak memesan ulang sisa barang yang tertunda',
                'Penyesuaian pemenuhan sesuai konfirmasi Sales & Admin',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="px-2.5 py-1.5 min-h-[36px] text-xs rounded-lg border border-border-glass bg-surface hover:bg-surface-variant cursor-pointer"
                  onClick={() => setNote(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            Alasan / konfirmasi pelanggan
            <textarea
              required
              maxLength={2000}
              className="form-input block w-full"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="min-h-11 rounded-xl px-4 bg-rose-600 text-white font-semibold hover:bg-rose-700"
          >
            {busy ? 'Menyimpan…' : 'Simpan pembatalan sisa'}
          </button>
        </fieldset>
        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
      </form>
    </details>
  );
}
