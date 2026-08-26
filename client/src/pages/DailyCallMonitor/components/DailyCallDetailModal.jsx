import React from 'react';
import { LuX, LuMapPin, LuClock, LuCamera, LuShoppingBag, LuExternalLink, LuCircleCheck } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * DailyCallDetailModal Component
 * Single Responsibility: Render comprehensive popup detail for a selected Daily Call visit record.
 */
export const DailyCallDetailModal = ({ row, onClose }) => {
  if (!row) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${row.customerLat},${row.customerLng}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl border border-border-glass max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border-glass">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                {row.customerId}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant">
                {row.subChannel} • {row.itny}
              </span>
            </div>
            <h3 className="text-lg font-black text-on-surface m-0 mt-1">{row.customerName}</h3>
            <p className="text-xs text-on-surface-variant m-0 flex items-center gap-1 mt-0.5">
              <LuMapPin className="text-primary text-xs shrink-0" />
              <span>{row.customerAddress}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-on-surface-variant hover:text-on-surface text-xl font-bold hover:bg-surface-variant transition-all cursor-pointer"
          >
            <LuX />
          </button>
        </div>

        {/* Warning Banner if Anomaly */}
        {(row.isDurationAnomaly || row.isDistanceAnomaly) && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1 text-xs text-rose-800">
            <div className="flex items-center gap-1.5 font-bold text-rose-700">
              <FiAlertTriangle className="text-base shrink-0" />
              <span>Indikasi Anomali Kunjungan Toko</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
              {row.isDurationAnomaly && (
                <li>
                  <strong>Durasi Terlalu Singkat:</strong> {row.durationMinutes} menit (Standar min. 5 menit).
                  {row.earlyReason && <span> Alasan: <em>"{row.earlyReason}"</em></span>}
                </li>
              )}
              {row.isDistanceAnomaly && (
                <li>
                  <strong>Deviasi GPS Melebihi Toleransi:</strong> {row.deviationMeters} meter dari titik toko (Radius toleransi: 50m).
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Quick Grid Information */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-surface-container rounded-2xl text-xs">
          <div>
            <span className="text-[10px] text-on-surface-variant font-semibold block">Salesman</span>
            <strong className="text-on-surface">{row.salesmanName}</strong>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant font-semibold block">Jam Kunjungan</span>
            <strong className="text-emerald-600">In: {row.timeIn}</strong>
            <span className="text-[11px] text-on-surface-variant block">Out: {row.timeOut}</span>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant font-semibold block">Durasi Kunjungan</span>
            <strong className="text-on-surface font-mono">{row.durationFormatted}</strong>
            <span className="text-[10px] text-on-surface-variant block">({row.durationMinutes} menit)</span>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant font-semibold block">Effective Call (EC)</span>
            <strong className={row.effectiveCall === 'Y' ? 'text-purple-600' : 'text-amber-600'}>
              {row.effectiveCall === 'Y' ? '✅ Ya (Order Masuk)' : '❌ Tidak Ada Order'}
            </strong>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-3.5 bg-surface-container-low rounded-2xl border border-border-glass space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-on-surface flex items-center gap-1.5">
              <LuShoppingBag className="text-primary" /> Nilai Transaksi Kunjungan:
            </span>
            <strong className="text-sm font-black text-emerald-600">
              Rp {row.orderAmount ? row.orderAmount.toLocaleString('id-ID') : '0'}
            </strong>
          </div>
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant border-t border-border-glass pt-2">
            <span>Jumlah SKU Terjual: <strong>{row.skuSold} SKU</strong></span>
            <span>Status Call: <strong>Plan {row.planCall} • Actual {row.actualCall}</strong></span>
          </div>
          {row.reason && (
            <div className="text-[11px] text-rose-700 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
              <strong>Keterangan Non-EC:</strong> {row.reason}
            </div>
          )}
          {row.remark && (
            <div className="text-[11px] text-on-surface-variant">
              <strong>Catatan Sales:</strong> {row.remark}
            </div>
          )}
        </div>

        {/* Live Photo Evidence */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <LuCamera className="text-primary" /> Foto Bukti Presensi Lapangan
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Foto IN */}
            <div className="space-y-1">
              <span className="text-[11px] text-on-surface-variant font-semibold">Foto Absen IN (Check-In):</span>
              <div className="relative h-44 rounded-xl overflow-hidden border border-border-glass bg-slate-900 flex items-center justify-center">
                {row.photoIn ? (
                  <img
                    src={row.photoIn}
                    alt="Foto Absen IN"
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/400x300/1e293b/94a3b8?text=Foto+IN+Tidak+Tersedia';
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-500">Tidak ada foto IN</span>
                )}
              </div>
            </div>

            {/* Foto OUT */}
            <div className="space-y-1">
              <span className="text-[11px] text-on-surface-variant font-semibold">Foto Absen OUT (Check-Out):</span>
              <div className="relative h-44 rounded-xl overflow-hidden border border-border-glass bg-slate-900 flex items-center justify-center">
                {row.photoOut ? (
                  <img
                    src={row.photoOut}
                    alt="Foto Absen OUT"
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/400x300/1e293b/94a3b8?text=Foto+OUT+Tidak+Tersedia';
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-500">Tidak ada foto OUT</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Link to Google Maps */}
        <div className="pt-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-primary text-on-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95"
          >
            <LuExternalLink /> Buka Lokasi Toko di Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};

