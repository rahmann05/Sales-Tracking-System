import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { LuMapPin } from 'react-icons/lu';
import { Badge } from '../../../shared/components/common/Badge';
import { Avatar } from '../../../shared/components/common/Avatar';

/**
 * RouteCard Component (Single Responsibility: Display Single Sales Route Item)
 * Equal height standard: h-full min-h-[110px] flex flex-col justify-between
 */
export const RouteCard = ({
  route,
  isSelected,
  onClick,
  clusterColor = '#2563eb',
  isFallbackRoute = false,
}) => {
  const stopCount = Array.isArray(route?.stops) ? route.stops.length : route?.stops || 0;
  const progressPct = Math.max(0, Math.min(100, Number(route?.progress ?? 0) || 0));

  return (
    <div
      onClick={onClick}
      style={{
        '--cluster-color': clusterColor,
        borderLeft: '4px solid var(--cluster-color)',
        ...(isSelected ? { borderColor: 'var(--cluster-color)' } : {}),
      }}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none h-full min-h-[110px] flex flex-col justify-between ${
        isSelected
          ? 'bg-surface-container-lowest shadow-md'
          : 'bg-surface-container-low/60 border-transparent hover:bg-surface-container-low'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          {route.code ? <p className="text-xs font-mono">{route.code}</p> : <span />}
          {isSelected && isFallbackRoute ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <FiAlertTriangle className="text-[11px] shrink-0" aria-hidden="true" />
              Garis lurus (fallback)
            </span>
          ) : null}
        </div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              className="route-card-cluster-icon"
              aria-hidden="true"
              title={route.clusterName || 'Cluster sales'}
            >
              <LuMapPin />
            </span>
            <span className="text-xs font-extrabold text-on-surface">
              {route.clusterName ? route.clusterName : route.name || 'Rute Harian'}
            </span>
            <Badge status={route.status} />
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded shrink-0">
            {stopCount} Stops
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-on-surface-variant mt-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar src={route.avatar} name={route.repName || route.name} size="sm" />
            <span className="font-semibold text-on-surface truncate">
              {route.repName || route.name}
            </span>
            <span className="route-card-cluster-dot" aria-hidden="true" />
          </div>

          {route.warning || route.hasDelayNotice ? (
            <span className="flex items-center gap-1 text-error font-bold text-[11px] shrink-0">
              <FiAlertTriangle className="text-sm" aria-hidden="true" />
              Delay Notice
            </span>
          ) : null}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%`, backgroundColor: 'var(--cluster-color)' }}
        />
      </div>
    </div>
  );
};
