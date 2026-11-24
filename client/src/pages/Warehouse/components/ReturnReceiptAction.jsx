import { useApp } from '../../../context/AppContext';
import { unitDescription } from '../../../../../shared/product-units.mjs';
import React, { useState, useRef, useEffect } from 'react';
import { deliveryApi } from '../../../services/api';
import { useUnsavedNavigation } from '../../../shared/hooks/useUnsavedNavigation';

const returnNotePresets = [
  'Seluruh barang tolakan kembali utuh dan layak kirim ulang',
  'Sebagian kemasan rusak/penyok, dipisahkan dari stok layak kirim',
  'Terdapat selisih jumlah fisik saat serah terima retur di gudang',
];

export function ReturnReceiptAction({ stop, onReceived, assignment }) {
  const { user } = useApp();
  const [note, setNote] = useState(''),
    [received, setReceived] = useState(''),
    [reusable, setReusable] = useState(''),
    [items, setItems] = useState({}),
    [invoices, setInvoices] = useState({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const errorRef = useRef(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  useUnsavedNavigation(
    !stop.returnInspection &&
      Boolean(
        note ||
        received !== '' ||
        reusable !== '' ||
        Object.keys(items).length ||
        Object.keys(invoices).length
      ),
    busy
  );
  if (!(stop.rejectedCartons > 0)) return null;
  if (stop.returnInspection)
    return (
      <p className="text-sm">
        Retur diperiksa: {stop.returnInspection.receivedCartons} karton diterima fisik;{' '}
        {stop.reusableCartons} layak kirim ulang. {stop.returnNote}
      </p>
    );
  if (assignment?.ownerId && assignment.ownerId !== user?.id && user?.role !== 'ADMIN')
    return (
      <p className="admin-footnote">
        Pemeriksaan ditugaskan kepada {assignment.ownerName}. Alihkan penugasan bila perlu.
      </p>
    );
  const invoiceRows = stop.rejectedInvoices || [];
  const invoiceSum = invoiceRows.reduce(
    (sum, inv) => sum + Number(invoices[inv.invoiceId] || 0),
    0
  );
  const submit = async (e) => {
    e.preventDefault();
    if (invoiceRows.length > 0 && invoiceSum !== Number(reusable)) {
      setError(
        `Total karton layak kirim per faktur (${invoiceSum}) harus sama dengan karton layak kirim ulang (${reusable || 0}).`
      );
      return;
    }
    if (
      !window.confirm(
        `Simpan pemeriksaan retur ${stop.outlet?.name || ''}: ${received} karton diterima fisik, ${reusable} layak kirim ulang?`
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await deliveryApi.receiveReturn(stop.id, {
        note,
        receivedCartons: Number(received),
        reusableCartons: Number(reusable),
        items: (stop.rejectedItems || []).map((i) => ({
          lineId: i.lineId,
          received: Number(items[i.lineId]?.received || 0),
          reusable: Number(items[i.lineId]?.reusable || 0),
        })),
        reusableInvoices: Object.entries(invoices)
          .filter(([, v]) => Number(v) > 0)
          .map(([invoiceId, v]) => ({ invoiceId, cartons: Number(v) })),
      });
      window.dispatchEvent(new CustomEvent('operational-data-changed'));
      window.dispatchEvent(new Event('delivery:changed'));
      await onReceived();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <details open className="border rounded-xl p-3">
      <summary className="min-h-11 cursor-pointer font-bold">
        Pemeriksaan retur · {stop.rejectedCartons} karton ditolak
      </summary>
      <form onSubmit={submit} className="space-y-3 pt-2">
        <p className="text-sm">
          Isi jumlah yang benar-benar kembali dan layak dikirim ulang. Selisih atau barang tidak
          layak akan menjadi tindak lanjut.
        </p>
        <fieldset disabled={busy} className="space-y-3">
          <div className="logistics-preset-chips">
            <button
              type="button"
              className="logistics-preset-chip"
              onClick={() => {
                const all = String(stop.rejectedCartons);
                const nextItems = {};
                for (const row of stop.rejectedItems || []) {
                  nextItems[row.lineId] = {
                    received: String(row.quantity),
                    reusable: String(row.quantity),
                  };
                }
                const nextInvoices = {};
                for (const inv of stop.rejectedInvoices || []) {
                  nextInvoices[inv.invoiceId] = String(inv.cartons);
                }
                setReceived(all);
                setReusable(all);
                setItems(nextItems);
                setInvoices(nextInvoices);
                if (!note.trim()) setNote(returnNotePresets[0]);
                setError('');
              }}
            >
              Semua kembali utuh &amp; layak
            </button>
            <button
              type="button"
              className="logistics-preset-chip"
              onClick={() => {
                const all = String(stop.rejectedCartons);
                const nextItems = {};
                for (const row of stop.rejectedItems || []) {
                  nextItems[row.lineId] = {
                    received: String(row.quantity),
                    reusable: '0',
                  };
                }
                const nextInvoices = {};
                for (const inv of stop.rejectedInvoices || []) {
                  nextInvoices[inv.invoiceId] = '0';
                }
                setReceived(all);
                setReusable('0');
                setItems(nextItems);
                setInvoices(nextInvoices);
                if (!note.trim()) setNote(returnNotePresets[1]);
                setError('');
              }}
            >
              Semua fisik kembali, rusak / tidak layak
            </button>
          </div>
          <label className="block">
            Karton diterima fisik
            <input
              type="number"
              required
              min="0"
              step="1"
              max={stop.rejectedCartons}
              className="form-input block w-full"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
            />
          </label>
          <label className="block">
            Karton layak kirim ulang
            <input
              type="number"
              required
              min="0"
              step="1"
              max={received || 0}
              className="form-input block w-full"
              value={reusable}
              onChange={(e) => {
                const next = e.target.value;
                setReusable(next);
                if (invoiceRows.length === 1) {
                  setInvoices({ [invoiceRows[0].invoiceId]: next });
                }
              }}
            />
          </label>
          {(stop.rejectedItems || []).map((i) => (
            <fieldset className="border rounded p-3" key={i.lineId}>
              <legend>
                {stop.packingList?.items?.find((p) => p.lineId === i.lineId)?.name || 'Item retur'}{' '}
                · Ditolak {i.quantity}{' '}
                {unitDescription(stop.packingList?.items?.find((p) => p.lineId === i.lineId))}
              </legend>
              {['received', 'reusable'].map((k) => (
                <label className="block" key={k}>
                  {k === 'received' ? 'Diterima fisik' : 'Layak kirim ulang'}
                  <input
                    type="number"
                    min="0"
                    step="1"
                    max={k === 'received' ? i.quantity : items[i.lineId]?.received || 0}
                    required
                    className="form-input block w-full"
                    value={items[i.lineId]?.[k] ?? ''}
                    onChange={(e) =>
                      setItems({
                        ...items,
                        [i.lineId]: { ...items[i.lineId], [k]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
            </fieldset>
          ))}
          {invoiceRows.map((i) => (
            <label key={i.invoiceId} className="block">
              Karton layak kirim faktur{' '}
              {stop.packingList?.invoices?.find((v) => v.id === i.invoiceId)?.invoiceNumber ||
                i.invoiceId}
              <input
                type="number"
                min="0"
                step="1"
                max={i.cartons}
                required
                value={invoices[i.invoiceId] ?? ''}
                className="form-input block w-full"
                onChange={(e) => setInvoices({ ...invoices, [i.invoiceId]: e.target.value })}
              />
            </label>
          ))}
          {invoiceRows.length > 0 && (
            <p
              className={`text-xs font-semibold ${invoiceSum === Number(reusable || 0) ? 'text-emerald-700' : 'text-amber-800'}`}
            >
              Total layak kirim per faktur: {invoiceSum} / {reusable || 0} karton
            </p>
          )}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-on-surface-variant">
              Pilih catatan cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {returnNotePresets.map((preset) => (
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
            Catatan pemeriksaan / alasan selisih
            <textarea
              required
              maxLength={2000}
              className="form-input block w-full"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button type="submit" className="min-h-11 px-4 bg-primary text-on-primary rounded-xl">
            {busy ? 'Menyimpan…' : 'Simpan hasil pemeriksaan'}
          </button>
        </fieldset>
        {error && (
          <p ref={errorRef} tabIndex={-1} role="alert" className="text-red-600">
            {error}
          </p>
        )}
      </form>
    </details>
  );
}
