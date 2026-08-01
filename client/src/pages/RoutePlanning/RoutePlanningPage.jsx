import React, { useState } from 'react';
import { RoutePlanningHeader } from './components/RoutePlanningHeader';
import { RoutePlanningCard } from './components/RoutePlanningCard';
import { RouteMapView } from './components/RouteMapView';
import '../../styles/pages/RoutePlanning.css';

const initialRoutesData = [
  { id: 'R-101', name: 'Rute Central Business District', rep: 'Budi Santoso', stops: 8, completion: '75%', status: 'Active' },
  { id: 'R-102', name: 'Rute Kawasan Industri Barat', rep: 'Siti Rahma', stops: 5, completion: '40%', status: 'In Transit' },
  { id: 'R-103', name: 'Rute Distrik Perdagangan Timur', rep: 'Agus Wijaya', stops: 10, completion: '100%', status: 'Completed' },
  { id: 'R-104', name: 'Rute Mitra Retail Selatan', rep: 'Dewi Lestari', stops: 6, completion: '0%', status: 'Scheduled' },
];

export const RoutePlanningPage = ({ searchQuery = '' }) => {
  const [selectedRoute, setSelectedRoute] = useState(initialRoutesData[0]);

  const handleCreateRoute = () => {
    alert('Membuka dialog pembuatan rute sales baru');
  };

  const filteredRoutes = initialRoutesData.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.rep.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header Section */}
      <RoutePlanningHeader onCreateRoute={handleCreateRoute} />

      {/* Real Google Maps Interactive View for Selected Route */}
      <RouteMapView selectedRouteName={selectedRoute?.name || 'Rute Central Business District'} />

      {/* Route Cards Grid */}
      <div className="route-cards-grid">
        {filteredRoutes.map((route) => (
          <div
            key={route.id}
            onClick={() => setSelectedRoute(route)}
            className={`cursor-pointer transition-all ${
              selectedRoute?.id === route.id ? 'ring-2 ring-primary rounded-2xl shadow-md' : ''
            }`}
          >
            <RoutePlanningCard route={route} />
          </div>
        ))}
      </div>
    </div>
  );
};
