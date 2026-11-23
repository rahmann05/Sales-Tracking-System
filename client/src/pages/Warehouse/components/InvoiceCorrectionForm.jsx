import React, { useState } from 'react';
import { InvoiceLinesEditor } from './InvoiceLinesEditor';
import { deliveryApi } from '../../../services/api';
const correctionPresets = [
  'Koreksi nominal faktur sesuai dokumen fisik tercetak',
  'Penyesuaian pemetaan produk pada faktur pengiriman',
  'Penyesuaian tarif atau perlakuan pajak faktur',
];

export function InvoiceCorrectionForm({ packing, onChanged }) {
  const [invoices, setInvoices] = useState(() =>
      packing.invoices.map((i) => ({
        id: i.id,
        destinationId: i.destinationId,
        invoiceNumber: i.invoiceNumber,
        totalAmount: i.totalAmount ?? '',
        taxIncluded: i.taxIncluded ?? undefined,
        taxRatePercent: i.taxRatePercent ?? undefined,
        taxRoundingMode: i.taxRoundingMode || 'NEAREST',
        items: i.items || [],
      }))
    ),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await deliveryApi.correctInvoiceCommercial(packing.id, {
        revision: packing.revision,
        note,
        invoices: invoices.map(({ invoiceNumber: ignored, destinationId: ignoredDest, ...i }) => ({
          ...i,
          totalAmount: Number(i.totalAmount),
        })),
      });
      await onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <p>
        Koreksi hanya pemetaan dan nominal dokumen. Identitas faktur, karton dan hasil pengiriman
        tetap mengikuti bukti operasional. Setiap koreksi masuk riwayat.
      </p>
      <fieldset disabled={busy} className="space-y-4">
        {invoices.map((invoice, index) => (
          <div className="border rounded-xl p-3 space-y-3" key={invoice.id}>
            <strong>{invoice.invoiceNumber}</strong>
            <label className="block">
              Nominal dokumen yang benar (Rp)
              <input
                required
                min="0"
                step="0.01"
                type="number"
                className="form-input block"
                value={invoice.totalAmount}
                onChange={(e) =>
                  setInvoices(
                    invoices.map((v, n) =>
                      n === index ? { ...v, totalAmount: e.target.value } : v
                    )
                  )
                }
              />
            </label>
            <InvoiceLinesEditor
              invoice={invoice}
              items={
                invoice.destinationId
                  ? (packing.items || []).filter(
                      (item) => item.destinationId === invoice.destinationId
                    )
                  : packing.items
              }
              orderLinked={!!packing.sourceOrderId || !!packing.sourceOrderIds?.length}
              onChange={(updated) =>
                setInvoices(invoices.map((v, n) => (n === index ? updated : v)))
              }
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-on-surface-variant">
            Pilih alasan cepat koreksi:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {correctionPresets.map((preset) => (
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
          Alasan koreksi dan referensi dokumen pelanggan
          <textarea
            required
            className="form-input block w-full"
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button type="submit" className="min-h-11 border rounded-xl px-3">
          {busy ? 'Menyimpan...' : 'Simpan koreksi dengan riwayat'}
        </button>
      </fieldset>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
