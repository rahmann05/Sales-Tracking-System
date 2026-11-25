import { DeliveryReceiptSummary } from '../../../shared/components/common/DeliveryReceiptSummary';
import {
  deliveryNavigationUrl,
  stopDestinationOutlet,
} from '../../../../../shared/driver-workspace.mjs';
import { unitDescription } from '../../../../../shared/product-units.mjs';
import React from 'react';
import {
  LuMapPin,
  LuPackage,
  LuFileText,
  LuCamera,
  LuCircleCheck,
  LuCircleX,
  LuNavigation,
} from 'react-icons/lu';

// Status is plain text with a dot (shared admin-status look), not a colored pill.
const STATUS_MAP = {
  PENDING: { label: 'Menunggu', tone: '' },
  DELIVERED: { label: 'Diterima penuh', tone: 'admin-status-approved' },
  REJECTED: { label: 'Ditolak', tone: 'admin-status-rejected' },
  PARTIAL_REJECT: { label: 'Diterima sebagian', tone: 'admin-status-pending' },
};

/**
 * DriverStopCard — Card for each delivery stop in the driver's route.
 * Similar to SalesStopCard but for delivery context.
 */
export const DriverStopCard = ({
  stop,
  index,
  totalStops,
  onAbsenIn,
  onMarkDelivered,
  onMarkRejected,
  disabled = false,
  disabledReason = '',
  policy = {},
}) => {
  const statusCfg = STATUS_MAP[stop.status] || {
    label: stop.status || 'Status belum tersedia',
    tone: '',
  };
  const isCompleted = ['DELIVERED', 'REJECTED', 'PARTIAL_REJECT'].includes(stop.status);
  const hasArrived = !!stop.arrivedAt || policy.DELIVERY_ATTENDANCE_MODE === 'OPTIONAL';

  const invoices = (stop.packingList?.invoices || []).filter(
    (i) =>
      !(stop.allocatedInvoices || []).length ||
      stop.allocatedInvoices.some((a) => a.invoiceId === i.id)
  );
  const outletName = stop.outlet?.name || 'Toko';

  return (
    <div className="driver-stop-document operational-card bg-surface border rounded-xl overflow-hidden transition-all">
      <div className="driver-stop-steps" aria-label="Tahap penyelesaian tujuan">
        {[
          [1, 'Tiba di toko', hasArrived || isCompleted, !hasArrived && !isCompleted],
          [2, 'Bukti & serah terima', isCompleted, hasArrived && !isCompleted],
          [3, 'Selesai', isCompleted, false],
        ].map(([num, stepTitle, done, current]) => (
          <div
            key={num}
            className={`driver-stop-step ${done ? 'is-done' : current ? 'is-current' : ''}`}
          >
            <span className="driver-stop-step-dot">{num}</span>
            <span>{stepTitle}</span>
          </div>
        ))}
      </div>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex flex-col items-center gap-1">
          <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 border border-border-glass bg-white text-on-surface">
            {index + 1}
          </span>
          {index < totalStops - 1 && <div className="w-0.5 h-4 bg-border-glass" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-on-surface min-w-0 whitespace-normal break-words">
              {outletName}
            </span>
            <span className={`admin-status shrink-0 ${statusCfg.tone}`}>{statusCfg.label}</span>
          </div>
          <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-1 min-w-0 whitespace-normal break-words">
            <LuMapPin className="text-primary text-xs shrink-0" />
            <span className="min-w-0 whitespace-normal break-words">
              {stop.outlet?.address || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Packing List Info */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 text-xs bg-surface-variant/20 p-2.5 rounded-xl border border-border-glass">
          <LuPackage className="text-primary text-sm shrink-0" />
          <span className="font-medium text-on-surface break-words">{stop.packingList?.code}</span>
          <span className="text-on-surface-variant">
            — {stop.allocatedCartons ?? stop.packingList?.totalCartons ?? 0} Karton
          </span>
        </div>

        {(stop.allocatedItems || []).map((i) => {
          const item = stop.packingList?.items?.find((p) => p.lineId === i.lineId);
          return (
            <p key={i.lineId} className="text-sm">
              {item?.name || 'Item muatan'}: {i.quantity} {unitDescription(item)}
            </p>
          );
        })}
        {/* Invoice List */}
        {invoices.length > 0 && (
          <div className="pl-2 md:pl-4 space-y-1">
            {invoices.map((inv, idx) => (
              <div
                key={inv.id || idx}
                className="flex flex-wrap md:flex-nowrap items-center gap-2 text-xs text-on-surface-variant"
              >
                <LuFileText className="shrink-0" />
                <span className="font-medium text-on-surface break-words">{inv.invoiceNumber}</span>
                <span>
                  {stop.allocatedInvoices?.find((i) => i.invoiceId === inv.id)?.cartons ??
                    inv.totalCartons}{' '}
                  krt pada muatan ini
                </span>
                {inv.isDelivered && <LuCircleCheck className="text-emerald-500 shrink-0" />}
              </div>
            ))}
          </div>
        )}

        <DeliveryReceiptSummary stop={stop} />
        {/* Reject info */}
        {stop.rejectReason && (
          <div className="admin-feedback error mt-1">
            Alasan: {stop.rejectReason}
            {stop.rejectedCartons > 0 && ` (${stop.rejectedCartons} karton ditolak)`}
          </div>
        )}
      </div>

      {/* Action Buttons with Mobile-Friendly >= 48px Touch Targets */}
      {isCompleted &&
        policy.DELIVERY_ATTENDANCE_MODE === 'IN_OUT' &&
        !stop.attendances?.some((a) => a.type === 'OUT') && (
          <p className="admin-feedback mx-4 mb-4">
            Hasil barang sudah dicatat. Bukti presensi keluar tidak tersedia; periksa tindak lanjut
            gudang pada trip ini.
          </p>
        )}
      {stop.status === 'PENDING' && (
        <div className="px-4 pb-4 space-y-2.5">
          {/* Navigation button (min 48px) */}
          {deliveryNavigationUrl(stopDestinationOutlet(stop)) && (
            <a
              href={deliveryNavigationUrl(stopDestinationOutlet(stop))}
              target="_blank"
              rel="noopener noreferrer"
              className="app-button w-full"
            >
              <LuNavigation className="text-base shrink-0" /> Navigasi ke Toko
            </a>
          )}

          {disabled && disabledReason && (
            <p role="status" className="admin-feedback warning">
              {disabledReason}
            </p>
          )}
          {!hasArrived ? (
            /* Absen In button (min 48px) */
            <button
              type="button"
              onClick={onAbsenIn}
              disabled={disabled}
              className="app-button app-button-primary w-full"
            >
              <LuCamera className="text-base shrink-0" /> Absen Sampai di Toko
            </button>
          ) : (
            /* Mark Delivered / Rejected buttons (min 48px each) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onMarkDelivered}
                disabled={disabled}
                className="app-button app-button-primary"
              >
                <LuCircleCheck className="text-base shrink-0" /> Diterima penuh
              </button>
              <button
                type="button"
                onClick={onMarkRejected}
                disabled={disabled}
                className="app-button"
              >
                <LuCircleX className="text-base shrink-0" /> Penolakan / sebagian
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
