import React from 'react';
import { LuClock, LuCheck, LuX, LuMapPin, LuUser } from 'react-icons/lu';

/**
 * OffPjpAttendanceCard Component
 * Single Responsibility: Display and validate an off-PJP attendance entry in a full-width 1-row layout.
 */
export const OffPjpAttendanceCard = ({ item, onValidate }) => {
  const renderValidationStatusBadge = (status) => {
    switch (status) {
      case 'TERVALIDASI':
        return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 uppercase tracking-wider">TERVALIDASI (SAH)</span>;
      case 'DITOLAK':
        return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 uppercase tracking-wider">DITOLAK</span>;
      case 'TIDAK_TERVALIDASI':
        return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 uppercase tracking-wider">TIDAK TERVALIDASI (LEWAT HARI)</span>;
      case 'MENUNGGU':
      default:
        return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 uppercase tracking-wider animate-pulse">MENUNGGU VALIDASI</span>;
    }
  };

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left Info: Badges, Outlet, Address & Sales Notes */}
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          {renderValidationStatusBadge(item.validationStatus)}
          <span className="text-xs font-mono text-on-surface-variant flex items-center gap-1">
            <LuClock className="text-xs text-primary" />
            {item.timestamp || '09:45 WIB'}
          </span>
        </div>

        <div>
          <h4 className="font-bold text-on-surface text-base tracking-tight">{item.outletName}</h4>
          {item.customerName && (
            <p className="text-xs font-semibold text-on-surface flex items-center gap-1 mt-0.5">
              <LuUser className="text-primary text-xs shrink-0" />
              <span>Customer: {item.customerName} {item.phone && item.phone !== '-' ? `• ${item.phone}` : ''}</span>
            </p>
          )}
          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
            <LuMapPin className="text-primary text-xs shrink-0" />
            <span>{item.address}</span>
          </p>
        </div>

        <div className="text-xs text-on-surface bg-surface-variant/25 px-3 py-1.5 rounded-xl border border-border-glass inline-flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-primary">
            <LuUser className="text-xs" />
            Sales: {item.salesName}
          </span>
          <span className="text-on-surface-variant">•</span>
          <span className="text-on-surface-variant">Catatan: "{item.reason || 'Kunjungan sales mendadak di luar rute harian RJP'}"</span>
        </div>
      </div>

      {/* Right Action Buttons */}
      {item.validationStatus === 'MENUNGGU' || item.validationStatus === 'TIDAK_TERVALIDASI' ? (
        <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-glass">
          <button
            onClick={() => onValidate({ attendanceId: item.id, approved: true })}
            className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <LuCheck className="text-base" />
            <span>Validasi (Setujui)</span>
          </button>
          <button
            onClick={() => onValidate({ attendanceId: item.id, approved: false })}
            className="px-4 py-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
          >
            <LuX className="text-base" />
            <span>Tolak</span>
          </button>
        </div>
      ) : (
        <div className="text-xs font-semibold text-on-surface-variant shrink-0 bg-surface-variant/40 px-3 py-2 rounded-xl border border-border-glass">
          Status Akhir: {item.validationStatus} (Oleh SPV {item.spvName || 'Ahmad Subagja'})
        </div>
      )}
    </div>
  );
};
