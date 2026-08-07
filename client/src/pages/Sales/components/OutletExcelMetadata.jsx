import React from 'react';
import { LuMapPin, LuCalendar, LuRoute, LuHash } from 'react-icons/lu';

/**
 * OutletExcelMetadata Component
 * Single Responsibility: Display structured outlet metadata matching the Excel columns:
 * CallplanName, DayOfWeek, CustomerID, Customer Name, Address, Latitude, Longitude.
 */
export const OutletExcelMetadata = ({ stop }) => {
  if (!stop) return null;

  const customerName = stop.customerName || stop.outletName;
  const customerId = stop.customerId || stop.outletCode;
  const callplanName = stop.callplanName || stop.callPlanName || 'RJP-CIMAHI-01';
  const dayOfWeek = stop.dayOfWeek || 'Senin';

  return (
    <div className="bg-surface-variant/25 border border-border-glass rounded-xl p-3.5 space-y-2.5 text-xs">
      {/* CallplanName & DayOfWeek */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block mb-0.5">
            CallplanName
          </span>
          <span className="font-semibold text-on-surface flex items-center gap-1.5">
            <LuRoute className="text-primary text-xs shrink-0" />
            <span className="truncate">{callplanName}</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block mb-0.5">
            DayOfWeek
          </span>
          <span className="font-medium text-on-surface flex items-center gap-1.5">
            <LuCalendar className="text-primary text-xs shrink-0" />
            <span>{dayOfWeek}</span>
          </span>
        </div>
      </div>

      {/* CustomerID & Customer Name */}
      <div className="grid grid-cols-2 gap-3 border-t border-border-glass/60 pt-2">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block mb-0.5">
            CustomerID
          </span>
          <span className="font-mono font-medium text-on-surface flex items-center gap-1">
            <LuHash className="text-on-surface-variant text-xs shrink-0" />
            <span>{customerId}</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block mb-0.5">
            Customer Name
          </span>
          <span className="font-medium text-on-surface truncate block" title={customerName}>
            {customerName}
          </span>
        </div>
      </div>

      {/* Address */}
      <div className="border-t border-border-glass/60 pt-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block mb-0.5">
          Address
        </span>
        <span className="text-on-surface font-normal text-xs leading-relaxed block">
          {stop.address}
        </span>
      </div>

      {/* Latitude & Longitude */}
      <div className="grid grid-cols-2 gap-3 border-t border-border-glass/60 pt-2">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block mb-0.5">
            Latitude
          </span>
          <span className="font-mono text-on-surface text-[11px]">
            {stop.latitude}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block mb-0.5">
            Longitude
          </span>
          <span className="font-mono text-on-surface text-[11px]">
            {stop.longitude}
          </span>
        </div>
      </div>
    </div>
  );
};
