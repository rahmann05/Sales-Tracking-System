import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getClusterColorHex, getClusterInfo } from '../../../services/clusterColorService';
import { googleDirectionsService } from '../../../services/googleDirectionsService';
import { googlePlacesService } from '../../../services/googlePlacesService';
import { ClusterMapLegend } from './ClusterMapLegend';
import { SelectedSalesMapHeader } from './SelectedSalesMapHeader';
import { RouteProviderBadge } from './RouteProviderBadge';
import { LuStore, LuMapPin, LuNavigation, LuExternalLink } from 'react-icons/lu';

// Helper custom Leaflet pin icon generator
const createCustomPinIcon = (color = '#2563eb', isSelected = false) => {
  const size = isSelected ? 34 : 26;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// Sub-component to pan & zoom map when selected outlet changes
const MapEffect = ({ selectedOutlet, selectedSales, salesLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedOutlet?.latitude != null && selectedOutlet?.longitude != null) {
      map.flyTo([Number(selectedOutlet.latitude), Number(selectedOutlet.longitude)], 15, { duration: 1 });
    }
  }, [selectedOutlet, map]);

  useEffect(() => {
    if (selectedSales?.stops?.[0]?.latitude != null) {
      const first = selectedSales.stops[0];
      map.flyTo([Number(first.latitude), Number(first.longitude)], 13, { duration: 1 });
    }
  }, [selectedSales, map]);

  return null;
};

export const LeafletFallbackRouteMap = ({
  systemStops = [],
  selectedSales = null,
  selectedOutlet = null,
  onSelectOutlet = () => {},
  onClearSelection = () => {},
  userRole = 'SALES',
  salesLocation = { lat: -6.8722, lng: 107.5423 },
  routeLegs = [],
  routeProvider = 'osrm',
  clusterBaseColor = '#2563eb',
}) => {
  const centerLat = Number(salesLocation?.lat || -6.8722);
  const centerLng = Number(salesLocation?.lng || 107.5423);

  // Flatten polyline points
  const polylineCoords = [];
  if (routeLegs && routeLegs.length > 0) {
    routeLegs.forEach((leg) => {
      if (leg.path) {
        leg.path.forEach((pt) => {
          polylineCoords.push([Number(pt.lat), Number(pt.lng)]);
        });
      }
    });
  } else if (systemStops.length > 0) {
    polylineCoords.push([centerLat, centerLng]);
    systemStops.forEach((s) => {
      if (s.latitude != null && s.longitude != null) {
        polylineCoords.push([Number(s.latitude), Number(s.longitude)]);
      }
    });
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      <ClusterMapLegend selectedClusterColor={clusterBaseColor} />

      {selectedSales && (
        <SelectedSalesMapHeader
          selectedSales={selectedSales}
          onBack={onClearSelection}
          userRole={userRole}
        />
      )}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEffect
          selectedOutlet={selectedOutlet}
          selectedSales={selectedSales}
          salesLocation={salesLocation}
        />

        {/* Starting / Current Location Pin */}
        <Marker
          position={[centerLat, centerLng]}
          icon={createCustomPinIcon(salesLocation?.accuracy ? '#dc2626' : '#10b981', true)}
        >
          <Popup>
            <div className="text-xs p-1">
              <span className={`font-bold flex items-center gap-1 ${salesLocation?.accuracy ? 'text-red-700' : 'text-emerald-700'}`}>
                {salesLocation?.accuracy ? (
                  <><LuMapPin /> Lokasi Anda Saat Ini</>
                ) : (
                  <><LuStore /> Depo Pusat Sinar Anugrah</>
                )}
              </span>
              <p className="text-gray-600 text-[10px]">
                {salesLocation?.accuracy ? 'Titik GPS Real-Time' : 'Titik Awal Keberangkatan Sales'}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Belfoods Store Outlet Markers */}
        {systemStops.map((stop, idx) => {
          if (stop.latitude == null || stop.longitude == null) return null;
          const isSelected = selectedOutlet?.id === stop.id;
          const color = getClusterColorHex(stop.clusterName, stop.callplanName);

          return (
            <Marker
              key={stop.id || `stop-${idx}`}
              position={[Number(stop.latitude), Number(stop.longitude)]}
              icon={createCustomPinIcon(color, isSelected)}
              eventHandlers={{
                click: () => onSelectOutlet(stop),
              }}
            >
              <Popup>
                <div className="p-1 space-y-1.5 text-xs min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <LuStore /> {getClusterInfo(stop.clusterName, stop.callplanName).name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">Stop #{idx + 1}</span>
                  </div>
                  <h5 className="font-bold text-gray-900 text-sm leading-tight">
                    {stop.outletName || stop.customerName}
                  </h5>
                  <p className="text-gray-600 text-[11px] flex items-center gap-1">
                    <LuMapPin className="text-primary shrink-0" />
                    <span>{stop.address}</span>
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <a
                      href={googleDirectionsService.getDirectionsUrl(salesLocation, stop)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold flex items-center gap-1 text-decoration-none"
                    >
                      <LuNavigation /> Navigasi Maps
                    </a>
                    <a
                      href={googlePlacesService.getGoogleMapsUrl(stop.latitude, stop.longitude, stop.outletName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-1.5 py-1 bg-gray-100 text-gray-700 rounded text-[10px] border border-gray-300"
                      title="Lihat di Google Maps"
                    >
                      <LuExternalLink />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: clusterBaseColor,
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}
      </MapContainer>

      <RouteProviderBadge provider={routeProvider} />
    </div>
  );
};
