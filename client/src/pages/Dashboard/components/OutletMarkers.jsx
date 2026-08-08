import React from 'react';
import { MarkerF } from '@react-google-maps/api';
import { getClusterColorHex } from '../../../services/clusterColorService';

/**
 * OutletMarkers Component
 * Single Responsibility: Render semua outlet markers pada Google Maps.
 */
export const OutletMarkers = ({ stops, selectedOutlet, onSelectOutlet, getMarkerSymbol }) => (
    <>
        {stops.map((stop, idx) => {
            if (stop.latitude == null || stop.longitude == null) return null;

            const colorHex = getClusterColorHex(stop.clusterName, stop.callplanName);
            const isSelected =
                selectedOutlet &&
                (selectedOutlet.id === stop.id || selectedOutlet.outletName === stop.outletName);

            return (
                <MarkerF
                    key={stop.id || idx}
                    position={{ lat: stop.latitude, lng: stop.longitude }}
                    icon={getMarkerSymbol(colorHex, isSelected)}
                    label={{ text: `#${idx + 1}`, color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}
                    onClick={() => onSelectOutlet(stop)}
                />
            );
        })}
    </>
);
