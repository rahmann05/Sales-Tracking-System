import React from 'react';
import { LuMapPin, LuClock, LuUser, LuFileText, LuSparkles, LuCamera, LuCheck, LuX } from 'react-icons/lu';
import { SalesOffPjpStatusBadge } from './SalesOffPjpStatusBadge';

/**
 * SalesOffPjpCard Component
 * Single Responsibility: Display an individual Off-PJP attendance result card for Sales Rep.
 * Mirrors the structure of regular PJP stop cards while clearly indicating out-of-route mitigation status.
 * 1 File = 1 Component
 */
export const SalesOffPjpCard = ({ item, index }) => {
  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm hover:border-tertiary/40 transition-all flex flex-col justify-between space-y-4">
      {/* Top Section */}
      <div className="space-y-3">
        {/* Header Bar: Badge, Outlet Name & Validation Status */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-tertiary/15 text-tertiary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              +{index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-on-surface text-base tracking-tight truncate">
                  {item.outletName}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary border border-tertiary/30">
                  DI LUAR RJP
                </span>
              </div>
              {item.customerName && (
                <p className="text-xs font-medium text-on-surface flex items-center gap-1 mt-0.5">
                  <LuUser className="text-primary text-xs shrink-0" />
                  <span>Customer: <strong>{item.customerName}</strong> {item.phone && item.phone !== '-' ? `(${item.phone})` : ''}</span>
                </p>
              )}
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                <LuMapPin className="text-tertiary text-xs shrink-0" />
                <span className="truncate">{item.address || 'Alamat lokasi kunjungan'}</span>
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <SalesOffPjpStatusBadge status={item.validationStatus} />
          </div>
        </div>

        {/* Optional Photo Thumbnail */}
        {item.photoUrl && (
          <div className="relative rounded-xl overflow-hidden border border-border-glass max-h-36 bg-black/5 flex items-center justify-center">
            <img src={item.photoUrl} alt={item.outletName} className="w-full h-36 object-cover" />
            <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <LuCamera className="text-xs" /> Bukti Presensi Kamera
            </span>
          </div>
        )}

        {/* Reason & Time Meta Grid */}
        <div className="p-3 bg-surface-variant/25 rounded-xl border border-border-glass space-y-1.5 text-xs">
          <div className="flex items-start gap-2">
            <LuFileText className="text-xs text-tertiary mt-0.5 shrink-0" />
            <div className="text-on-surface">
              <span className="font-semibold">Alasan Kunjungan: </span>
              <span className="text-on-surface-variant italic">
                "{item.reason || 'Kunjungan sales mendadak di luar rute harian RJP'}"
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-on-surface-variant pt-1 border-t border-border-glass/60 flex-wrap gap-2 text-[11px]">
            <span className="flex items-center gap-1 font-mono">
              <LuClock className="text-xs text-primary" />
              {item.timestamp || '09:45 WIB'}
            </span>
            <span className="flex items-center gap-1">
              <LuUser className="text-xs text-on-surface-variant" />
              SPV Peninjau: <strong className="text-on-surface">{item.spvName || 'Ahmad Subagja'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Quota Impact Notice */}
      <div className="pt-2 border-t border-border-glass flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <LuSparkles className="text-xs text-tertiary" />
          <span className="text-on-surface-variant text-[11px]">
            {item.validationStatus === 'TERVALIDASI' ? (
              <strong className="text-emerald-600 font-semibold flex items-center gap-1">
                <LuCheck className="text-xs shrink-0" />
                <span>Sah terhitung +1 kunjungan ke target harian Anda.</span>
              </strong>
            ) : item.validationStatus === 'DITOLAK' ? (
              <strong className="text-rose-600 font-semibold flex items-center gap-1">
                <LuX className="text-xs shrink-0" />
                <span>Ditolak SPV — tidak masuk hitungan target harian.</span>
              </strong>
            ) : item.validationStatus === 'TIDAK_TERVALIDASI' ? (
              <span className="text-amber-700 font-medium">
                Lewat hari tanpa validasi SPV (tidak terhitung kuota).
              </span>
            ) : (
              <span className="text-blue-600 font-medium">
                Menunggu validasi SPV untuk dihitung ke target harian.
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
