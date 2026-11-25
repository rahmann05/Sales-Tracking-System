import React from 'react';
import { loadLogistics } from '../../../../../shared/packing-load.mjs';
export function PackingLoadSummary({ packing }) {
  if (packing.loadPlanVersion !== 2) return null;
  const totals = loadLogistics(packing);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">
          Muatan untuk {totals.outletCount} toko · {totals.destinationCount} tujuan
        </h3>
        <span className="admin-footnote">
          Saran kendaraan Admin:{' '}
          {packing.suggestedVehicleSnapshot?.code ||
            'Tidak disertakan; kepala gudang menentukan kendaraan'}
          {packing.suggestedVehicleSnapshot ? ' · belum merupakan penugasan' : ''}
        </span>
      </div>
      <div className="admin-inline-metrics">
        <span>
          <strong>{totals.totalCartons}</strong> karton
        </span>
        <span>
          <strong>{packing.invoices?.length || 0}</strong> faktur
        </span>
        <span>
          <strong>{totals.knownWeightKg}</strong> kg
          {totals.weightComplete ? '' : ` (${totals.unknownWeightDestinations} tujuan belum diisi)`}
        </span>
      </div>
      <div className="admin-table-scroll">
        <table className="admin-data-table packing-load-table">
          <caption>Faktur, order dan tujuan pada packing list</caption>
          <thead>
            <tr>
              <th>Toko / titik</th>
              <th>Order</th>
              <th>Faktur</th>
              <th>Muatan</th>
            </tr>
          </thead>
          <tbody>
            {packing.destinations.map((destination) => (
              <tr key={destination.id}>
                <td data-label="Toko / titik">
                  <strong className="block">{destination.outlet?.name || 'Toko'}</strong>
                  <span className="block">{destination.outlet?.address || ''}</span>
                  {destination.point && (
                    <a
                      className="admin-table-link"
                      href={`https://www.google.com/maps/search/?api=1&query=${destination.point.latitude},${destination.point.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {destination.point.latitude.toFixed(6)},{' '}
                      {destination.point.longitude.toFixed(6)}
                    </a>
                  )}
                </td>
                <td data-label="Order">
                  {destination.sourceOrderIds.map((id) => (
                    <p key={id}>
                      {packing.items.find((item) => item.sourceOrderId === id)?.sourceOrderCode ||
                        id.slice(0, 8)}
                    </p>
                  ))}
                </td>
                <td data-label="Faktur">
                  {packing.invoices
                    .filter((invoice) => invoice.destinationId === destination.id)
                    .map((invoice) => (
                      <p key={invoice.id || invoice.invoiceNumber}>
                        {invoice.invoiceNumber || 'Belum diberi nomor'} · {invoice.totalCartons}{' '}
                        karton
                      </p>
                    ))}
                </td>
                <td data-label="Muatan">
                  {destination.totalCartons} karton
                  <small>
                    {destination.totalWeight == null
                      ? 'Berat belum diketahui'
                      : `${destination.totalWeight} kg`}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="packing-disclosure">
        <summary>Rekap total produk menurut SKU dan satuan</summary>
        <div className="packing-disclosure-body">
          {totals.products.map((item, index) => (
            <p key={index} className="text-xs text-on-surface-variant">
              <span className="font-mono text-on-surface">{item.sku || '—'}</span> · {item.name} ·{' '}
              <strong className="text-on-surface">
                {item.quantity} {item.unit}
              </strong>
            </p>
          ))}
        </div>
      </details>
    </section>
  );
}
