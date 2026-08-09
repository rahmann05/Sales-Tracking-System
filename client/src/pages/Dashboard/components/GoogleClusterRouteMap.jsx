import React, { useState, useRef, useCallback, useEffect, Component } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { getClusterColorHex } from '../../../services/clusterColorService';
import { ClusterMapLegend } from './ClusterMapLegend';
import { SelectedSalesMapHeader } from './SelectedSalesMapHeader';
import { RouteProviderBadge } from './RouteProviderBadge';
import { RouteLegsPolyline } from './RouteLegsPolyline';
import { LeafletFallbackRouteMap } from './LeafletFallbackRouteMap';
import { MapRecenterButton } from './MapRecenterButton';
import { OutletInfoWindow } from './OutletInfoWindow';
import { OutletMarkers } from './OutletMarkers';
import { SalesLocationMarker } from './SalesLocationMarker';
import { GOOGLE_MAP_CONTAINER_STYLE, GOOGLE_MAP_OPTIONS, DEFAULT_DEPOT_LOCATION } from '../../../constants/maps';
import { useApp } from '../../../context/AppContext';
import { useClusterStops } from '../hooks/useClusterStops';
import { useRoadDirections } from '../hooks/useRoadDirections';
import { useMapMarkers } from '../hooks/useMapMarkers';
import { useMapPanEffects } from '../hooks/useMapPanEffects';
import '../../../styles/components/GoogleClusterRouteMap.css';

/**
 * MapErrorBoundary
 * Catches internal react-google-maps crashes (e.g., IntersectionObserver)
 */
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('[Google Maps ErrorBoundary] Caught map crash:', error);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * GoogleClusterRouteMap Component (Orchestrator)
 * Single Responsibility: Compose child components untuk Google Map cluster route.
 */
export const GoogleClusterRouteMap = ({
  allStops = [],
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
  const { isLoaded, loadError } = useJsApiLoader({ id: 'google-map-script-sdk', googleMapsApiKey: apiKey });
  const { currentLocation } = useApp();
  const effectiveLocation = currentLocation || salesLocation;
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('[GoogleClusterRouteMap] Google Maps Auth/Quota Failed! Switching to fallback.');
      setAuthFailed(true);
    };
  }, []);

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);
  const onMapUnmount = useCallback(() => { mapRef.current = null; }, []);

  const { systemStops } = useClusterStops({
    allStops,
    selectedSales,
    isSalesRole,
    salesLocation: effectiveLocation,
  });
  const { routeLegs, routeProvider } = useRoadDirections({ isLoaded, salesLocation: effectiveLocation, systemStops });
  const { getMarkerSymbol, getSalesLocationSymbol } = useMapMarkers();

  useMapPanEffects({ mapRef, selectedOutlet, selectedSales, setActiveMarkerStop });

  const clusterBaseColor = systemStops.length > 0
    ? getClusterColorHex(systemStops[0].clusterName, systemStops[0].callplanName)
    : '#2563eb';

  const handleRecenterToSales = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: Number(effectiveLocation.lat), lng: Number(effectiveLocation.lng) });
      mapRef.current.setZoom(13);
    }
  }, [effectiveLocation]);

  const handleSelectOutlet = useCallback((stop) => {
    onSelectOutlet(stop);
    setActiveMarkerStop(stop);
  }, [onSelectOutlet]);

  const handleCloseInfoWindow = useCallback(() => {
    setActiveMarkerStop(null);
  }, []);

  const fallbackMap = (
    <LeafletFallbackRouteMap
      systemStops={systemStops}
      selectedSales={selectedSales}
      selectedOutlet={selectedOutlet}
      onSelectOutlet={handleSelectOutlet}
      onClearSelection={onClearSelection}
      userRole={userRole}
      salesLocation={effectiveLocation}
      routeLegs={routeLegs}
      routeProvider={routeProvider}
      clusterBaseColor={clusterBaseColor}
    />
  );

  if (!isLoaded || loadError || authFailed) {
    return fallbackMap;
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

      <MapErrorBoundary fallback={fallbackMap}>
        <GoogleMap
          mapContainerStyle={GOOGLE_MAP_CONTAINER_STYLE}
          zoom={selectedOutlet ? 15 : 12}
          center={mapCenter}
          options={{ ...GOOGLE_MAP_OPTIONS, gestureHandling: 'greedy' }}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
        >
          <SalesLocationMarker
            position={{ lat: effectiveLocation.lat, lng: effectiveLocation.lng }}
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
            salesLocation={effectiveLocation}
            onClose={handleCloseInfoWindow}
          />
        )}
        </GoogleMap>
      </MapErrorBoundary>
    </div>
  );
};
