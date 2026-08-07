import React from 'react';
import { LuMapPin, LuNavigation } from 'react-icons/lu';
import { OutletPhoto } from './OutletPhoto';
import { OutletExcelMetadata } from './OutletExcelMetadata';
import { OutletGooglePlaceInfo } from './OutletGooglePlaceInfo';
import { SalesStopActions } from './SalesStopActions';
import { useOutletLockStatus } from '../../../hooks/useOutletLockStatus';

/**
 * SalesStopCard Component
 * Single Responsibility: Container card orchestrating outlet information,
 * photo, Excel metadata, Google API information, Geofence status, lock state, and actions.
 * Equal height standard: h-full flex flex-col justify-between
 */
export const SalesStopCard = ({
  stop,
  allStops = [],
  onAbsenIn,
  onAbsenOut,
  onInputOrder,
  onClosedReport,
  onRequestUnlock,
}) => {
  const isInsideGeofence = stop.currentDistance <= stop.radiusMeters;
  const customerName = stop.customerName || stop.outletName;
  const customerId = stop.customerId || stop.outletCode;

  // Single Responsibility Hook for calculating lock status
  const { isLocked, lockReason } = useOutletLockStatus(stop, allStops);

  return (
    <div
      className={`bg-surface border rounded-2xl p-5 shadow-sm space-y-4 transition-all relative h-full flex flex-col justify-between ${
        stop.status === 'ORDERED'
          ? 'border-blue-500/40 bg-blue-500/5'
          : stop.status === 'VISITED' || stop.status === 'COMPLETED'
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : stop.status === 'CLOSED'
          ? 'border-rose-500/40 bg-rose-500/5'
          : stop.status === 'SKIPPED'
          ? 'border-amber-500/40 bg-amber-500/5 opacity-75'
          : isLocked
          ? 'border-amber-500/30 bg-surface opacity-90'
          : 'border-border-glass hover:border-primary/40'
      }`}
    >
      {/* Top Body Details */}
      <div className="space-y-3.5">
        {/* 1. Header Bar: Sequence Number, Store Title, and Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              #{stop.sequence}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap min-h-[1.75rem]">
                <h4 className="font-bold text-on-surface text-base tracking-tight">{customerName}</h4>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-surface-variant text-on-surface-variant">
                  {customerId}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                <LuMapPin className="text-primary text-xs shrink-0" />
                <span>{stop.address}</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
              stop.status === 'ORDERED'
                ? 'bg-blue-500/10 text-blue-600'
                : stop.status === 'VISITED' || stop.status === 'COMPLETED'
                ? 'bg-emerald-500/10 text-emerald-600'
                : stop.status === 'ARRIVED'
                ? 'bg-amber-500/10 text-amber-600'
                : stop.status === 'CLOSED'
                ? 'bg-rose-500/10 text-rose-600'
                : stop.status === 'SKIPPED'
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-surface-variant text-on-surface-variant'
            }`}
          >
            {stop.status}
          </span>
        </div>

        {/* 2. Outlet Photo Section: ONLY displayed if Google Places photo is available */}
        <OutletPhoto
          photoUrl={stop.googlePlaceDetails?.photoUrl || stop.photoUrl}
          customerName={customerName}
        />

        {/* 3. Excel Columns Metadata Grid */}
        <OutletExcelMetadata stop={stop} />

        {/* 4. Google Places API Details Section */}
        <OutletGooglePlaceInfo googlePlaceDetails={stop.googlePlaceDetails} />

        {/* 5. Geofence Distance Indicator */}
        <div className="flex items-center justify-between text-xs bg-surface-variant/30 px-3 py-2 rounded-xl">
          <span className="text-on-surface-variant">Jarak Geofence GPS:</span>
          <span
            className={`font-bold flex items-center gap-1 ${
              isInsideGeofence ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            <LuNavigation className="text-xs" />
            {stop.currentDistance} meter ({isInsideGeofence ? 'Dalam Geofence ≤50m' : 'Luar Geofence >50m'})
          </span>
        </div>
      </div>

      {/* 6. Action Buttons Section (Pinned cleanly to bottom) */}
      <div className="pt-2 mt-auto">
        <SalesStopActions
          stop={stop}
          isLocked={isLocked}
          lockReason={lockReason}
          onRequestUnlock={onRequestUnlock}
          onAbsenIn={onAbsenIn}
          onAbsenOut={onAbsenOut}
          onInputOrder={onInputOrder}
          onClosedReport={onClosedReport}
        />
      </div>
    </div>
  );
};
