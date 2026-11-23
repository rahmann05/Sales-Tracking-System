import { unitDescription } from '../../../../../shared/product-units.mjs';
import React from 'react';
export function PackingAllocationFields({ entry, onChange, allowSplit }) {
  const invoiceCartonSum = (entry.invoices || []).reduce(
    (sum, row) => sum + Number(row.cartons || 0),
    0
  );
  return (
    <div className="w-full space-y-2 text-sm border-t pt-2">
      {(entry.invoices || []).map((i, index) => (
        <label className="block" key={i.id}>
          Karton faktur {i.invoiceNumber} (sisa {i.remaining})
          <input
            className="form-input ml-2 w-24"
            type="number"
            min="0"
            max={i.remaining}
            step="1"
            disabled={!allowSplit}
            value={i.cartons}
            onChange={(e) =>
              onChange({
                ...entry,
                invoices: entry.invoices.map((v, n) =>
                  n === index ? { ...v, cartons: Number(e.target.value) } : v
                ),
              })
            }
          />
        </label>
      ))}
      <label className="block">
        Karton untuk mobil ini (sisa {entry.remainingCartons})
        <input
          type="number"
          min="1"
          max={entry.remainingCartons}
          step="1"
          disabled={!allowSplit}
          className="form-input ml-2 w-24"
          value={entry.totalCartons}
          onChange={(e) => onChange({ ...entry, totalCartons: Number(e.target.value) })}
        />
      </label>
      {allowSplit && entry.invoices?.length > 0 && invoiceCartonSum !== Number(entry.totalCartons) && (
        <p role="status" className="text-xs text-amber-800">
          Total karton faktur ({invoiceCartonSum}) harus sama dengan karton untuk mobil ini (
          {entry.totalCartons}).
        </p>
      )}
      {entry.items.map((i, index) => (
        <label className="flex flex-wrap justify-between gap-2" key={i.lineId}>
          {i.name} · sisa {i.remaining} {unitDescription(i)}
          <input
            aria-label={`Alokasi ${i.name}`}
            type="number"
            min="0"
            max={i.remaining}
            step="1"
            disabled={!allowSplit}
            className="form-input w-24"
            value={i.quantity}
            onChange={(e) =>
              onChange({
                ...entry,
                items: entry.items.map((v, n) =>
                  n === index ? { ...v, quantity: Number(e.target.value) } : v
                ),
              })
            }
          />
        </label>
      ))}
    </div>
  );
}
