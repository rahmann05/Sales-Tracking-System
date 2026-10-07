import React from "react";
import { LuTruck } from "react-icons/lu";
import { STATUS_CONFIG, STOP_STATUS_CONFIG } from "./WarehouseDashboard.shared";
export const RouteCard = ({
  route
}) => {
  const cfg = STATUS_CONFIG[route.status] || {};
  const deliveredCount = route.stops.filter(s => s.status === 'DELIVERED').length;
  const totalStops = route.stops.length;
  const progress = totalStops > 0 ? Math.round(deliveredCount / totalStops * 100) : 0;
  return <div className="bg-surface border border-border-glass border-b-[3.5px] border-b-neutral-300 dark:border-b-neutral-700 rounded-2xl p-4 shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-xs">
            <LuTruck className="text-lg text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">{route.code}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{
              color: cfg.color,
              backgroundColor: cfg.bg
            }}>
                {cfg.label}
              </span>
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              {route.vehicle?.name} ({route.vehicle?.code}) • Supir: {route.driver?.name}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">{route.totalCartons}</div>
          <div className="text-[10px] text-on-surface-variant">Karton</div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-on-surface-variant mb-1">
          <span>{deliveredCount}/{totalStops} Toko Terkirim</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{
          width: `${progress}%`,
          backgroundColor: progress === 100 ? '#16a34a' : '#2563eb'
        }} />
        </div>
      </div>

      {/* Stop list preview */}
      <div className="space-y-1.5">
        {route.stops.map((stop, idx) => {
        const stopCfg = STOP_STATUS_CONFIG[stop.status] || {};
        return <div key={stop.id || idx} className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-surface-variant/30">
              <span className="w-5 h-5 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0">
                {idx + 1}
              </span>
              <span className="flex-1 text-on-surface font-medium min-w-0 whitespace-normal break-words">{stop.outlet?.name}</span>
              <span className="text-[10px] font-semibold shrink-0" style={{
            color: stopCfg.color
          }}>
                {stopCfg.label}
              </span>
              <span className="text-on-surface-variant shrink-0">{stop.allocatedCartons ?? stop.packingList?.totalCartons ?? 0} krt</span>
            </div>;
      })}
      </div>
    </div>;
};
