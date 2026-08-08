import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveRoutesList } from './components/ActiveRoutesList';
import { GoogleClusterRouteMap } from './components/GoogleClusterRouteMap';
import { useRouteFilter } from '../../hooks/useRouteFilter';
import '../../styles/pages/Dashboard.css';

export const DashboardPage = ({ searchQuery = '' }) => {
  const { user, activeRoutes = [], salesStops = [] } = useApp();

  const {
    routes,
    setQuery,
    filterStatus,
    filterByStatus,
  } = useRouteFilter(activeRoutes);

  // Selected Sales route (for SPV/Manager view)
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Selected Outlet (for auto-focusing map panTo)
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery, setQuery]);

  return (
    <div className="dashboard-wrapper">
      {/* Interactive Google Maps Component */}
      <GoogleClusterRouteMap
        allStops={salesStops}
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
            salesStops={salesStops}
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
