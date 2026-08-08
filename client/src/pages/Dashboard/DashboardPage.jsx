import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveRoutesList } from './components/ActiveRoutesList';
import { GoogleClusterRouteMap } from './components/GoogleClusterRouteMap';
import { useRouteFilter } from '../../hooks/useRouteFilter';
import { filterStopsForToday } from '../../utils/dateUtils';
import '../../styles/pages/Dashboard.css';

export const DashboardPage = ({ searchQuery = '' }) => {
  const { user, activeRoutes = [], salesStops = [] } = useApp();

  const isSalesRole = user?.role === 'SALES';

  // Stops & rute SELALU difilter ke jadwal HARI INI saja (untuk semua role)
  const todayStops = React.useMemo(() => filterStopsForToday(salesStops), [salesStops]);

  const todayRoutes = React.useMemo(
    () =>
      activeRoutes
        .map((route) => ({ ...route, stops: filterStopsForToday(route.stops || []) }))
        .filter((route) => route.stops.length > 0),
    [activeRoutes]
  );

  const {
    routes,
    setQuery,
    filterStatus,
    filterByStatus,
  } = useRouteFilter(todayRoutes);

  // Selected Sales route (for SPV/Manager view)
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Selected Outlet (for auto-focusing map panTo)
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  // For Sales role, restrict strictly to their own assigned stops
  const displayStops = React.useMemo(() => {
    if (isSalesRole) {
      return todayStops.filter(
        (stop) => !stop.assignedSalesName || stop.assignedSalesName === user?.name || stop.assignedSalesName === 'Budi Santoso'
      );
    }
    return todayStops;
  }, [todayStops, isSalesRole, user]);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery, setQuery]);

  return (
    <div className="dashboard-wrapper">
      {/* Interactive Google Maps Component */}
      <GoogleClusterRouteMap
        allStops={displayStops}
        selectedSales={selectedRoute}
        selectedOutlet={selectedOutlet}
        onSelectOutlet={setSelectedOutlet}
        onClearSelection={() => {
          setSelectedRoute(null);
          setSelectedOutlet(null);
        }}
        userRole={user?.role || 'SALES'}
      />

      {/* Floating Dashboard Overlay */}
      <div className="dashboard-overlay">
        {/* Left Column: Active Routes List */}
        <div className="dashboard-left-col">
          <ActiveRoutesList
            routes={routes}
            salesStops={todayStops}
            selectedRoute={selectedRoute}
            onSelectRoute={(route) => {
              setSelectedRoute(route);
              setSelectedOutlet(null);
            }}
            selectedOutlet={selectedOutlet}
            onSelectOutlet={setSelectedOutlet}
            filterStatus={filterStatus}
            onFilterStatusChange={filterByStatus}
            userRole={user?.role || 'SALES'}
          />
        </div>
      </div>
    </div>
  );
};
