import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { getClusterColorHex, getClusterInfo } from '../../../services/clusterColorService';
import { googleDirectionsService } from '../../../services/googleDirectionsService';
import { googlePlacesService } from '../../../services/googlePlacesService';
import { ClusterMapLegend } from './ClusterMapLegend';
import { SelectedSalesMapHeader } from './SelectedSalesMapHeader';
import { RouteProviderBadge } from './RouteProviderBadge';
import { RouteLegsPolyline } from './RouteLegsPolyline';
import { INITIAL_SALES_STOPS } from '../../../data';
import { GOOGLE_MAP_CONTAINER_STYLE, GOOGLE_MAP_OPTIONS, DEFAULT_DEPOT_LOCATION } from '../../../constants/maps';
import { useClusterStops } from '../hooks/useClusterStops';
import { useRoadDirections } from '../hooks/useRoadDirections';
import { LuStore, LuMapPin, LuNavigation, LuExternalLink } from 'react-icons/lu';

/**
 * GoogleClusterRouteMap Component (Orchestrator)
 * Single Responsibility: Compose Google Map SDK dengan markers cluster, polyline rute
 * (DirectionsService via useRoadDirections) dan InfoWindow outlet.
 * Seleksi & pengurutan stops didelegasikan ke useClusterStops.
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
  const [mapCenter, setMapCenter] = useState({ lat: salesLocation.lat, lng: salesLocation.lng });

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script-sdk', googleMapsApiKey: apiKey });

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);
  const onMapUnmount = useCallback(() => { mapRef.current = null; }, []);

  // Stop selection + nearest-neighbor ordering
  const { systemStops } = useClusterStops({ allStops, selectedSales, isSalesRole, salesLocation });

  // Rute mengikuti jalan per leg: Google SDK → backend proxy (Google REST → OSRM) → garis lurus
  const { routeLegs, routeProvider } = useRoadDirections({ isLoaded, salesLocation, systemStops });

  // Warna dasar rute mengikuti cluster sales yang sedang dilihat
  const clusterBaseColor = systemStops.length > 0
    ? getClusterColorHex(systemStops[0].clusterName, systemStops[0].callplanName)
    : '#2563eb';

  // Pan & zoom ke outlet yang dipilih dari daftar Active Routes
  useEffect(() => {
    if (mapRef.current && selectedOutlet && selectedOutlet.latitude != null && selectedOutlet.longitude != null) {
      mapRef.current.panTo({ lat: Number(selectedOutlet.latitude), lng: Number(selectedOutlet.longitude) });
      mapRef.current.setZoom(15);
      setActiveMarkerStop(selectedOutlet);
    }
  }, [selectedOutlet]);

  // Pan ke rute sales saat selectedSales berubah
  useEffect(() => {
    if (mapRef.current && selectedSales && Array.isArray(selectedSales.stops) && selectedSales.stops.length > 0) {
      const firstStop = selectedSales.stops[0];
      if (firstStop?.latitude != null && firstStop?.longitude != null) {
        mapRef.current.panTo({ lat: Number(firstStop.latitude), lng: Number(firstStop.longitude) });
        mapRef.current.setZoom(13);
      }
    }
  }, [selectedSales]);

  const handleRecenterToSales = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: Number(salesLocation.lat), lng: Number(salesLocation.lng) });
      mapRef.current.setZoom(13);
    }
  }, [salesLocation]);

  const getGoogleMarkerSymbol = useCallback((hexColor, isSelected = false) => {
    if (typeof window === 'undefined' || !window.google) return undefined;
    return {
      path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      fillColor: hexColor,
      fillOpacity: 1,
      strokeWeight: isSelected ? 3 : 2,
      strokeColor: '#ffffff',
      scale: isSelected ? 8 : 6.5,
    };
  }, []);

  const salesLocationSymbol = typeof window !== 'undefined' && window.google
    ? {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#2563eb',
      fillOpacity: 1,
      strokeWeight: 3.5,
      strokeColor: '#ffffff',
      scale: 10,
    }
    : undefined;

  // Fallback iframe saat SDK masih loading
  if (!isLoaded) {
    const centerQuery = selectedOutlet
      ? `${selectedOutlet.latitude},${selectedOutlet.longitude}`
      : `${salesLocation.lat},${salesLocation.lng}`;
    const iframeSrc = `https://maps.google.com/maps?q=${encodeURIComponent(centerQuery)}&t=m&z=14&ie=UTF8&iwloc=&output=embed`;

    return (
      <div className="w-full h-full relative overflow-hidden rounded-2xl border border-border-glass shadow-md">
        <ClusterMapLegend totalOutletsCount={allStops.length} />
        {!isSalesRole && selectedSales && (
          <SelectedSalesMapHeader selectedSales={selectedSales} onClearSelection={onClearSelection} />
        )}
        <iframe
          title="Google Maps JS SDK Loader"
          width="100%"
          height="100%"
          src={iframeSrc}
          className="border-none w-full h-full filter saturate-[1.1]"
          loading="lazy"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl border border-border-glass shadow-md">
      <ClusterMapLegend totalOutletsCount={allStops.length} />

      {!isSalesRole && selectedSales && (
        <SelectedSalesMapHeader selectedSales={selectedSales} onClearSelection={onClearSelection} />
      )}

      <button
        type="button"
        onClick={handleRecenterToSales}
        className="absolute bottom-6 right-6 z-30 px-3.5 py-2.5 bg-surface/90 backdrop-blur-md border border-border-glass rounded-xl text-xs font-bold text-on-surface hover:bg-surface shadow-xl flex items-center gap-2 transition-all hover:scale-105"
        title="Fokuskan Peta ke Posisi Sales"
      >
        <LuNavigation className="text-primary text-sm animate-pulse" />
        <span>Fokus Lokasi Sales</span>
      </button>

      <GoogleMap
        mapContainerStyle={GOOGLE_MAP_CONTAINER_STYLE}
        zoom={selectedOutlet ? 15 : 12}
        center={mapCenter}
        options={{ ...GOOGLE_MAP_OPTIONS, gestureHandling: 'greedy' }}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      >
        <MarkerF
          position={{ lat: salesLocation.lat, lng: salesLocation.lng }}
          icon={salesLocationSymbol}
          title="Posisi Terakhir Sales Representative"
        />

        {systemStops.map((stop, idx) => {
          if (stop.latitude == null || stop.longitude == null) return null;

          const colorHex = getClusterColorHex(stop.clusterName, stop.callplanName);
          const isSelected =
            selectedOutlet &&
            (selectedOutlet.id === stop.id || selectedOutlet.outletName === stop.outletName);

          return (
            <MarkerF
              key={stop.id || idx}
              position={{ lat: stop.latitude, lng: stop.longitude }}
              icon={getGoogleMarkerSymbol(colorHex, isSelected)}
              label={{ text: `#${idx + 1}`, color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}
              onClick={() => {
                onSelectOutlet(stop);
                setActiveMarkerStop(stop);
              }}
            />
          );
        })}

        <RouteLegsPolyline
          legs={routeLegs}
          clusterBaseColor={clusterBaseColor}
          activeLegIndex={0}
        />

        <RouteProviderBadge provider={routeProvider} />

        {activeMarkerStop && activeMarkerStop.latitude != null && (
          <InfoWindowF
            position={{ lat: activeMarkerStop.latitude, lng: activeMarkerStop.longitude }}
            onCloseClick={() => setActiveMarkerStop(null)}
          >
            <div className="p-1 space-y-1.5 text-xs min-w-[200px]">
              <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                <span className="font-bold text-primary flex items-center gap-1">
                  <LuStore /> {getClusterInfo(activeMarkerStop.clusterName, activeMarkerStop.callplanName).name}
                </span>
                <span className="text-[10px] font-bold text-gray-500">Google Places API</span>
              </div>
              <h5 className="font-bold text-gray-900 text-sm leading-tight">
                {activeMarkerStop.outletName || activeMarkerStop.customerName}
              </h5>
              <p className="text-gray-600 text-[11px] flex items-center gap-1">
                <LuMapPin className="text-primary shrink-0" />
                <span>{activeMarkerStop.address}</span>
              </p>
              <div className="pt-1 flex items-center justify-between">
                <a
                  href={googleDirectionsService.getDirectionsUrl(salesLocation, activeMarkerStop)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold flex items-center gap-1 text-decoration-none"
                >
                  <LuNavigation /> Navigasi Directions
                </a>
                <a
                  href={googlePlacesService.getGoogleMapsUrl(activeMarkerStop.latitude, activeMarkerStop.longitude, activeMarkerStop.outletName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-1 bg-gray-100 text-gray-700 rounded text-[10px] border border-gray-300"
                  title="Google Maps"
                >
                  <LuExternalLink />
                </a>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
};
