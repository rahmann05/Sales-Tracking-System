import React from 'react';
import { RouteCard } from './RouteCard';
import { SalesOutletItemCard } from './SalesOutletItemCard';
import { Card } from '../../../shared/components/common/Card';
import { LuUser, LuChevronDown } from 'react-icons/lu';

/**
 * ActiveRoutesList Component (Rute Hari Ini)
 * Single Responsibility: Container panel for today's sales routes and stops.
 * Features sales filter, status filters, route cards, and outlet list expansion.
 */
export const ActiveRoutesList = ({
  routes = [],
  salesStops = [],
  selectedRoute,
  onSelectRoute = () => {},
  selectedOutlet,
  onSelectOutlet = () => {},
  userRole = 'SUPERVISOR',
  selectedSalesName = 'ALL',
  onSelectSalesName = () => {},
  salesOptions = [],
}) => {
  const isSalesRole = userRole === 'SALES';

  return (
    <Card
      variant="panel"
      className="!p-0 rounded-[28px] flex flex-col shadow-xl overflow-hidden border border-border-glass max-h-[520px] w-full bg-white/95 backdrop-blur-xl transition-all"
    >
      {/* Header Section */}
      <div className="p-4 border-b border-border-glass flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-on-surface tracking-tight">
              Rute Hari Ini
            </h2>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {isSalesRole
                ? 'Jadwal kunjungan rute sales hari ini'
                : 'Monitoring jadwal & progress rute sales hari ini'}
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {routes.length} Rute
          </span>
        </div>

        {/* Filter Sales Dropdown (Always visible when options exist, or for SPV/Admin) */}
        {salesOptions.length > 0 && (
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-border-glass">
              <LuUser className="text-sm text-primary flex-shrink-0" />
              <select
                value={selectedSalesName}
                onChange={(e) => onSelectSalesName(e.target.value)}
                className="w-full text-xs font-semibold bg-transparent text-on-surface border-none focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                <option value="ALL">Semua Sales ({salesOptions.length})</option>
                {salesOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <LuChevronDown className="text-xs text-on-surface-variant pointer-events-none absolute right-3" />
            </div>
          </div>
        )}
      </div>

      {/* List of Routes */}
      <div className="overflow-y-auto p-3 flex flex-col gap-2.5 max-h-[380px] no-scrollbar">
        {routes.length === 0 ? (
          salesStops.length > 0 && isSalesRole ? (
            salesStops.map((stop, idx) => (
              <SalesOutletItemCard
                key={stop.id || idx}
                stop={stop}
                sequence={idx + 1}
                isSelected={
                  selectedOutlet &&
                  (selectedOutlet.id === stop.id || selectedOutlet.outletName === stop.outletName)
                }
                onClick={() => onSelectOutlet(stop)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-on-surface-variant text-xs font-semibold flex flex-col items-center gap-1">
              <span>Tidak ada rute yang cocok dengan filter.</span>
              {selectedSalesName !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onSelectSalesName('ALL')}
                  className="text-primary text-[11px] font-bold underline mt-1 cursor-pointer bg-transparent border-none"
                >
                  Reset filter sales
                </button>
              )}
            </div>
          )
        ) : (
          routes.map((route) => {
            const isSelected = selectedRoute?.id === route.id;
            return (
              <div key={route.id} className="flex flex-col gap-1.5">
                <RouteCard
                  route={route}
                  isSelected={isSelected}
                  onClick={() => onSelectRoute(route)}
                />

                {/* When route is selected, show stops preview */}
                {isSelected && Array.isArray(route.stops) && route.stops.length > 0 && (
                  <div className="pl-3 pr-1 py-2 bg-surface-container-lowest/80 rounded-xl border border-primary/20 flex flex-col gap-1.5 animate-fadeIn">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">
                      Daftar Toko / Outlet ({route.stops.length}):
                    </div>
                    <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto no-scrollbar">
                      {route.stops.map((stop, sIdx) => {
                        const isStopSelected = selectedOutlet?.id === stop.id;
                        return (
                          <div
                            key={stop.id || sIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOutlet(stop);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isStopSelected
                                ? 'bg-primary/10 text-primary font-bold border border-primary/30'
                                : 'hover:bg-surface-container text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {sIdx + 1}
                              </span>
                              <span className="truncate">{stop.outletName || stop.customerName || `Toko #${sIdx + 1}`}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              stop.status === 'VISITED'
                                ? 'bg-green-100 text-green-700'
                                : stop.status === 'ARRIVED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}>
                              {stop.status || 'PENDING'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
