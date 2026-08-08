import React from 'react';
import { PolylineF, OverlayViewF } from '@react-google-maps/api';
import { getClusterTone } from '../../../utils/colorUtils';
import '../../../styles/components/RouteLegsPolyline.css';

/** Titik tengah path polyline (untuk posisi label jarak) */
const getPathMidpoint = (path) => {
    if (!path || path.length === 0) return null;
    return path[Math.floor(path.length / 2)];
};

/** Opsi garis putus-putus (leg non-aktif) */
const buildDashedIcons = () => {
    if (typeof window === 'undefined' || !window.google) return [];
    return [
        {
            icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                scale: 3,
            },
            offset: '0',
            repeat: '14px',
        },
    ];
};

/**
 * RouteLegsPolyline Component
 * Single Responsibility: Render setiap leg rute sebagai polyline terpisah.
 * - Warna leg = tone warna cluster (leg 0 paling pekat, makin ke belakang makin terang)
 * - activeLegIndex = garis solid; leg lain = garis putus-putus (dashed)
 * - Label jarak km di tengah setiap garis
 */
export const RouteLegsPolyline = ({ legs = [], clusterBaseColor = '#2563eb', activeLegIndex = 0 }) => (
    <>
        {legs.map((leg, idx) => {
            if (!leg?.path || leg.path.length === 0) return null;

            const isActive = idx === activeLegIndex;
            const color = getClusterTone(clusterBaseColor, idx, legs.length);
            const midpoint = getPathMidpoint(leg.path);

            const polylineOptions = isActive
                ? { strokeColor: color, strokeOpacity: 0.95, strokeWeight: 6, geodesic: true }
                : {
                    strokeColor: color,
                    strokeOpacity: 0, // base transparan; dash pakai icons
                    strokeWeight: 0,
                    geodesic: true,
                    icons: buildDashedIcons(),
                };

            return (
                <React.Fragment key={`leg-${idx}`}>
                    <PolylineF path={leg.path} options={polylineOptions} />
                    {midpoint && leg.distanceKm > 0 && (
                        <OverlayViewF position={midpoint} mapPaneName="floatPane">
                            <div
                                className={`route-leg-distance-badge ${isActive ? 'route-leg-distance-badge--active' : ''}`}
                                style={{ background: color }}
                            >
                                {leg.distanceKm} km
                            </div>
                        </OverlayViewF>
                    )}
                </React.Fragment>
            );
        })}
    </>
);
