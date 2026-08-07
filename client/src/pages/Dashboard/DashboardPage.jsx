import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveRoutesList } from './components/ActiveRoutesList';
import { MapView } from './components/MapView';
import { SelectedRoutePanel } from './components/SelectedRoutePanel';
import { useRouteFilter } from '../../hooks/useRouteFilter';
import '../../styles/pages/Dashboard.css';

export const DashboardPage = ({ searchQuery = '' }) => {
  const { activeRoutes = [] } = useApp();

  const {
    routes,
    setQuery,
    filterStatus,
    filterByStatus,
  } = useRouteFilter(activeRoutes);

  const [selectedRoute, setSelectedRoute] = useState(activeRoutes[0] || null);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery, setQuery]);

  return (
    <div className="dashboard-wrapper">
      {/* Interactive Map Component */}
      <MapView locationName={selectedRoute?.name || 'Area Cimahi - Bandung Barat'} />

      {/* Floating Dashboard Overlay */}
      <div className="dashboard-overlay">
        {/* Left Column: Active Routes List (OverviewCards moved to Top Navbar) */}
        <div className="dashboard-left-col">
          <ActiveRoutesList
            routes={routes}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
            filterStatus={filterStatus}
            onFilterStatusChange={filterByStatus}
          />
        </div>

        {/* Right Column: Selected Route Floating Panel */}
        <div className="dashboard-right-col">
          <SelectedRoutePanel route={selectedRoute} />
        </div>
      </div>
    </div>
  );
};
