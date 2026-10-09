import React from 'react';
import { FiAlertTriangle } from "react-icons/fi"; // Use fi-icons for missing lu-icons

export const MaintenanceBar = ({status}) => {
  const {label,used,percentage,remaining,threshold,enabled,known,source,state}=status;
  let colorClass = 'bg-primary';
  let alert = false;
  if (state==='OVERDUE') {
    colorClass = 'bg-error';
    alert = true;
  } else if (state==='DUE_SOON') {
    colorClass = 'bg-warning';
  }
  return <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-on-surface flex items-center gap-1">
          {label}
          {alert && <FiAlertTriangle className="text-error" />}
        </span>
        <span className="text-on-surface-variant">
          {known?`${Math.round(used).toLocaleString('id-ID')} / ${threshold.toLocaleString('id-ID')} km`:'Data kilometer belum cukup'}
        </span>
      </div>
      <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{
        width: `${enabled&&known?percentage:0}%`
      }} />
      </div>
      <div className="text-[10px] text-right mt-1 text-on-surface-variant">
        {!enabled?'Pengingat dinonaktifkan':!known?'Belum dapat dihitung':alert?'Interval servis terlampaui':`Sisa ${Math.round(remaining).toLocaleString('id-ID')} km`} · {source==='VEHICLE'?'Interval khusus kendaraan':'Interval profil'}
      </div>
    </div>;
};
