import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { Badge } from '../../../components/common/Badge';
import { Avatar } from '../../../components/common/Avatar';

/**
 * RouteCard Component (Single Responsibility: Display Single Sales Route Item)
 * 1 File per Component
 */
export const RouteCard = ({ route, isSelected, onClick }) => {
  const stopCount = Array.isArray(route?.stops) ? route.stops.length : (route?.stops || 0);

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-surface-container-lowest border-primary shadow-md'
          : 'bg-surface-container-low/60 border-transparent hover:bg-surface-container-low'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-on-surface">
            {route.name}
          </span>
          <Badge status={route.status} />
        </div>
        <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
          {stopCount} Stops
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-on-surface-variant mt-3">
        <div className="flex items-center gap-2">
          <Avatar src={route.avatar} name={route.repName} size="sm" />
          <span className="font-semibold text-on-surface">
            {route.repName}
          </span>
        </div>

        {(route.warning || route.hasDelayNotice) && (
          <span className="flex items-center gap-1 text-error font-bold text-[11px]">
            <FiAlertTriangle className="text-sm" />
            Delay Notice
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-3">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${route.progress || 50}%` }}
        ></div>
      </div>
    </div>
  );
};
