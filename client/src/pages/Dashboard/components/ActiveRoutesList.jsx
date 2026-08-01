import React from 'react';
import { RouteCard } from './RouteCard';
import { Card } from '../../../components/common/Card';

/**
 * ActiveRoutesList Component (Single Responsibility: Route List Container & Filter Control - Max 3 Items)
 * 1 File per Component
 */
export const ActiveRoutesList = ({ routes, selectedRoute, onSelectRoute, filterStatus, onFilterStatusChange }) => {
  const statusOptions = ['ALL', 'In Transit', 'Delayed', 'Completed'];
  const maxThreeRoutes = routes.slice(0, 3);

  return (
    <Card
      variant="panel"
      className="!p-0 rounded-[28px] flex flex-col shadow-lg overflow-hidden border border-border-glass max-h-[380px] lg:max-h-[420px] bg-white/95 backdrop-blur-xl"
    >
      {/* Header & Filter Controls Section */}
      <div className="p-4 border-b border-border-glass flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-headline-md font-extrabold text-on-surface">Active Routes</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Real-time field team progress</p>
          </div>
          <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
            {maxThreeRoutes.length} Active
          </span>
        </div>

        {/* Filter Quick Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {statusOptions.map((status) => {
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => onFilterStatusChange(status)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border-none cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Route List (Max 3 Sales) */}
      <div className="overflow-y-auto p-3 flex flex-col gap-2.5 max-h-[280px]">
        {maxThreeRoutes.length === 0 ? (
          <div className="text-center py-6 text-on-surface-variant text-xs font-semibold">
            Tidak ada rute yang cocok dengan filter.
          </div>
        ) : (
          maxThreeRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onClick={() => onSelectRoute(route)}
              isSelected={selectedRoute?.id === route.id}
            />
          ))
        )}
      </div>
    </Card>
  );
};
