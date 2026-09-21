import React from 'react';
import { LuMapPin, LuPackage, LuFileText, LuCamera, LuCircleCheck, LuCircleX, LuClock, LuNavigation } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

const STATUS_MAP = {
  PENDING: { label: 'Menunggu', color: '#6b7280', bg: '#f3f4f6', Icon: LuClock },
  DELIVERED: { label: 'Terkirim', color: '#16a34a', bg: '#dcfce7', Icon: LuCircleCheck },
  REJECTED: { label: 'Ditolak', color: '#dc2626', bg: '#fee2e2', Icon: LuCircleX },
  PARTIAL_REJECT: { label: 'Sebagian Ditolak', color: '#d97706', bg: '#fef3c7', Icon: FiAlertTriangle },
};

/**
 * DriverStopCard — Card for each delivery stop in the driver's route.
 * Similar to SalesStopCard but for delivery context.
 */
export const DriverStopCard = ({ stop, index, totalStops, onAbsenIn, onMarkDelivered, onMarkRejected }) => {
  const statusCfg = STATUS_MAP[stop.status] || STATUS_MAP.PENDING;
  const StatusIcon = statusCfg.Icon;
  const isCompleted = stop.status !== 'PENDING';
  const hasArrived = !!stop.arrivedAt;

  const invoices = stop.packingList?.invoices || [];
  const outletName = stop.outlet?.name || 'Toko';

  return (
    <div className={`bg-surface border rounded-2xl shadow-sm overflow-hidden transition-all ${
      isCompleted ? 'border-border-glass opacity-75' : 'border-primary/20'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex flex-col items-center gap-1">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
          >
            {index + 1}
          </span>
          {index < totalStops - 1 && (
            <div className="w-0.5 h-4 bg-border-glass" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-on-surface truncate">{outletName}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
            >
              <StatusIcon className="inline mr-0.5 text-xs" /> {statusCfg.label}
            </span>
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5 truncate">
            <LuMapPin className="inline mr-1" />
            {stop.outlet?.address || '-'}
          </div>
        </div>
      </div>

      {/* Packing List Info */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <LuPackage className="text-primary shrink-0" />
          <span className="font-semibold text-on-surface">{stop.packingList?.code}</span>
          <span className="text-on-surface-variant">— {stop.packingList?.totalCartons || 0} Karton</span>
        </div>

        {/* Invoice List */}
        {invoices.length > 0 && (
          <div className="pl-6 space-y-1">
            {invoices.map((inv, idx) => (
              <div key={inv.id || idx} className="flex items-center gap-2 text-xs text-on-surface-variant">
                <LuFileText className="shrink-0" />
                <span className="font-medium text-on-surface">{inv.invoiceNumber}</span>
                <span>{inv.totalCartons} krt</span>
                {inv.isDelivered && <LuCircleCheck className="text-green-500 shrink-0" />}
              </div>
            ))}
          </div>
        )}

        {/* Reject info */}
        {stop.rejectReason && (
          <div className="text-xs bg-red-50 text-red-700 rounded-lg p-2 mt-1">
            Alasan: {stop.rejectReason}
            {stop.rejectedCartons > 0 && ` (${stop.rejectedCartons} karton ditolak)`}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="px-4 pb-4 space-y-2">
          {/* Navigation button */}
          {stop.outlet?.latitude && stop.outlet?.longitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${stop.outlet.latitude},${stop.outlet.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors"
            >
              <LuNavigation /> Navigasi ke Toko
            </a>
          )}

          {!hasArrived ? (
            /* Absen In button */
            <button
              onClick={onAbsenIn}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
            >
              <LuCamera /> Absen Sampai di Toko
            </button>
          ) : (
            /* Mark Delivered / Rejected buttons */
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onMarkDelivered}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
              >
                <LuCircleCheck /> Terkirim
              </button>
              <button
                onClick={onMarkRejected}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
              >
                <LuCircleX /> Ditolak
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
