import React from 'react';
import { RouteCard } from './RouteCard';
import { SalesOutletItemCard } from './SalesOutletItemCard';
import { Card } from '../../../components/common/Card';

/**
 * ActiveRoutesList Component
 * Single Responsibility: Container for Active Routes list.
 * Displays Sales assigned PJP outlets when logged in as Sales, or Sales Reps list for Supervisor/Manager.
 * 1 File = 1 Component
 */
export const ActiveRoutesList = ({
  routes = [],
  salesStops = [],
  selectedRoute,
  onSelectRoute,
  selectedOutlet,
  onSelectOutlet = () => {},
  filterStatus,
  onFilterStatusChange,
  userRole = 'SUPERVISOR',
}) => {
  const isSalesRole = userRole === 'SALES';
  const statusOptions = ['ALL', 'In Transit', 'Delayed', 'Completed'];

  return (
    <Card
      variant="panel"
      className="!p-0 rounded-[28px] flex flex-col shadow-lg overflow-hidden border border-border-glass max-h-[440px] bg-white/95 backdrop-blur-xl"
    >
      {/* Header & Filter Controls Section */}
      <div className="p-4 border-b border-border-glass flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-headline-md font-extrabold text-on-surface">
              {isSalesRole ? 'Toko RJP Hari Ini' : 'Active Routes'}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isSalesRole ? 'Daftar outlet yang diassign pada Anda' : 'Real-time field team progress'}
            </p>
          </div>
          <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
            {isSalesRole ? `${salesStops.length} Toko` : `${routes.length} Active`}
          </span>
        </div>

        {/* Filter Quick Pills for Supervisor/Manager */}
        {!isSalesRole && (
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
        )}
      </div>

      {/* List Container */}
      <div className="overflow-y-auto p-3 flex flex-col gap-2.5 max-h-[340px]">
        {isSalesRole ? (
          salesStops.length === 0 ? (
            <div className="text-center py-6 text-on-surface-variant text-xs font-semibold">
              Tidak ada outlet RJP yang diassign hari ini.
            </div>
          ) : (
            salesStops.map((stop, idx) => (
              <SalesOutletItemCard
                key={stop.id || idx}
                stop={stop}
                sequence={idx + 1}
                isSelected={selectedOutlet && (selectedOutlet.id === stop.id || selectedOutlet.outletName === stop.outletName)}
                onClick={() => onSelectOutlet(stop)}
              />
            ))
          )
        ) : routes.length === 0 ? (
          <div className="text-center py-6 text-on-surface-variant text-xs font-semibold">
            Tidak ada rute yang cocok dengan filter.
          </div>
        ) : (
          routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              isSelected={selectedRoute?.id === route.id}
              onClick={() => onSelectRoute(route)}
            />
          ))
        )}
      </div>
    </Card>
  );
};
