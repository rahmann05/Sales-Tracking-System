import React from 'react';
import { LuMapPin } from 'react-icons/lu';
import { DeliveryStopActions } from './DeliveryStopActions';
import { useOutletLockStatus } from '../../../hooks/useOutletLockStatus';

/**
 * DeliveryStopCard Component (Single Responsibility: Drop Point Card in H+1 Manifest)
 * Equal height standard: h-full min-h-[220px] flex flex-col justify-between
 */
export const DeliveryStopCard = ({
  stop,
  allStops = [],
  onAbsenIn,
  onOpenPOD,
  onAbsenOut,
  onRequestUnlock,
}) => {
  // Lock calculation hook
  const { isLocked, lockReason } = useOutletLockStatus(stop, allStops);

  return (
    <div
      className={`bg-surface border rounded-2xl p-5 shadow-sm space-y-4 transition-all relative h-full flex flex-col justify-between ${
        stop.status === 'DELIVERED'
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : stop.status === 'POD_SUBMITTED'
          ? 'border-blue-500/40 bg-blue-500/5'
          : stop.status === 'ARRIVED'
          ? 'border-amber-500/40 bg-amber-500/5'
          : isLocked
          ? 'border-amber-500/30 bg-surface opacity-90'
          : 'border-border-glass hover:border-blue-500/40'
      }`}
    >
      <div>
        <div className="flex-between-start gap-2 mb-3">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-md">
              Order #{stop.orderId}
            </span>
            <h4 className="font-bold text-on-surface text-base mt-1 line-clamp-1">{stop.outletName}</h4>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
              <LuMapPin className="text-blue-500 text-xs shrink-0" />
              <span>{stop.address}</span>
            </p>
          </div>

          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
              stop.status === 'DELIVERED'
                ? 'bg-emerald-500/10 text-emerald-600'
                : stop.status === 'POD_SUBMITTED'
                ? 'bg-blue-500/10 text-blue-600'
                : stop.status === 'ARRIVED'
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-surface-variant text-on-surface-variant'
            }`}
          >
            {stop.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs bg-surface-variant/30 p-2.5 rounded-xl border border-border-glass">
          <span className="text-on-surface-variant">Nilai Tagihan ({stop.paymentType}):</span>
          <span className="font-bold text-on-surface">Rp {stop.totalAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="pt-2 mt-auto">
        <DeliveryStopActions
          stop={stop}
          isLocked={isLocked}
          lockReason={lockReason}
          onRequestUnlock={onRequestUnlock}
          onAbsenIn={onAbsenIn}
          onOpenPOD={onOpenPOD}
          onAbsenOut={onAbsenOut}
        />
      </div>
    </div>
  );
};
