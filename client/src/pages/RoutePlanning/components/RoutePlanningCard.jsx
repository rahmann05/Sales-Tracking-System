import React from 'react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';

/**
 * RoutePlanningCard Component (Single Responsibility: Route Planning Item Display)
 * Equal height standard: min-h-[220px] with uniform 2-line title container and bottom-aligned progress bar.
 */
export const RoutePlanningCard = ({ route }) => {
  return (
    <Card className="rounded-2xl p-6 h-full min-h-[220px] flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
      {/* Top Header & Details Section */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-label-bold text-tertiary">{route.id}</span>
          <Badge variant={route.status}>{route.status}</Badge>
        </div>

        <h3 className="text-base md:text-lg font-bold text-on-surface min-h-[3rem] line-clamp-2 leading-snug mb-1">
          {route.name}
        </h3>
        <p className="text-xs text-on-surface-variant">
          Sales Rep: <strong className="text-on-surface">{route.rep}</strong>
        </p>
      </div>

      {/* Bottom Progress Section (Always aligned at the bottom) */}
      <div className="pt-4 mt-auto">
        <div className="flex justify-between text-xs text-on-surface-variant mb-2">
          <span>Progres Kunjungan ({route.stops} Toko)</span>
          <span className="font-bold text-on-surface">{route.completion}</span>
        </div>

        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary transition-all duration-300"
            style={{ width: route.completion }}
          ></div>
        </div>
      </div>
    </Card>
  );
};
