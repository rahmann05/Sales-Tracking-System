import React from 'react';
import { LuTruck, LuSlash } from 'react-icons/lu';
import '../../../../styles/components/VehicleCapacityBadge.css';

/**
 * VehicleCapacityBadge Component
 * Single Responsibility: Display vehicle carton payload fill percentage and overload status.
 * 1 File = 1 Component
 */
export const VehicleCapacityBadge = ({ fillRate }) => {
  const isDanger = fillRate.percentage > 95 || fillRate.isOverloaded;
  const isWarning = fillRate.percentage > 80 && !isDanger;
  const fillClass = isDanger ? 'danger' : isWarning ? 'warning' : 'normal';

  return (
    <div className="vehicle-capacity-badge">
      <div className="vehicle-capacity-top">
        <span className="font-bold text-on-surface flex items-center gap-1.5">
          <LuTruck className="text-primary text-sm" />
          Kapasitas Muatan Box:
        </span>
        <span className="font-mono font-extrabold text-on-surface">
          {fillRate.totalCartons} / {fillRate.maxCartons} Karton ({fillRate.percentage}%)
        </span>
      </div>

      <div className="vehicle-capacity-bar-track">
        <div
          className={`vehicle-capacity-bar-fill ${fillClass}`}
          style={{ width: `${Math.min(100, fillRate.percentage)}%` }}
        />
      </div>

      {fillRate.isOverloaded && (
        <div className="flex items-center gap-1 text-xs font-bold text-rose-600 mt-1">
          <LuSlash />
          <span>PERINGATAN: Muatan melebihi kapasitas maksimal mobil!</span>
        </div>
      )}
    </div>
  );
};
