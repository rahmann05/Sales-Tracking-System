import React from 'react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';

/**
 * RoutePlanningCard Component (Single Responsibility: Route Planning Item Display)
 * 1 File per Component
 */
export const RoutePlanningCard = ({ route }) => {
  return (
    <Card className="rounded-2xl p-6">
      <div className="flex justify-between items-start mb-3">
        <span className="text-label-bold text-tertiary">{route.id}</span>
        <Badge variant={route.status}>{route.status}</Badge>
      </div>

      <h3 className="text-lg font-bold text-on-surface mb-1">{route.name}</h3>
      <p className="text-xs text-on-surface-variant mb-4">
        Sales Rep: <strong className="text-on-surface">{route.rep}</strong>
      </p>

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
    </Card>
  );
};
