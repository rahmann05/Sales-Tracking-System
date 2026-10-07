import React, { useState } from 'react';
import { LuTrash2, LuTruck, LuCheck } from "react-icons/lu";
import { STATUS_CONFIG } from "./DeliveryRouteBuilder.shared";
export const RouteCard = ({
  route,
  onStatusUpdate,
  onDelete
}) => {
  const cfg = STATUS_CONFIG[route.status] || {};
  const [expanded, setExpanded] = useState(false);
  return <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-variant/30" onClick={() => setExpanded(!expanded)}>
        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
          <LuTruck className="text-lg text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-on-surface">{route.code}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{
            color: cfg.color,
            backgroundColor: cfg.bg
          }}>{cfg.label}</span>
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">
            {route.vehicle?.name} • {route.driver?.name} • {new Date(route.date).toLocaleDateString('id-ID')} • {route.totalCartons} Karton • {route.stops?.length || 0} Toko
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {cfg.action && <button onClick={e => {
          e.stopPropagation();
          onStatusUpdate(route.id, cfg.nextStatus);
        }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors" style={{
          backgroundColor: cfg.nextStatus === 'READY' ? '#2563eb' : '#d97706'
        }}>
              <LuCheck className="inline mr-1" />{cfg.action}
            </button>}
          {route.status === 'DRAFT' && <button onClick={e => {
          e.stopPropagation();
          onDelete(route.id);
        }} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
              <LuTrash2 className="text-sm" />
            </button>}
        </div>
      </div>

      {expanded && <div className="px-4 pb-4 space-y-2 border-t border-border-glass pt-3">
          {route.stops?.map((stop, idx) => <div key={stop.id || idx} className="flex items-center gap-3 text-xs py-2 px-3 rounded-lg bg-surface-variant/30">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-on-surface min-w-0 whitespace-normal break-words">{stop.outlet?.name}</div>
                <div className="text-on-surface-variant min-w-0 whitespace-normal break-words">{stop.outlet?.address}</div>
              </div>
              <span className="text-on-surface-variant shrink-0">{stop.packingList?.code}</span>
              <span className="font-semibold text-on-surface shrink-0">{stop.allocatedCartons ?? stop.packingList?.totalCartons ?? 0} krt</span>
            </div>)}
          {route.notes && <div className="text-xs text-on-surface-variant bg-surface-variant/20 rounded-lg p-2 mt-2">
              Catatan: {route.notes}
            </div>}
        </div>}
    </div>;
};
