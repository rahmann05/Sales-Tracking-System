import { OperationalIssues } from '../../Warehouse/components/OperationalIssues';
import React from 'react';
import { unitDescription } from '../../../../../shared/product-units.mjs';
import { orderStatusLabel, fulfillmentLabel, stampWib } from '../salesPresentation';
export function SalesOrderDetail({ order: o }) {
  const lines = o.fulfillmentLines || [];
  const totalOrdered = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const totalPrepared = lines.reduce((sum, line) => sum + Number(line.prepared || 0), 0);
  const totalAccepted = lines.reduce((sum, line) => sum + Number(line.accepted || 0), 0);
  const approvedDone = o.status === 'APPROVED';
  const packingDone = totalPrepared > 0 || ['PARTIAL', 'FULFILLED'].includes(o.fulfillmentStatus);
  const deliveryDone =
    o.fulfillmentStatus === 'FULFILLED' || (totalOrdered > 0 && totalAccepted >= totalOrdered);
  const stages = [
    ['1', 'Pengajuan', true],
    ['2', o.status === 'REJECTED' ? 'Ditolak' : 'Persetujuan', approvedDone],
    ['3', 'Packing & kirim', packingDone],
    ['4', 'Diterima toko', deliveryDone],
  ];
  const pct =
    totalOrdered > 0 ? Math.min(100, Math.round((totalAccepted / totalOrdered) * 100)) : 0;
  return (
    <div className="sales-visit-detail">
      <div>
        <span className="admin-eyebrow">{o.code || o.id}</span>
        <h3>{o.pjpStop?.outlet?.name || o.customerSnapshot?.name || 'Pelanggan'}</h3>
        <p>{o.pjpStopId ? 'Order dari kunjungan PJP' : 'Order tanpa kunjungan PJP'}</p>
        {o.history?.find((h) => h.contextReason)?.contextReason && (
          <p>Alasan: {o.history.find((h) => h.contextReason).contextReason}</p>
        )}
      </div>
      <div className="logistics-flow-strip" aria-label="Tahapan order">
        {stages.map(([num, label, done]) => (
          <div
            key={num}
            className={`logistics-flow-step ${done ? 'is-active' : ''}`}
            style={{ cursor: 'default' }}
          >
            <span className="logistics-flow-num">{num}</span>
            <span className="logistics-flow-step-text">
              <span>{label}</span>
              <small>
                {done ? 'Selesai' : o.status === 'REJECTED' && num === '2' ? 'Ditolak' : 'Menunggu'}
              </small>
            </span>
          </div>
        ))}
      </div>
      <dl>
        <div>
          <dt>Persetujuan</dt>
          <dd>{orderStatusLabel(o.status)}</dd>
        </div>
        <div>
          <dt>Pemenuhan</dt>
          <dd>{fulfillmentLabel(o.fulfillmentStatus)}</dd>
        </div>
        <div>
          <dt>Dibuat</dt>
          <dd>{stampWib(o.createdAt)}</dd>
        </div>
        <div>
          <dt>Janji pengiriman</dt>
          <dd>{o.promisedAt ? stampWib(o.promisedAt) : 'Belum ditetapkan'}</dd>
        </div>
        <div>
          <dt>Nilai order</dt>
          <dd>Rp {Number(o.totalValue || 0).toLocaleString('id-ID')}</dd>
        </div>
        <div>
          <dt>Syarat order</dt>
          <dd>
            {{ TOP: 'Tempo (TOP)', CASH: 'Tunai', TRANSFER: 'Transfer' }[o.paymentType] ||
              o.paymentType ||
              'Belum tersedia'}
            {o.paymentType === 'TOP' ? ` · ${o.termOfPaymentDays ?? '—'} hari` : ''}
          </dd>
        </div>
      </dl>
      {o.rejectionReason && (
        <p role="note" className="app-error">
          Alasan ditolak: {o.rejectionReason}
        </p>
      )}
      <p className="sales-note">
        Persetujuan order dan penerimaan barang dipantau terpisah. Syarat order bukan bukti
        pembayaran.
      </p>
      <section>
        <h4>Rincian produk</h4>
        <div className="sales-order-lines">
          {(o.items || []).map((i) => (
            <div key={i.id || i.productId}>
              <strong>{i.productName || i.product?.name}</strong>
              <span>
                {i.quantity} {unitDescription(i)} × Rp{' '}
                {Number(i.unitPrice ?? i.price ?? 0).toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </section>
      {o.status !== 'REJECTED' && (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4>Perjalanan pemenuhan</h4>
            {totalOrdered > 0 && (
              <span className="text-xs font-semibold text-on-surface-variant">
                Terkirim {totalAccepted} / {totalOrdered} ({pct}%)
              </span>
            )}
          </div>
          {totalOrdered > 0 && (
            <progress
              className="packing-capacity-bar"
              value={pct}
              max={100}
              aria-label="Persentase penerimaan order"
            />
          )}
          {lines.length ? (
            <div className="admin-table-scroll border border-border-glass rounded-xl">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Pesan</th>
                    <th>Packing</th>
                    <th>Terima</th>
                    <th>Batal</th>
                    <th>Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.productName || i.product?.name}</strong>
                        <small>{unitDescription(i)}</small>
                      </td>
                      <td className="admin-numeric">{i.quantity ?? '—'}</td>
                      <td className="admin-numeric">{i.prepared ?? 0}</td>
                      <td className="admin-numeric">{i.accepted ?? 0}</td>
                      <td className="admin-numeric">{i.cancelled ?? 0}</td>
                      <td className="admin-numeric">
                        <strong>{i.remaining ?? '—'}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="sales-note">Rincian pemenuhan belum tersedia.</p>
          )}
        </section>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer">Masalah / keluhan order</summary>
        <OperationalIssues reference={{ orderId: o.id }} />
      </details>
      {!!o.history?.length && (
        <details>
          <summary>Riwayat order ({o.history.length})</summary>
          {o.history.map((h, i) => (
            <p className="sales-note" key={i}>
              {stampWib(h.at)} · {h.action} · {h.actorName || h.actorId}
              {h.note ? ` · ${h.note}` : ''}
            </p>
          ))}
        </details>
      )}
    </div>
  );
}
