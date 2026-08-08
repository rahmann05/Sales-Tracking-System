import React from 'react';
import { MarkerF } from '@react-google-maps/api';

/**
 * SalesLocationMarker Component
 * Single Responsibility: Render marker posisi terakhir sales.
 */
export const SalesLocationMarker = ({ position, symbol }) => (
    <MarkerF
        position={position}
        icon={symbol}
        title="Posisi Terakhir Sales Representative"
    />
);
