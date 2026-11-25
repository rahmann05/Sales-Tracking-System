import React from 'react';
import { useApp } from '../../../context/AppContext';
import { orderStatusLabel } from '../salesPresentation';

const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

/** Read-only recap of the orders already made on this visit; nothing is typed again here. */
export function AttendanceOrderRecap({ stop }) {
  const { orders = [] } = useApp();
  const visitOrders = orders.filter((o) => o.dailyStopId && o.dailyStopId === stop?.id);
  const counted = visitOrders.filter((o) => o.status !== 'REJECTED');
  const total = counted.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const skuCount = new Set(counted.flatMap((o) => o.items.map((i) => i.productId))).size;
  return (
    <section className="attendance-recap" aria-label="Rekap order kunjungan">
      <h4>Rekap order kunjungan ini</h4>
      {visitOrders.length ? (
        <>
          <ul>
            {visitOrders.map((o) => (
              <li key={o.id}>
                <span>
                  {o.code || 'Order'} · {orderStatusLabel(o.status)}
                </span>
                <span>{rupiah(o.totalAmount)}</span>
              </li>
            ))}
          </ul>
          <p>
            {counted.length} order · {rupiah(total)} · {skuCount} jenis SKU. Laporan memakai order
            yang disetujui.
          </p>
        </>
      ) : (
        <p>
          Belum ada order pada kunjungan ini. Buat order dari detail kunjungan bila ada penjualan.
        </p>
      )}
    </section>
  );
}
