import React from 'react';
import {
  orderPricing,
  hasCompleteTaxTerms,
  resolveTaxIncluded,
  TAX_ROUNDING_LABELS,
} from '../../../../../shared/order-pricing.mjs';
export function InvoiceLinesEditor({ invoice, items, onChange, orderLinked }) {
  const setLine = (source, patch) => {
    const existing = (invoice.items || []).find((i) => i.lineId === source.lineId) || {
      lineId: source.lineId,
      quantity: 0,
      ...(source.unitPrice != null ? { unitPrice: source.unitPrice } : {}),
    };
    const next = { ...existing, ...patch };
    onChange({
      ...invoice,
      items: [...(invoice.items || []).filter((i) => i.lineId !== source.lineId), next].filter(
        (i) => i.quantity > 0
      ),
    });
  };
  const priced = Boolean(
    invoice.items?.length &&
    invoice.items.every((i) => Number.isFinite(i.unitPrice)) &&
    hasCompleteTaxTerms(invoice.taxRatePercent, invoice.taxIncluded)
  );
  const taxOff =
    Number(invoice.taxRatePercent) === 0 || (!orderLinked && invoice.taxRatePercent == null);
  const taxControls = (
    <div className="flex flex-wrap gap-3">
      <label className="app-field">
        Pajak %
        <input
          className="form-input block w-24"
          type="number"
          min="0"
          max="100"
          step="0.01"
          disabled={orderLinked}
          value={invoice.taxRatePercent ?? ''}
          onChange={(e) =>
            onChange({
              ...invoice,
              taxRatePercent: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
        />
      </label>
      <label className="app-field">
        Perlakuan pajak
        <select
          disabled={orderLinked}
          className="form-input block"
          value={invoice.taxIncluded == null ? '' : String(invoice.taxIncluded)}
          onChange={(e) =>
            onChange({
              ...invoice,
              taxIncluded: e.target.value === '' ? undefined : e.target.value === 'true',
            })
          }
        >
          <option value="">Belum ditetapkan</option>
          <option value="true">Termasuk harga</option>
          <option value="false">Ditambahkan</option>
        </select>
      </label>
      <label className="app-field">
        Pembulatan pajak
        <select
          disabled={orderLinked}
          className="form-input block"
          value={invoice.taxRoundingMode || 'NEAREST'}
          onChange={(e) => onChange({ ...invoice, taxRoundingMode: e.target.value })}
        >
          {Object.entries(TAX_ROUNDING_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
  return (
    <div className="col-span-full border-t pt-3 space-y-3 text-sm">
      <p className="text-xs text-on-surface-variant">
        Barang dalam faktur ini. Total per barang di seluruh faktur harus sama dengan packing.
      </p>
      {items.map((source) => {
        const line = invoice.items?.find((i) => i.lineId === source.lineId);
        return (
          <div key={source.lineId} className="flex flex-wrap items-end gap-3">
            <span className="flex-1 text-xs font-medium text-on-surface">
              {source.name || 'Barang belum bernama'} · {source.quantity} {source.unit}
            </span>
            <label className="app-field">
              Jumlah
              <input
                aria-label={`Jumlah faktur ${source.name}`}
                type="number"
                min="0"
                max={source.quantity}
                step="1"
                className="form-input block w-24"
                value={line?.quantity || 0}
                onChange={(e) => setLine(source, { quantity: Number(e.target.value) })}
              />
            </label>
            <label className="app-field">
              Harga satuan Rp
              <input
                aria-label={`Harga faktur ${source.name}`}
                disabled={orderLinked || !line}
                type="number"
                min="0"
                step="0.01"
                className="form-input block w-32"
                value={line?.unitPrice ?? source.unitPrice ?? ''}
                onChange={(e) =>
                  setLine(source, {
                    unitPrice: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
        );
      })}
      {orderLinked && Number(invoice.taxRatePercent) === 0 ? (
        <p className="text-xs text-on-surface-variant">
          Pajak nonaktif (0%) — nilai faktur mengikuti harga barang pada order.
        </p>
      ) : !orderLinked && taxOff ? (
        <details className="packing-disclosure">
          <summary>Pengaturan pajak faktur manual (opsional — default 0%)</summary>
          <div className="packing-disclosure-body">{taxControls}</div>
        </details>
      ) : (
        taxControls
      )}
      <p className="text-xs">
        Nilai berdasarkan barang:{' '}
        <strong className="text-on-surface">
          {priced
            ? `Rp ${orderPricing(invoice.items, invoice.taxRatePercent, resolveTaxIncluded(invoice.taxRatePercent, invoice.taxIncluded), invoice.taxRoundingMode || 'NEAREST').totalValue.toLocaleString('id-ID')}`
            : 'Belum lengkap. Harga dan pajak order akan diperiksa server.'}
        </strong>
      </p>
    </div>
  );
}
