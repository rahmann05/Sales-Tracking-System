import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import { MapEffect } from "./RouteMapEffect";
import { MapEventsHandler } from "./RouteMapEvents";
import { createSalesLivePinIcon, createCustomPinIcon } from "./leafletRouteIcons";
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

import { getClusterColorHex, getClusterInfo } from '../../../services/clusterColorService';
import { googleDirectionsService } from '../../../services/googleDirectionsService';
import { googlePlacesService } from '../../../services/googlePlacesService';
import { ClusterMapLegend } from './ClusterMapLegend';
import { SelectedSalesMapHeader } from './SelectedSalesMapHeader';
import { RouteProviderBadge } from './RouteProviderBadge';
import { LuStore, LuMapPin, LuNavigation, LuExternalLink } from 'react-icons/lu';

// Helper custom Leaflet live sales GPS icon generator

// Sub-component to handle map click events

// Sub-component to pan & zoom map when selected outlet changes

export const LeafletFallbackRouteMap = ({
  center,
  zoom = 12,
  markers = [],
  routes = [],
  onMapClick,
  systemStops = [],
  selectedSales = null,
  selectedOutlet = null,
  onSelectOutlet = () => {},
  onClearSelection = () => {},
  userRole = 'SALES',
  salesLocation = {
    lat: -6.8722,
    lng: 107.5423
  },
  routeLegs = [],
  routeProvider = 'osrm',
  clusterBaseColor = '#2563eb'
}) => {
 const mapPolicy=useFeaturePolicy('MAPS');
  if(!mapPolicy.canStart)return <p className="app-notice" role="status">{mapPolicy.reason}</p>;
  const centerLat = Number(center?.lat || salesLocation?.lat || -6.8849);
  const centerLng = Number(center?.lng || salesLocation?.lng || 107.4899);

  // Flatten polyline points
  const polylineCoords = [];
  if (routeLegs && routeLegs.length > 0) {
    routeLegs.forEach(leg => {
      if (leg.path) {
        leg.path.forEach(pt => {
          polylineCoords.push([Number(pt.lat), Number(pt.lng)]);
        });
      }
    });
  } else if (systemStops.length > 0) {
    polylineCoords.push([centerLat, centerLng]);
    systemStops.forEach(s => {
      if (s.latitude != null && s.longitude != null) {
        polylineCoords.push([Number(s.latitude), Number(s.longitude)]);
      }
    });
  }
  return <div style={{
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '400px'
  }}>
      <ClusterMapLegend selectedClusterColor={clusterBaseColor} />

      {selectedSales && <SelectedSalesMapHeader selectedSales={selectedSales} onBack={onClearSelection} userRole={userRole} />}

      <MapContainer center={[centerLat, centerLng]} zoom={13} style={{
      width: '100%',
      height: '100%'
    }} scrollWheelZoom={true}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapEventsHandler onMapClick={onMapClick} />

        <MapEffect selectedOutlet={selectedOutlet} selectedSales={selectedSales} salesLocation={salesLocation} center={center} zoom={zoom} />

        {/* Generic markers passed from PersistentMapShell / mapState */}
        {markers.map((m, idx) => {
        if((m.lat??m.latitude)==null||(m.lng??m.longitude)==null)return null;
        const lat = Number(m.lat ?? m.latitude);
        const lng = Number(m.lng ?? m.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        const markerColor = m.color || '#2563eb';
        return <Marker key={m.id || `m-${idx}`} position={[lat, lng]} icon={createCustomPinIcon(markerColor, false)} eventHandlers={{
          click: () => {
            if (typeof m.onClick === 'function') m.onClick(m);
          }
        }}>
              {m.title && <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <span className="font-bold text-gray-900">{m.title}</span>
                    {m.snippet && <p className="text-gray-600 text-[11px]">{m.snippet}</p>}
                  </div>
                </Popup>}
            </Marker>;
      })}

        {/* Generic routes passed from PersistentMapShell / mapState */}
        {routes.map((r, idx) => {
        const positions = (r.path || []).map(pt => [Number(pt.lat ?? pt.latitude), Number(pt.lng ?? pt.longitude)]);
        if (positions.length < 2) return null;
        return <Polyline key={r.id || `r-${idx}`} positions={positions} pathOptions={{
          color: r.color || '#2563eb',
          weight: r.strokeWeight || 4,
          opacity: r.strokeOpacity || 0.85
        }} />;
      })}

        {/* Starting / Current Location Pin */}
        {salesLocation && !isNaN(centerLat) && !isNaN(centerLng) && <Marker position={[centerLat, centerLng]} icon={createCustomPinIcon(salesLocation?.accuracy ? '#dc2626' : '#10b981', true)}>
            <Popup>
              <div className="text-xs p-1">
                <span className={`font-bold flex items-center gap-1 ${salesLocation?.accuracy ? 'text-red-700' : 'text-emerald-700'}`}>
                  {salesLocation?.accuracy ? <><LuMapPin /> Lokasi Anda Saat Ini</> : <><LuStore /> Depo Pusat Sinar Anugrah</>}
                </span>
                <p className="text-gray-600 text-[10px]">
                  {salesLocation?.accuracy ? 'Titik GPS Real-Time' : 'Titik Awal Keberangkatan Sales'}
                </p>
              </div>
            </Popup>
          </Marker>}

        {/* Live Sales Field Rep GPS Position Pin */}
        {selectedSales && salesLocation && <Marker position={[Number(salesLocation.lat), Number(salesLocation.lng)]} icon={createSalesLivePinIcon()}>
            <Popup>
              <div className="text-xs p-1.5 space-y-1 min-w-[160px]">
                <div className="flex items-center gap-1.5 font-bold text-blue-700">
                  <LuNavigation className="text-xs shrink-0" />
                  <span>Posisi Live Sales Rep</span>
                </div>
                <p className="font-bold text-gray-900 text-xs">
                  {selectedSales?.repName || 'Sales Field Rep (Aktif)'}
                </p>
                <div className="text-[10px] text-gray-500 space-y-0.5">
                  <div>Status: <span className="text-emerald-600 font-bold">Sedang di Rute</span></div>
                  <div>Koordinat: {salesLocation.lat.toFixed(4)}, {salesLocation.lng.toFixed(4)}</div>
                </div>
              </div>
            </Popup>
          </Marker>}

        {/* Belfoods Store Outlet Markers */}
        {systemStops.map((stop, idx) => {
        if (stop.latitude == null || stop.longitude == null) return null;
        const isSelected = selectedOutlet?.id === stop.id;
        const color = getClusterColorHex(stop.clusterName, stop.callplanName);
        return <Marker key={stop.id || `stop-${idx}`} position={[Number(stop.latitude), Number(stop.longitude)]} icon={createCustomPinIcon(color, isSelected)} eventHandlers={{
          click: () => onSelectOutlet(stop)
        }}>
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
                    <a href={googleDirectionsService.getDirectionsUrl(salesLocation, stop)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold flex items-center gap-1 text-decoration-none">
                      <LuNavigation /> Navigasi Maps
                    </a>
                    <a href={googlePlacesService.getGoogleMapsUrl(stop.latitude, stop.longitude, stop.outletName)} target="_blank" rel="noopener noreferrer" className="px-1.5 py-1 bg-gray-100 text-gray-700 rounded text-[10px] border border-gray-300" title="Lihat di Google Maps">
                      <LuExternalLink />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>;
      })}

        {/* Route Polyline from systemStops */}
        {polylineCoords.length > 1 && <Polyline positions={polylineCoords} pathOptions={{
        color: clusterBaseColor,
        weight: 5,
        opacity: 0.85
      }} />}
      </MapContainer>

      <RouteProviderBadge provider={routeProvider} />
    </div>;
};
