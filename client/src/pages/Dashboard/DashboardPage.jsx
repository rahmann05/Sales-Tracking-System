import React, { useState, useEffect } from 'react';
import { ActiveRoutesList } from './components/ActiveRoutesList';
import { MapView } from './components/MapView';
import { SelectedRoutePanel } from './components/SelectedRoutePanel';
import { useRouteFilter } from '../../hooks/useRouteFilter';
import '../../styles/pages/Dashboard.css';

const initialRoutesData = [
  {
    id: '#SF-8492',
    name: 'Downtown Tech Hub',
    status: 'In Transit',
    borderColor: 'var(--secondary-fixed)',
    repName: 'Budi Santoso',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    stops: [
      { title: 'Salesforce Tower', subtitle: 'Departed 09:15 AM', active: true },
      { title: 'Transamerica Pyramid', subtitle: 'ETA 10:30 AM', active: false },
    ],
    distance: '3.2 mi',
    stopsLeft: '4/6',
  },
  {
    id: '#SF-8493',
    name: 'Mission District',
    status: 'Delayed',
    borderColor: 'var(--error)',
    repName: 'Siti Rahma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    warning: 'Traffic delay reported on Route 101',
    stops: [
      { title: 'Mission Rock Office', subtitle: 'Stuck in traffic', active: true },
    ],
    distance: '5.8 mi',
    stopsLeft: '2/5',
  },
  {
    id: '#SF-8491',
    name: 'Financial District',
    status: 'Completed',
    borderColor: 'var(--outline-variant)',
    repName: 'Agus Wijaya',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    stops: [],
    distance: '4.1 mi',
    stopsLeft: '0/6',
  },
];

export const DashboardPage = ({ searchQuery = '' }) => {
  const {
    routes,
    setQuery,
    filterStatus,
    filterByStatus,
  } = useRouteFilter(initialRoutesData);

  const [selectedRoute, setSelectedRoute] = useState(initialRoutesData[0]);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery, setQuery]);

  return (
    <div className="dashboard-wrapper">
      {/* Interactive Map Component */}
      <MapView locationName={selectedRoute?.name || 'SF Bay Area'} />

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
