import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF, InfoWindowF, DirectionsRenderer } from '@react-google-maps/api';
import { getClusterColorHex, getClusterInfo } from '../../../services/clusterColorService';
import { googleDirectionsService } from '../../../services/googleDirectionsService';
import { googlePlacesService } from '../../../services/googlePlacesService';
import { ClusterMapLegend } from './ClusterMapLegend';
import { SelectedSalesMapHeader } from './SelectedSalesMapHeader';
import { INITIAL_SALES_STOPS } from '../../../data/mockData';
import { LuStore, LuMapPin, LuUser, LuNavigation, LuExternalLink } from 'react-icons/lu';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

/**
 * GoogleClusterRouteMap Component
 * Single Responsibility: 100% Pure Native Google Maps JavaScript API with DirectionsService & DirectionsRenderer
 * for real road network driving routes following streets, turns, and highways.
 * 1 File = 1 Component
 */
export const GoogleClusterRouteMap = ({
  allStops = INITIAL_SALES_STOPS,
  selectedSales = null,
  selectedOutlet = null,
  onSelectOutlet = () => {},
  onClearSelection = () => {},
  userRole = 'SUPERVISOR',
  salesLocation = { lat: -6.8700, lng: 107.5400 },
}) => {
  const isSalesRole = userRole === 'SALES';
  const mapRef = useRef(null);
  const [activeMarkerStop, setActiveMarkerStop] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [directionsStatus, setDirectionsStatus] = useState(null); // 'OK' | 'ERROR' | null

  // Google Maps API Key from env
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-sdk',
    googleMapsApiKey: apiKey,
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // System outlets directly from assigned array
  const rawStops = useMemo(() => {
    if (isSalesRole) return allStops.slice(0, 10);
    if (selectedSales && Array.isArray(selectedSales.stops)) return selectedSales.stops;
    return allStops;
  }, [allStops, selectedSales, isSalesRole]);

  // Nearest-neighbor sort from sales location (Haversine distance for ordering only)
  const systemStops = useMemo(() => {
    const validStops = rawStops.filter((s) => s.latitude != null && s.longitude != null);
    if (validStops.length === 0) return validStops;

    const deg2rad = (d) => (d * Math.PI) / 180;
    const dist = (a, bLat, bLng) => {
      const dLat = deg2rad(bLat - a.lat);
      const dLng = deg2rad(bLng - a.lng);
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(bLat)) * Math.sin(dLng / 2) ** 2;
      return 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    };

    const remaining = [...validStops];
    const sorted = [];
    let current = { lat: salesLocation.lat, lng: salesLocation.lng };

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = dist(current, remaining[0].latitude, remaining[0].longitude);
      for (let i = 1; i < remaining.length; i++) {
        const d = dist(current, remaining[i].latitude, remaining[i].longitude);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      }
      const nearest = remaining.splice(nearestIdx, 1)[0];
      sorted.push(nearest);
      current = { lat: nearest.latitude, lng: nearest.longitude };
    }

    return sorted;
  }, [rawStops, salesLocation]);

  const [roadNetworkPath, setRoadNetworkPath] = useState([]);

  // Request real driving road network route from Google DirectionsService
  useEffect(() => {
    if (typeof window === 'undefined' || !window.google || !isLoaded || systemStops.length === 0) return;
    if (!apiKey) {
      console.warn('[DirectionsService] No VITE_GOOGLE_MAPS_API_KEY set – falling back to straight-line polyline.');
      setDirectionsStatus('NO_KEY');
      setRoadNetworkPath([]);
      return;
    }

    const validStops = systemStops.filter((s) => s.latitude != null && s.longitude != null);
    if (validStops.length === 0) return;

    let isSubscribed = true;
    const directionsService = new window.google.maps.DirectionsService();

    const fetchRoadRoutes = async () => {
      const allPoints = [];
      let currentOrigin = { lat: Number(salesLocation.lat), lng: Number(salesLocation.lng) };
      const chunkSize = 12; // safe waypoint chunking limit

      for (let i = 0; i < validStops.length; i += chunkSize) {
        if (!isSubscribed) break;

        const chunk = validStops.slice(i, i + chunkSize);
        const chunkLast = chunk[chunk.length - 1];
        const destination = { lat: Number(chunkLast.latitude), lng: Number(chunkLast.longitude) };

        const waypoints = chunk.slice(0, -1).map((s) => ({
          location: { lat: Number(s.latitude), lng: Number(s.longitude) },
          stopover: true,
        }));

        try {
          const result = await new Promise((resolve, reject) => {
            directionsService.route(
              {
                origin: currentOrigin,
                destination,
                waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false,
              },
              (res, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                  resolve(res);
                } else {
                  reject(status);
                }
              }
            );
          });

          if (result && result.routes && result.routes[0] && result.routes[0].overview_path) {
            result.routes[0].overview_path.forEach((pt) => {
              allPoints.push({ lat: pt.lat(), lng: pt.lng() });
            });
          }
        } catch (errStatus) {
          console.warn('[DirectionsService] Route chunk status:', errStatus);
        }

        currentOrigin = destination;
      }

      if (isSubscribed) {
        if (allPoints.length > 0) {
          setRoadNetworkPath(allPoints);
          setDirectionsStatus('OK');
        } else {
          setRoadNetworkPath([]);
          setDirectionsStatus('ERROR');
        }
      }
    };

    fetchRoadRoutes();

    return () => {
      isSubscribed = false;
    };
  }, [isLoaded, apiKey, salesLocation, systemStops]);

  // Fallback Polyline coordinates
  const polylinePositions = useMemo(() => {
    const points = [{ lat: salesLocation.lat, lng: salesLocation.lng }];
    systemStops.forEach((stop) => {
      if (stop.latitude != null && stop.longitude != null) {
        points.push({ lat: stop.latitude, lng: stop.longitude });
      }
    });
    return points;
  }, [salesLocation, systemStops]);

  // Stable initial center reference to prevent resetting map position on every re-render
  const initialCenter = useMemo(
    () => ({ lat: salesLocation.lat, lng: salesLocation.lng }),
    // Only recompute if initial coordinates change significantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Maintain current center state only updated on explicit user selection / recenter action
  const [mapCenter, setMapCenter] = useState(initialCenter);

  // Pan & Zoom to selected outlet when clicked from Active Routes list
  useEffect(() => {
    if (mapRef.current && selectedOutlet && selectedOutlet.latitude != null && selectedOutlet.longitude != null) {
      const newPos = { lat: Number(selectedOutlet.latitude), lng: Number(selectedOutlet.longitude) };
      mapRef.current.panTo(newPos);
      mapRef.current.setZoom(15);
      setActiveMarkerStop(selectedOutlet);
    }
  }, [selectedOutlet]);

  // Pan to sales route center when selectedSales changes
  useEffect(() => {
    if (mapRef.current && selectedSales && Array.isArray(selectedSales.stops) && selectedSales.stops.length > 0) {
      const firstStop = selectedSales.stops[0];
      if (firstStop?.latitude != null && firstStop?.longitude != null) {
        mapRef.current.panTo({ lat: Number(firstStop.latitude), lng: Number(firstStop.longitude) });
        mapRef.current.setZoom(13);
      }
    }
  }, [selectedSales]);

  // Helper to manually recenter map onto Sales Location
  const handleRecenterToSales = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: Number(salesLocation.lat), lng: Number(salesLocation.lng) });
      mapRef.current.setZoom(13);
    }
  }, [salesLocation]);

  // Google SVG Pin Symbol per Cluster Color
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

  const salesLocationSymbol = useMemo(() => {
    if (typeof window === 'undefined' || !window.google) return undefined;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#2563eb',
      fillOpacity: 1,
      strokeWeight: 3.5,
      strokeColor: '#ffffff',
      scale: 10,
    };
  }, []);

  // Responsive Google Maps iframe fallback while loading SDK
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
      {/* 1. Permanent Cluster Map Legend in Top-Left (z-30) */}
      <ClusterMapLegend totalOutletsCount={allStops.length} />

      {/* 2. Top Banner Overlay for Supervisor/Manager Sales Filter */}
      {!isSalesRole && selectedSales && (
        <SelectedSalesMapHeader
          selectedSales={selectedSales}
          onClearSelection={onClearSelection}
        />
      )}

      {/* Floating Recenter Button (Bottom-Right, z-30) */}
      <button
        type="button"
        onClick={handleRecenterToSales}
        className="absolute bottom-6 right-6 z-30 px-3.5 py-2.5 bg-surface/90 backdrop-blur-md border border-border-glass rounded-xl text-xs font-bold text-on-surface hover:bg-surface shadow-xl flex items-center gap-2 transition-all hover:scale-105"
        title="Fokuskan Peta ke Posisi Sales"
      >
        <LuNavigation className="text-primary text-sm animate-pulse" />
        <span>Fokus Lokasi Sales</span>
      </button>

      {/* 3. Pure Google Maps JS SDK Component */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={selectedOutlet ? 15 : 12}
        center={mapCenter}
        options={{
          ...mapOptions,
          gestureHandling: 'greedy',
        }}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      >
        {/* Sales Location Marker */}
        <MarkerF
          position={{ lat: salesLocation.lat, lng: salesLocation.lng }}
          icon={salesLocationSymbol}
          title="Posisi Terakhir Sales Representative"
        />

        {/* Outlet Markers with Google Cluster Color Symbols */}
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
              label={{
                text: `#${idx + 1}`,
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
              }}
              onClick={() => {
                onSelectOutlet(stop);
                setActiveMarkerStop(stop);
              }}
            />
          );
        })}

        {/* Google Directions API Real Road Driving Route Renderer */}
        {roadNetworkPath.length > 0 ? (
          <PolylineF
            path={roadNetworkPath}
            options={{
              strokeColor: '#2563eb',
              strokeOpacity: 0.9,
              strokeWeight: 5,
              geodesic: true,
            }}
          />
        ) : (
          polylinePositions.length > 1 && (
            <PolylineF
              path={polylinePositions}
              options={{
                strokeColor: '#94a3b8',
                strokeOpacity: 0.6,
                strokeWeight: 3,
                geodesic: true,
              }}
            />
          )
        )}

        {/* Google Places InfoWindow Popup on Marker Click / Auto-Focus */}
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
                  <LuNavigation /> Navigasi Directions ➔
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
