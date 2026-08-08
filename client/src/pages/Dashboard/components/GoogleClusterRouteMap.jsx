import React, { useState, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { getClusterColorHex } from '../../../services/clusterColorService';
import { ClusterMapLegend } from './ClusterMapLegend';
import { SelectedSalesMapHeader } from './SelectedSalesMapHeader';
import { RouteProviderBadge } from './RouteProviderBadge';
import { RouteLegsPolyline } from './RouteLegsPolyline';
import { MapLoadingFallback } from './MapLoadingFallback';
import { MapRecenterButton } from './MapRecenterButton';
import { OutletInfoWindow } from './OutletInfoWindow';
import { OutletMarkers } from './OutletMarkers';
import { SalesLocationMarker } from './SalesLocationMarker';
import { INITIAL_SALES_STOPS } from '../../../data';
import { GOOGLE_MAP_CONTAINER_STYLE, GOOGLE_MAP_OPTIONS, DEFAULT_DEPOT_LOCATION } from '../../../constants/maps';
import { useClusterStops } from '../hooks/useClusterStops';
import { useRoadDirections } from '../hooks/useRoadDirections';
import { useMapMarkers } from '../hooks/useMapMarkers';
import { useMapPanEffects } from '../hooks/useMapPanEffects';
import '../../../styles/components/GoogleClusterRouteMap.css';

/**
 * GoogleClusterRouteMap Component (Orchestrator)
 * Single Responsibility: Compose child components untuk Google Map cluster route.
 */
export const GoogleClusterRouteMap = ({
  allStops = INITIAL_SALES_STOPS,
  selectedSales = null,
  selectedOutlet = null,
  onSelectOutlet = () => { },
  onClearSelection = () => { },
  userRole = 'SUPERVISOR',
  salesLocation = DEFAULT_DEPOT_LOCATION,
}) => {
  const isSalesRole = userRole === 'SALES';
  const mapRef = useRef(null);
  const [activeMarkerStop, setActiveMarkerStop] = useState(null);
  const [mapCenter] = useState({ lat: salesLocation.lat, lng: salesLocation.lng });

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script-sdk', googleMapsApiKey: apiKey });

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);
  const onMapUnmount = useCallback(() => { mapRef.current = null; }, []);

  const { systemStops } = useClusterStops({
    allStops,
    selectedSales,
    isSalesRole,
    salesLocation,
  });
  const { routeLegs, routeProvider } = useRoadDirections({ isLoaded, salesLocation, systemStops });
  const { getMarkerSymbol, getSalesLocationSymbol } = useMapMarkers();

  useMapPanEffects({ mapRef, selectedOutlet, selectedSales, setActiveMarkerStop });

  const clusterBaseColor = systemStops.length > 0
    ? getClusterColorHex(systemStops[0].clusterName, systemStops[0].callplanName)
    : '#2563eb';

  const handleRecenterToSales = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: Number(salesLocation.lat), lng: Number(salesLocation.lng) });
      mapRef.current.setZoom(13);
    }
  }, [salesLocation]);

  const handleSelectOutlet = useCallback((stop) => {
    onSelectOutlet(stop);
    setActiveMarkerStop(stop);
  }, [onSelectOutlet]);

  const handleCloseInfoWindow = useCallback(() => {
    setActiveMarkerStop(null);
  }, []);

  if (!isLoaded) {
    return (
      <MapLoadingFallback
        allStopsCount={allStops.length}
        isSalesRole={isSalesRole}
        selectedSales={selectedSales}
        onClearSelection={onClearSelection}
        selectedOutlet={selectedOutlet}
        salesLocation={salesLocation}
      />
    );
  }

  return (
    <div className="google-cluster-route-map">
      <ClusterMapLegend
        totalOutletsCount={systemStops.length}
        isSalesRole={isSalesRole}
        userClusterName={systemStops[0]?.clusterName}
      />

      {!isSalesRole && selectedSales && (
        <SelectedSalesMapHeader selectedSales={selectedSales} onClearSelection={onClearSelection} />
      )}

      <MapRecenterButton onRecenter={handleRecenterToSales} />

      <GoogleMap
        mapContainerStyle={GOOGLE_MAP_CONTAINER_STYLE}
        zoom={selectedOutlet ? 15 : 12}
        center={mapCenter}
        options={{ ...GOOGLE_MAP_OPTIONS, gestureHandling: 'greedy' }}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      >
        <SalesLocationMarker
          position={{ lat: salesLocation.lat, lng: salesLocation.lng }}
          symbol={getSalesLocationSymbol()}
        />

        <OutletMarkers
          stops={systemStops}
          selectedOutlet={selectedOutlet}
          onSelectOutlet={handleSelectOutlet}
          getMarkerSymbol={getMarkerSymbol}
        />

        <RouteLegsPolyline
          legs={routeLegs}
          clusterBaseColor={clusterBaseColor}
          activeLegIndex={0}
        />

        <RouteProviderBadge provider={routeProvider} />

        {activeMarkerStop && (
          <OutletInfoWindow
            stop={activeMarkerStop}
            salesLocation={salesLocation}
            onClose={handleCloseInfoWindow}
          />
        )}
      </GoogleMap>
    </div>
  );
};
