import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { LuMapPinOff, LuExternalLink, LuCompass } from 'react-icons/lu';

/**
 * OutletMiniMapPreview Component
 * Single Responsibility: Render lightweight, crisp map thumbnail preview of outlet GPS point & geofence radius.
 */
export const OutletMiniMapPreview = React.memo(({
  latitude,
  longitude,
  name = '',
  radiusMeters = 50,
  channel = 'GENERAL_TRADE',
}) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const isValidCoord = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  const isGt = channel === 'GENERAL_TRADE';
  const markerColor = isGt ? '#059669' : '#2563eb';

  const customMarkerIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-outlet-map-pin',
      html: `
        <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
          <div style="width:26px;height:26px;border-radius:50%;background:${markerColor};color:#ffffff;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.35);">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }, [markerColor]);

  if (!isValidCoord) {
    return (
      <div className="w-full h-36 bg-surface-container/50 rounded-xl flex flex-col items-center justify-center text-on-surface-variant gap-1.5 border border-dashed border-border-glass select-none">
        <LuMapPinOff className="text-xl text-amber-500" />
        <span className="text-xs font-bold text-on-surface">Titik GPS Belum Diatur</span>
        <span className="text-[10px] text-on-surface-variant">Koordinat tidak valid atau belum diset</span>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border-glass shadow-xs bg-slate-100 group">
      <MapContainer
        key={`${lat}-${lng}`}
        center={[lat, lng]}
        zoom={16}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
        className="w-full h-full z-0 cursor-default"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Circle
          center={[lat, lng]}
          radius={radiusMeters || 50}
          pathOptions={{
            color: markerColor,
            fillColor: markerColor,
            fillOpacity: 0.16,
            weight: 2,
            dashArray: '4, 4',
          }}
        />
        <Marker position={[lat, lng]} icon={customMarkerIcon} />
      </MapContainer>

      {/* Top Left: Radius Badge */}
      <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <span className="px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-xs text-[10px] font-bold text-on-surface border border-border-glass shadow-xs flex items-center gap-1">
          <LuCompass className="text-[10px] text-primary" />
          <span>Radius: {radiusMeters || 50}m</span>
        </span>
      </div>

      {/* Top Right: GPS Coordinates Badge */}
      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        <span className="px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-xs text-[10px] font-mono font-bold text-on-surface border border-border-glass shadow-xs">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>

      {/* Bottom Right: Google Maps Direct Link */}
      <div className="absolute bottom-2 right-2 z-10">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="px-2 py-1 rounded-md bg-surface/95 hover:bg-surface text-primary hover:text-primary/80 text-[10px] font-bold border border-border-glass shadow-xs flex items-center gap-1 transition-all cursor-pointer"
          title="Buka titik koordinat di Google Maps"
        >
          <span>Peta Google</span>
          <LuExternalLink className="text-[10px]" />
        </a>
      </div>
    </div>
  );
});
