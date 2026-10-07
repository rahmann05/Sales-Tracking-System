import { ReturnReceiptAction } from './ReturnReceiptAction';
import React from 'react';
import { LuTruck, LuClock } from "react-icons/lu";
import { ROUTE_STATUS, STATUS_ICON, STATUS_COLOR, STATUS_LABEL } from "./DeliveryMonitor.shared";
export const MonitorRouteCard = ({
  route,
  expanded,
  onToggle,
  onReceived
}) => {
  const statusCfg = ROUTE_STATUS[route.status] || {};
  const deliveredCount = route.stops.filter(s => s.status === 'DELIVERED').length;
  const totalStops = route.stops.length;
  const progress = totalStops > 0 ? Math.round(deliveredCount / totalStops * 100) : 0;
  return <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-variant/30" onClick={onToggle}>
        <div className="p-2 rounded-xl" style={{
        backgroundColor: statusCfg.color + '15'
      }}>
          <LuTruck className="text-lg" style={{
          color: statusCfg.color
        }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-on-surface">{route.vehicle?.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{
            color: statusCfg.color,
            backgroundColor: statusCfg.color + '20'
          }}>
              {statusCfg.label}
            </span>
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">
            {route.code} • Supir: {route.driver?.name} • {deliveredCount}/{totalStops} Toko
          </div>
        </div>
        <div className="w-16">
          <div className="text-center text-xs font-bold" style={{
          color: progress === 100 ? '#16a34a' : statusCfg.color
        }}>{progress}%</div>
          <div className="w-full h-1.5 bg-surface-variant rounded-full mt-1 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
            width: `${progress}%`,
            backgroundColor: progress === 100 ? '#16a34a' : statusCfg.color
          }} />
          </div>
        </div>
      </div>

      {expanded && <div className="px-4 pb-4 space-y-2 border-t border-border-glass pt-3">
          {route.stops.map((stop, idx) => {
        const Icon = STATUS_ICON[stop.status] || LuClock;
        const color = STATUS_COLOR[stop.status] || '#6b7280';
        const label = STATUS_LABEL[stop.status] || '-';
        return <div key={stop.id || idx}><div className="flex items-center gap-3 text-xs py-2 px-3 rounded-lg bg-surface-variant/30">
                <Icon className="text-base shrink-0" style={{
              color
            }} />
                <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-on-surface min-w-0 whitespace-normal break-words">{stop.outlet?.name}</div>
                </div>
                <span className="text-[10px] font-semibold shrink-0" style={{
              color
            }}>{label}</span>
                <span className="text-on-surface-variant shrink-0">{stop.allocatedCartons ?? stop.packingList?.totalCartons ?? 0} krt</span>
              </div><ReturnReceiptAction stop={stop} onReceived={onReceived} /></div>;
      })}
        </div>}
    </div>;
};
