import React from 'react';
import { LuMapPin, LuPackageCheck } from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';

/**
 * DeliveryStopCard Component (Single Responsibility: Drop Point Card in H+1 Manifest)
 * 1 File per Component
 */
export const DeliveryStopCard = ({ stop, onOpenPOD }) => {
  return (
    <div
      className={`bg-surface border rounded-2xl p-5 shadow-sm space-y-4 transition-all relative ${
        stop.status === 'DELIVERED'
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-border-glass hover:border-blue-500/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-md">
            Order #{stop.orderId}
          </span>
          <h4 className="font-bold text-on-surface text-base mt-1">{stop.outletName}</h4>
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <LuMapPin className="text-blue-500 text-xs" />
            {stop.address}
          </p>
        </div>

        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            stop.status === 'DELIVERED'
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-blue-500/10 text-blue-600'
          }`}
        >
          {stop.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs bg-surface-variant/30 p-2.5 rounded-xl border border-border-glass">
        <span className="text-on-surface-variant">Nilai Tagihan ({stop.paymentType}):</span>
        <span className="font-bold text-on-surface">Rp {stop.totalAmount.toLocaleString('id-ID')}</span>
      </div>

      <div>
        {stop.status === 'PENDING' ? (
          <button
            type="button"
            onClick={() => onOpenPOD(stop)}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <LuPackageCheck className="text-base" />
            <span>Tiba di Drop Point & Submit POD</span>
          </button>
        ) : (
          <div className="w-full text-center text-xs text-emerald-600 font-bold py-1 flex items-center justify-center gap-1">
            <FiCheckCircle className="text-base" />
            <span>Pengiriman Selesai ({stop.checkOutTime || 'Selesai'})</span>
          </div>
        )}
      </div>
    </div>
  );
};
