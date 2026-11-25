import { VisitOutcomeAttachments } from '../../../shared/components/common/VisitOutcomeAttachments';
import React from 'react';
import { LuMapPin, LuCamera, LuShoppingBag, LuExternalLink } from 'react-icons/lu';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import {
  formatVisitDuration,
  reportVisitAttendance,
} from '../../../../../shared/report-presentation.mjs';

const formatSubChannel = (value) =>
  value
    ? String(value)
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (ch) => ch.toUpperCase())
    : '';

/**
 * DailyCallDetailModal Component
 * Single Responsibility: Render comprehensive popup detail for a selected Daily Call visit record.
 */
export const DailyCallDetailModal = ({ row, onClose }) => {
  if (!row) return null;
  const attendance = reportVisitAttendance(row);
  const isEc = row.effectiveCall === 'Y';
  const showNonEcReason = !isEc && Boolean(row.reason);

  const googleMapsUrl = [row.customerLat, row.customerLng].every(Number.isFinite)
    ? `https://www.google.com/maps/search/?api=1&query=${row.customerLat},${row.customerLng}`
    : null;

  return (
    <NativeDialog
      open
      title={`Detail kunjungan · ${row.customerName}`}
      onClose={onClose}
      className="spv-form-dialog"
    >
      <div className="space-y-4">
        {/* Outlet Heading */}
        <div className="pb-3 border-b border-border-glass">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
              {row.customerId}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
              {formatSubChannel(row.subChannel)} · {row.itny}
            </span>
          </div>
          <h3 className="text-base font-semibold text-on-surface tracking-tight m-0 mt-1.5">
            {row.customerName}
          </h3>
          <p className="text-xs text-on-surface-variant m-0 flex items-center gap-1.5 mt-1">
            <LuMapPin className="text-on-surface-variant text-xs shrink-0" aria-hidden="true" />
            <span>{row.customerAddress}</span>
          </p>
        </div>

        {/* Anomaly Warning Banner (Shown strictly on genuine flags) */}
        {row.isDurationAnomaly || row.isDistanceAnomaly ? (
          <div className="admin-feedback error space-y-1.5 text-xs">
            <div className="font-medium">Indikasi anomali kunjungan toko</div>
            <ul className="list-disc list-inside space-y-0.5 text-xs pl-1">
              {row.isDurationAnomaly ? (
                <li>
                  <strong>Durasi terlalu singkat:</strong>{' '}
                  {formatVisitDuration(row.durationMinutes, row.durationFormatted) ||
                    'belum tersedia'}{' '}
                  (batas kunjungan: {formatVisitDuration(row.minimumDuration) || 'belum tersedia'}).
                  {row.earlyReason ? (
                    <span>
                      {' '}
                      Alasan: <em>"{row.earlyReason}"</em>
                    </span>
                  ) : null}
                </li>
              ) : null}
              {row.isDistanceAnomaly ? (
                <li>
                  <strong>Deviasi GPS melebihi toleransi:</strong> {row.deviationMeters} meter dari
                  titik toko (radius aturan: {row.radiusMeters ?? 'belum tersedia'} meter).
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {/* Visit Metadata Strip */}
        <div className="p-3.5 bg-surface-container-low border border-border-glass rounded-xl">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs m-0">
            <div>
              <dt className="text-xs text-on-surface-variant font-medium">Salesman</dt>
              <dd className="text-sm font-semibold text-on-surface mt-0.5 m-0">
                {row.salesmanName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface-variant font-medium">Jam kunjungan</dt>
              <dd className="mt-0.5 m-0 tabular-nums">
                <strong className="text-sm font-semibold text-on-surface block">
                  {attendance.entry}
                </strong>
                {attendance.exit ? (
                  <span className="text-xs text-on-surface-variant block">{attendance.exit}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface-variant font-medium">Durasi kunjungan</dt>
              <dd className="text-sm font-semibold text-on-surface mt-0.5 m-0 whitespace-nowrap tabular-nums">
                {attendance.duration || 'Tidak tersedia'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface-variant font-medium">Effective Call (EC)</dt>
              <dd className="mt-1 m-0">
                {isEc ? (
                  <span className="admin-status admin-status-approved">Ya · Diakui</span>
                ) : (
                  <span className="admin-status">Belum efektif</span>
                )}
              </dd>
            </div>
          </dl>
          <p className="text-[11px] text-on-surface-variant border-t border-border-glass pt-2 mt-3 m-0">
            Mengikuti penjualan yang diakui laporan. Order menunggu persetujuan dan catatan
            pembayaran tidak otomatis menjadi EC.
          </p>
        </div>

        {/* Order Details */}
        <div className="p-3.5 bg-surface rounded-xl border border-border-glass space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-on-surface flex items-center gap-1.5">
              <LuShoppingBag className="text-primary shrink-0" aria-hidden="true" />
              Nilai order kunjungan
            </span>
            <strong className="text-base font-semibold text-on-surface tabular-nums">
              {row.orderAmount === null
                ? 'Dibatasi aturan laporan'
                : `Rp ${(row.orderAmount || 0).toLocaleString('id-ID')}`}
            </strong>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant border-t border-border-glass pt-2">
            <span>
              Jumlah SKU terjual:{' '}
              <strong className="text-on-surface font-semibold">{row.skuSold} SKU</strong>
            </span>
            <span>
              Status call:{' '}
              <strong className="text-on-surface font-semibold">
                Plan {row.planCall} · Actual {row.actualCall}
              </strong>
            </span>
          </div>
          {showNonEcReason ? (
            <div className="text-xs text-on-surface bg-surface-container px-3 py-2 rounded-lg border border-border-glass">
              <strong className="font-semibold">
                {row.isExtraCall ? 'Keterangan Extra Call:' : 'Keterangan Non-EC:'}
              </strong>{' '}
              {row.reason}
            </div>
          ) : null}
          <VisitOutcomeAttachments value={row.visitOutcome} />
          {row.remark ? (
            <div className="text-xs text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface font-semibold">Catatan sales:</strong> {row.remark}
            </div>
          ) : null}
        </div>

        {/* Live Photo Evidence */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
            <LuCamera className="text-primary shrink-0" aria-hidden="true" />
            Bukti foto presensi lapangan
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Foto IN */}
            <div className="space-y-1">
              <span className="text-xs text-on-surface-variant font-medium">
                Foto absen IN (Check-In)
              </span>
              <div className="relative h-44 rounded-xl overflow-hidden border border-border-glass bg-surface-container flex items-center justify-center">
                {row.photoIn ? (
                  <>
                    <img
                      src={row.photoIn}
                      alt="Foto Absen IN"
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.removeAttribute('hidden');
                      }}
                    />
                    <span hidden className="text-xs text-on-surface-variant px-3 text-center">
                      Foto IN tidak tersedia
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-on-surface-variant">Tidak ada foto IN</span>
                )}
              </div>
            </div>

            {/* Foto OUT */}
            <div className="space-y-1">
              <span className="text-xs text-on-surface-variant font-medium">
                Foto absen OUT (Check-Out)
              </span>
              <div className="relative h-44 rounded-xl overflow-hidden border border-border-glass bg-surface-container flex items-center justify-center">
                {row.photoOut ? (
                  <>
                    <img
                      src={row.photoOut}
                      alt="Foto Absen OUT"
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.removeAttribute('hidden');
                      }}
                    />
                    <span hidden className="text-xs text-on-surface-variant px-3 text-center">
                      Foto OUT tidak tersedia
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-on-surface-variant">Tidak ada foto OUT</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Link to Google Maps */}
        <div className="pt-1">
          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-primary text-on-primary rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 hover:opacity-95"
            >
              <LuExternalLink aria-hidden="true" />
              Buka lokasi toko di Google Maps
            </a>
          ) : (
            <p className="text-xs text-on-surface-variant">
              Titik lokasi tidak tersedia atau dibatasi aturan laporan.
            </p>
          )}
        </div>
      </div>
    </NativeDialog>
  );
};
