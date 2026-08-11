import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveRoutesList } from './components/ActiveRoutesList';
import { useRouteFilter } from '../../hooks/useRouteFilter';
import { filterStopsForToday } from '../../utils/dateUtils';
import { useMap } from '../../context/MapContext';
import { useMapData } from '../../context/MapDataContext';
import '../../styles/pages/Dashboard.css';

export const DashboardPage = ({ searchQuery = '' }) => {
  const { user, activeRoutes = [], salesStops = [] } = useApp();
  const { setMapMode, setMarkers, clearMarkers, setPolylines, clearPolylines, panTo } = useMap();
  const { outlets } = useMapData();

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

  // Hubungkan DashboardPage ke Persistent Map
  useEffect(() => {
    setMapMode('dashboard');

    // Setup Persistent Map Markers (Role-Based Visibility)
    if (outlets && outlets.length > 0) {
      // Filter visible outlets based on role
      let visibleOutlets = [];
      
      if (user?.role === 'SALES') {
        const assignedCodes = displayStops.map(s => s.outletCode).filter(Boolean);
        visibleOutlets = outlets.filter(o => assignedCodes.includes(o.outletCode));
      } else if (user?.role === 'SUPERVISOR') {
        const teamCodes = [];
        todayRoutes.forEach(r => {
          r.stops.forEach(s => teamCodes.push(s.outletCode));
        });
        const uniqueCodes = [...new Set(teamCodes)].filter(Boolean);
        visibleOutlets = outlets.filter(o => uniqueCodes.includes(o.outletCode));
      } else {
        // ADMIN or MANAJER_OPERASIONAL sees all
        visibleOutlets = outlets;
      }

      const getSvgMarker = (color) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
      };

      const markersData = visibleOutlets.map(o => ({
        id: o.id,
        lat: o.latitude,
        lng: o.longitude,
        title: o.name,
        icon: {
          url: getSvgMarker(o.clusterId ? '#dc2626' : '#6b7280'),
          anchor: window.google ? new window.google.maps.Point(16, 32) : { x: 16, y: 32 }
        },
      }));
      setMarkers(markersData);
    }

    return () => {
      // Bersihkan jika pergi ke tab lain (tapi jangan unmount map fisiknya)
      setMapMode('hidden');
      clearMarkers();
      clearPolylines();
    };
  }, [outlets, setMapMode, setMarkers, clearMarkers, clearPolylines]);

  // Fokus ke outlet yang dipilih di peta secara imperatif
  useEffect(() => {
    if (selectedOutlet && selectedOutlet.lat && selectedOutlet.lng) {
      panTo(selectedOutlet.lat, selectedOutlet.lng, 15);
    }
  }, [selectedOutlet, panTo]);

  return (
    <div className="dashboard-wrapper">
      {/* PersistentMapShell sudah merender peta di background. Kita hanya butuh overlay konten. */}

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
