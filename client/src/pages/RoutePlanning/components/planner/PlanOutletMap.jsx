import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { outletOperationalPoint } from '../../../../../../shared/outlet-location.mjs';
import { getClusterColorHex } from '../../../../services/clusterColorService';

/**
 * Team outlets on a map beside the picker: click a point, then add it to the schedule.
 * Color = cluster; a darker, filled point is already in this Sales' schedule.
 */
export function PlanOutletMap({ shops, plannedIds, salesName, disabled, onAdd }) {
  const points = useMemo(
    () =>
      shops
        .map((outlet) => ({ outlet, point: outletOperationalPoint(outlet) }))
        .filter(
          ({ point }) => Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude)
        ),
    [shops]
  );
  if (!points.length)
    return <p className="admin-footnote">Belum ada outlet tim yang memiliki titik di peta.</p>;
  const lats = points.map(({ point }) => point.latitude),
    lngs = points.map(({ point }) => point.longitude);
  const bounds = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
  return (
    <div className="planner-map">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [24, 24] }}
        style={{ height: '100%', minHeight: 360, width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(({ outlet, point }) => {
          const planned = plannedIds.has(outlet.id),
            color = getClusterColorHex(outlet.cluster?.name || '');
          return (
            <CircleMarker
              key={outlet.id}
              center={[point.latitude, point.longitude]}
              radius={planned ? 8 : 6}
              pathOptions={{
                color: planned ? '#242931' : color,
                fillColor: color,
                fillOpacity: planned ? 1 : 0.55,
                weight: 2,
              }}
            >
              <Popup>
                <p style={{ margin: 0 }}>{outlet.name}</p>
                <p style={{ margin: '2px 0 8px', color: '#697280' }}>
                  {outlet.cluster?.name || 'Wilayah belum ditetapkan'}
                </p>
                <button
                  type="button"
                  className="app-button"
                  disabled={disabled || planned}
                  onClick={() => onAdd(outlet.id)}
                >
                  {planned ? 'Sudah di jadwal' : `Tambahkan ke jadwal ${salesName || ''}`.trim()}
                </button>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
