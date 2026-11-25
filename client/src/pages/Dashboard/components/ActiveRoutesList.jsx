import React from 'react';
import { RouteCard } from './RouteCard';
import { SalesOutletItemCard } from './SalesOutletItemCard';
import { Card } from '../../../shared/components/common/Card';
import { LuUser, LuChevronDown, LuExternalLink, LuTriangleAlert } from 'react-icons/lu';

const EMPTY_ARRAY = [];
const EMPTY_MAP = {};
const NOOP = () => {};

/**
 * ActiveRoutesList Component (Rute Hari Ini)
 * Single Responsibility: Container panel for today's sales routes and stops.
 * Features sales filter, status filters, route cards, and outlet list expansion.
 */
export const ActiveRoutesList = ({
  routes = EMPTY_ARRAY,
  salesStops = EMPTY_ARRAY,
  selectedRoute,
  onSelectRoute = NOOP,
  selectedOutlet,
  onSelectOutlet = NOOP,
  userRole = 'SUPERVISOR',
  selectedSalesName = 'ALL',
  onSelectSalesName = NOOP,
  salesOptions = EMPTY_ARRAY,
  clusterColorByRouteId = EMPTY_MAP,
  routeStatus = null,
}) => {
  const isSalesRole = userRole === 'SALES';

  return (
    <Card className="!p-0 rounded-[28px] flex flex-col shadow-xl overflow-hidden border border-border-glass max-h-[min(560px,calc(100vh-13rem))] w-full bg-white/95 backdrop-blur-xl transition-all">
      {/* Header Section */}
      <div className="p-4 border-b border-border-glass flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
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
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full shrink-0">
            {routes.length} Rute
          </span>
        </div>

        {/* Filter Sales Dropdown (Always visible when options exist, or for SPV/Admin) */}
        {salesOptions.length > 0 ? (
          <div className="relative w-full">
            <label htmlFor="dashboard-sales-filter" className="visually-hidden">
              Filter sales
            </label>
            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-border-glass">
              <LuUser className="text-sm text-primary flex-shrink-0" aria-hidden="true" />
              <select
                id="dashboard-sales-filter"
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
              <LuChevronDown
                className="text-xs text-on-surface-variant pointer-events-none absolute right-3"
                aria-hidden="true"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* List of Routes */}
      <div className="overflow-y-auto p-3 flex flex-col gap-2.5 max-h-[min(340px,calc(100vh-22rem))] no-scrollbar">
        {routes.length === 0 ? (
          salesStops.length > 0 && isSalesRole ? (
            salesStops.map((stop, idx) => (
              <SalesOutletItemCard
                key={stop.id || idx}
                stop={stop}
                sequence={stop.sequence ?? idx + 1}
                isSelected={Boolean(
                  selectedOutlet &&
                    (selectedOutlet.id === stop.id || selectedOutlet.outletName === stop.outletName)
                )}
                onClick={() => onSelectOutlet(stop)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-on-surface-variant text-xs font-semibold flex flex-col items-center gap-1">
              <span>Tidak ada rute yang cocok dengan filter.</span>
              {selectedSalesName !== 'ALL' ? (
                <button
                  type="button"
                  onClick={() => onSelectSalesName('ALL')}
                  className="text-primary text-[11px] font-bold underline mt-1 cursor-pointer bg-transparent border-none"
                >
                  Reset filter sales
                </button>
              ) : null}
            </div>
          )
        ) : (
          routes.map((route) => {
            const isSelected = selectedRoute?.id === route.id;
            const routeColor = clusterColorByRouteId[route.id] || '#2563eb';
            const orderedStops = Array.isArray(route.stops)
              ? [...route.stops].sort(
                  (a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0)
                )
              : EMPTY_ARRAY;

            return (
              <div key={route.id} className="flex flex-col gap-1.5">
                <RouteCard
                  route={route}
                  isSelected={isSelected}
                  onClick={() => onSelectRoute(route)}
                  clusterColor={routeColor}
                  isFallbackRoute={isSelected && Boolean(routeStatus?.isFallback)}
                />

                {/* When route is selected, show ordered stops preview */}
                {isSelected && orderedStops.length > 0 ? (
                  <div
                    className="pl-3 pr-1 py-2 bg-surface-container-lowest/80 rounded-xl border border-primary/20 flex flex-col gap-1.5 animate-fadeIn"
                    style={{ '--cluster-color': routeColor }}
                  >
                    {routeStatus?.isFallback ? (
                      <div
                        role="status"
                        className="mx-1 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-start gap-1.5"
                      >
                        <LuTriangleAlert className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>
                          Mode fallback (garis lurus): rute jalan tidak tersedia saat ini.
                          {routeStatus.reason ? ` (${routeStatus.reason})` : ''}
                        </span>
                      </div>
                    ) : null}
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">
                      Daftar Toko / Outlet ({orderedStops.length}):
                    </div>
                    <ol
                      role="list"
                      className="flex flex-col gap-1 max-h-[176px] overflow-y-auto no-scrollbar list-none m-0 p-0"
                    >
                      {orderedStops.map((stop, sIdx) => {
                        const isStopSelected =
                          selectedOutlet?.id === stop.id ||
                          (stop.outletId && selectedOutlet?.id === stop.outletId);
                        const seqNum = Number(stop.sequence) > 0 ? Number(stop.sequence) : sIdx + 1;
                        return (
                          <li key={stop.id || sIdx}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectOutlet(stop);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors group border-0 ${
                                isStopSelected
                                  ? 'bg-primary/10 text-primary font-bold ring-1 ring-primary/30'
                                  : 'bg-transparent hover:bg-surface-container text-on-surface'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1 whitespace-normal break-words">
                                <span
                                  className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-xs"
                                  style={{ backgroundColor: 'var(--cluster-color)' }}
                                >
                                  {seqNum}
                                </span>
                                <span className="min-w-0 whitespace-normal break-words leading-tight">
                                  {stop.outletName || stop.customerName || `Toko #${seqNum}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    stop.status === 'VISITED'
                                      ? 'bg-green-100 text-green-700'
                                      : stop.status === 'ARRIVED'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-surface-container text-on-surface-variant'
                                  }`}
                                >
                                  {stop.status || 'PENDING'}
                                </span>
                                <LuExternalLink
                                  className="text-xs text-primary/60 group-hover:text-primary transition-colors shrink-0"
                                  aria-hidden="true"
                                />
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
