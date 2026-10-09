import {deliveryNavigationUrl} from '../../../../../shared/driver-workspace.mjs';
import {unitDescription} from '../../../../../shared/product-units.mjs';
import React from 'react';
import { LuMapPin, LuPackage, LuFileText, LuCamera, LuCircleCheck, LuCircleX, LuClock, LuNavigation } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

const STATUS_MAP = {
  PENDING: { label: 'Menunggu', color: '#6b7280', bg: '#f3f4f6', Icon: LuClock },
  DELIVERED: { label: 'Diterima penuh', color: '#16a34a', bg: '#dcfce7', Icon: LuCircleCheck },
  REJECTED: { label: 'Ditolak', color: '#dc2626', bg: '#fee2e2', Icon: LuCircleX },
  PARTIAL_REJECT: { label: 'Diterima sebagian', color: '#d97706', bg: '#fef3c7', Icon: FiAlertTriangle },
};

/**
 * DriverStopCard — Card for each delivery stop in the driver's route.
 * Similar to SalesStopCard but for delivery context.
 */
export const DriverStopCard = ({ stop, index, totalStops, onAbsenIn, onMarkDelivered, onMarkRejected, disabled=false,policy={} }) => {
  const statusCfg = STATUS_MAP[stop.status] || {label:stop.status||'Status belum tersedia',color:'#697280',bg:'#f3f5f8',Icon:LuClock};
  const StatusIcon = statusCfg.Icon;
  const isCompleted = ['DELIVERED','REJECTED','PARTIAL_REJECT'].includes(stop.status);
  const hasArrived = !!stop.arrivedAt || policy.DELIVERY_ATTENDANCE_MODE==='OPTIONAL';

  const invoices = (stop.packingList?.invoices || []).filter(i=>!(stop.allocatedInvoices||[]).length||stop.allocatedInvoices.some(a=>a.invoiceId===i.id));
  const outletName = stop.outlet?.name || 'Toko';

  return (
    <div className={`driver-stop-document operational-card bg-surface border border-b-[3.5px] rounded-2xl shadow-xs overflow-hidden transition-all ${isCompleted
        ? 'border-border-glass border-b-neutral-300 dark:border-b-neutral-700 opacity-80'
        : 'border-primary/30 border-b-primary/60 hover:shadow-sm'
      }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex flex-col items-center gap-1">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 border border-border-glass shadow-2xs"
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
            <span className="text-sm font-bold text-on-surface min-w-0 whitespace-normal break-words">{outletName}</span>
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 shadow-2xs"
              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
            >
              <StatusIcon className="inline mr-1 text-xs" /> {statusCfg.label}
            </span>
          </div>
          <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-1 min-w-0 whitespace-normal break-words">
            <LuMapPin className="text-primary text-xs shrink-0" />
            <span className="min-w-0 whitespace-normal break-words">{stop.outlet?.address || '-'}</span>
          </div>
        </div>
      </div>

      {/* Packing List Info */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2 text-xs bg-surface-variant/20 p-2.5 rounded-xl border border-border-glass">
          <LuPackage className="text-primary text-sm shrink-0" />
          <span className="font-bold text-on-surface">{stop.packingList?.code}</span>
          <span className="text-on-surface-variant">— {stop.allocatedCartons ?? stop.packingList?.totalCartons ?? 0} Karton</span>
        </div>

        {(stop.allocatedItems || []).map(i => { const item = stop.packingList?.items?.find(p => p.lineId === i.lineId); return <p key={i.lineId} className="text-sm">{item?.name || i.lineId}: {i.quantity} {unitDescription(item)}</p>; })}
        {/* Invoice List */}
        {invoices.length > 0 && (
          <div className="pl-4 space-y-1">
            {invoices.map((inv, idx) => (
              <div key={inv.id || idx} className="flex items-center gap-2 text-xs text-on-surface-variant">
                <LuFileText className="shrink-0" />
                <span className="font-semibold text-on-surface">{inv.invoiceNumber}</span>
                <span>{stop.allocatedInvoices?.find(i=>i.invoiceId===inv.id)?.cartons ?? inv.totalCartons} krt pada muatan ini</span>
                {inv.isDelivered && <LuCircleCheck className="text-emerald-500 shrink-0" />}
              </div>
            ))}
          </div>
        )}

        {/* Reject info */}
        {stop.rejectReason && (
          <div className="text-xs bg-rose-50 text-rose-800 rounded-xl p-3 mt-1 border border-rose-200/60 font-medium">
            Alasan: {stop.rejectReason}
            {stop.rejectedCartons > 0 && ` (${stop.rejectedCartons} karton ditolak)`}
          </div>
        )}
      </div>

      {/* Action Buttons with Mobile-Friendly >= 48px Touch Targets */}
      {isCompleted&&policy.DELIVERY_ATTENDANCE_MODE==='IN_OUT'&&!stop.attendances?.some(a=>a.type==='OUT')&&<p className="mx-4 mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Hasil barang sudah dicatat. Bukti presensi keluar tidak tersedia; periksa tindak lanjut gudang pada trip ini.</p>}
      {stop.status==='PENDING' && (
        <div className="px-4 pb-4 space-y-2.5">
          {/* Navigation button (min 48px) */}
          {deliveryNavigationUrl(stop.outlet) && (
            <a
              href={deliveryNavigationUrl(stop.outlet)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-primary/30 text-primary hover:bg-primary/5 text-sm font-bold transition-all shadow-xs"
            >
              <LuNavigation className="text-base" /> Navigasi ke Toko
            </a>
          )}

          {!hasArrived ? (
            /* Absen In button (min 48px) */
            <button
              onClick={onAbsenIn}
              disabled={disabled}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-primary text-on-primary text-sm font-black shadow-md hover:bg-primary/90 transition-all cursor-pointer"
            >
              <LuCamera className="text-base" /> Absen Sampai di Toko
            </button>
          ) : (
            /* Mark Delivered / Rejected buttons (min 48px each) */
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onMarkDelivered}
                disabled={disabled}
                className="min-h-[48px] flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-black shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <LuCircleCheck className="text-base" /> Diterima penuh
              </button>
              <button
                onClick={onMarkRejected}
                disabled={disabled}
                className="min-h-[48px] flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-rose-600 text-white text-sm font-black shadow-md hover:bg-rose-700 transition-all cursor-pointer"
              >
                <LuCircleX className="text-base" /> Penolakan / sebagian
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
