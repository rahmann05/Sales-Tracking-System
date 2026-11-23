import { useDomainPermission } from '../../../shared/hooks/useDomainPermission';
import React, { useState } from 'react';
import { invoiceReconciliation } from '../../../../../shared/invoice-reconciliation.mjs';
import { deliveryApi } from '../../../services/api';
import { InvoiceCorrectionForm } from './InvoiceCorrectionForm';
const labels = {
  NO_INVOICE: 'Faktur tidak dilampirkan; diizinkan aturan dokumen',
  RECEIPT_DIFFERENCE: 'Hasil penerimaan tidak sesuai jumlah packing',
  UNMAPPED: 'Barang faktur belum dipetakan',
  UNPRICED: 'Harga / nominal / pajak belum lengkap',
  AMOUNT_DIFFERENCE: 'Nominal faktur berbeda',
  IN_PROGRESS: 'Pengiriman / retur belum tuntas',
  STALE: 'Hasil berubah; perlu konfirmasi ulang',
  NEEDS_ALLOCATION: 'Perlu pembagian penerimaan per faktur',
  RECONCILED: 'Jumlah dan nominal terverifikasi',
};
const money = (v) => (v == null ? 'Belum terverifikasi' : `Rp ${v.toLocaleString('id-ID')}`);
export function InvoiceReconciliationPanel({ packing, admin, onChanged }) {
  const canCorrect = useDomainPermission('INVOICE_CORRECTION'),
    canReconcile = useDomainPermission('INVOICE_RECONCILIATION');
  const state = packing.commercial || invoiceReconciliation(packing);
  const [quantities, setQuantities] = useState({}),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [correcting, setCorrecting] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!canReconcile) return;
    setBusy(true);
    setError('');
    try {
      await deliveryApi.reconcileInvoiceReceipt(packing.id, {
        fingerprint: state.fingerprint,
        note,
        invoices: state.invoices.map((i) => ({
          invoiceId: i.id,
          items: i.items.map((l) => ({
            lineId: l.lineId,
            quantity: Number(
              quantities[`${i.id}:${l.lineId}`] ??
                i.acceptedItems?.find((a) => a.lineId === l.lineId)?.quantity ??
                0
            ),
          })),
        })),
      });
      setQuantities({});
      setNote('');
      await onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="border rounded-xl p-3 space-y-3 text-sm">
      <h3 className="font-bold">Rekonsiliasi order, faktur dan penerimaan</h3>
      <p role="status">{labels[state.status]}</p>
      <p>
        Nilai berikut memantau dokumen dan barang yang diterima. Ini bukan status pembayaran atau
        saldo piutang.
      </p>
      {state.errors.map((e, n) => (
        <p key={n} className="text-amber-700">
          {e}
        </p>
      ))}
      {state.invoices.map((i) => (
        <div key={i.id} className="border-t py-2">
          <strong>{i.invoiceNumber}</strong>
          <p>
            Dokumen: {money(i.documentValue)} · Berdasarkan barang: {money(i.expectedValue)}
          </p>
          <p>
            Selisih nominal: {money(i.difference)} · Barang diterima: {money(i.acceptedValue)} ·
            Belum diterima: {money(i.unacceptedValue)}
          </p>
        </div>
      ))}
      {state.confirmedAt && (
        <p>
          Dikonfirmasi{' '}
          {new Date(state.confirmedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
        </p>
      )}
      {admin &&
        canReconcile &&
        state.resolved &&
        !state.errors.length &&
        ['NEEDS_ALLOCATION', 'STALE'].includes(state.status) && (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1 rounded-xl border border-border-glass p-2.5 bg-surface-variant/20">
              <strong className="block">Pembagian total barang diterima per produk:</strong>
              {packing.items.map((item) => {
                const target = state.accepted[item.lineId] || 0;
                const assigned = state.invoices.reduce(
                  (sum, inv) =>
                    sum +
                    Number(
                      quantities[`${inv.id}:${item.lineId}`] ??
                        inv.acceptedItems?.find((a) => a.lineId === item.lineId)?.quantity ??
                        0
                    ),
                  0
                );
                return (
                  <p
                    key={item.lineId}
                    className={assigned === target ? 'text-emerald-700 font-semibold' : 'text-amber-800'}
                  >
                    {item.name}: terbagi <strong>{assigned}</strong> / {target} {item.unit}
                  </p>
                );
              })}
            </div>
            <fieldset disabled={busy}>
              {state.invoices.map((i) => (
                <div className="space-y-2 py-2" key={i.id}>
                  <strong>{i.invoiceNumber}</strong>
                  {i.items.map((l) => (
                    <label className="block" key={l.lineId}>
                      {packing.items.find((v) => v.lineId === l.lineId)?.name} · Faktur {l.quantity}
                      <input
                        required
                        type="number"
                        min="0"
                        max={l.quantity}
                        step="1"
                        className="form-input block"
                        value={
                          quantities[`${i.id}:${l.lineId}`] ??
                          i.acceptedItems?.find((a) => a.lineId === l.lineId)?.quantity ??
                          ''
                        }
                        onChange={(e) =>
                          setQuantities({ ...quantities, [`${i.id}:${l.lineId}`]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                </div>
              ))}
              <div className="space-y-1.5 pt-2">
                <span className="block text-xs font-semibold text-on-surface-variant">
                  Pilih catatan cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Pembagian diterima per faktur sesuai bukti tanda terima toko',
                    'Jumlah faktur diverifikasi oleh Admin setelah pengiriman',
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
                Catatan pemeriksaan bukti pelanggan
                <textarea
                  required
                  maxLength={2000}
                  className="form-input block w-full"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <button type="submit" className="min-h-11 border rounded-xl px-3">
                {busy ? 'Menyimpan...' : 'Konfirmasi penerimaan per faktur'}
              </button>
            </fieldset>
          </form>
        )}
      {admin && canCorrect && state.status !== 'NO_INVOICE' && (
        <div>
          <button
            type="button"
            className="min-h-11 underline"
            onClick={() => setCorrecting(!correcting)}
          >
            {correcting ? 'Tutup koreksi' : 'Koreksi / lengkapi pemetaan dokumen'}
          </button>
          {correcting && (
            <InvoiceCorrectionForm
              key={packing.revision}
              packing={packing}
              onChanged={async () => {
                setCorrecting(false);
                await onChanged?.();
              }}
            />
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
