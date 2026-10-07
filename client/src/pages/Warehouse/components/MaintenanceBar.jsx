import React from 'react';
import { FiAlertTriangle } from "react-icons/fi"; // Use fi-icons for missing lu-icons

export const MaintenanceBar = ({
  label,
  currentKm,
  lastChangeKm,
  threshold
}) => {
  const used = Math.max(0, currentKm - (lastChangeKm || 0));
  const percentage = Math.min(100, used / threshold * 100);
  const remaining = Math.max(0, threshold - used);
  let colorClass = 'bg-primary';
  let alert = false;
  if (percentage >= 100) {
    colorClass = 'bg-error';
    alert = true;
  } else if (percentage >= 80) {
    colorClass = 'bg-warning';
  }
  return <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-on-surface flex items-center gap-1">
          {label}
          {alert && <FiAlertTriangle className="text-error" />}
        </span>
        <span className="text-on-surface-variant">
          {Math.round(used).toLocaleString('id-ID')} / {threshold.toLocaleString('id-ID')} km
        </span>
      </div>
      <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{
        width: `${percentage}%`
      }} />
      </div>
      <div className="text-[10px] text-right mt-1 text-on-surface-variant">
        {alert ? 'Waktunya ganti!' : `Sisa ${Math.round(remaining).toLocaleString('id-ID')} km`}
      </div>
    </div>;
};
