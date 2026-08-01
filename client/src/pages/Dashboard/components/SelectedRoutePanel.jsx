import React from 'react';
import { LuCar, LuMapPin, LuClock } from 'react-icons/lu';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';

/**
 * SelectedRoutePanel Component (Single Responsibility: Display Action Bar for Selected Route)
 * 1 File per Component
 */
export const SelectedRoutePanel = ({ route }) => {
  if (!route) return null;

  return (
    <Card
      variant="panel"
      className="!p-4 md:!p-5 shadow-xl pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center justify-between w-full rounded-3xl gap-4 border border-border-glass bg-white/95 backdrop-blur-xl"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center border border-tertiary/20 text-xl shrink-0">
          <LuCar />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="bg-primary text-on-primary text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
              Selected Order
            </span>
            <span className="text-xs font-bold text-on-surface-variant">
              {route.id}
            </span>
          </div>
          <h3 className="text-sm md:text-base font-extrabold text-on-surface truncate">{route.name}</h3>
          <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant flex-wrap">
            <span className="flex items-center gap-1">
              <LuMapPin className="text-sm shrink-0" />
              Current: {route.name}
            </span>
            <span className="flex items-center gap-1">
              <LuClock className="text-sm shrink-0" />
              Next: 15 mins
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border-glass sm:pl-5">
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            Live Status
          </span>
          <p className="flex items-center gap-1.5 text-xs font-bold text-secondary">
            <span className="pulse-dot"></span>
            {route.status}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => alert(`Menghubungi sales rep: ${route.repName}`)}
          className="shrink-0"
        >
          Contact Rep
        </Button>
      </div>
    </Card>
  );
};
