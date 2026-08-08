import React from 'react';
import { LuNavigation } from 'react-icons/lu';
import '../../../styles/components/MapRecenterButton.css';

/**
 * MapRecenterButton Component
 * Single Responsibility: Tombol recenter ke posisi sales.
 */
export const MapRecenterButton = ({ onRecenter }) => (
    <button
        type="button"
        onClick={onRecenter}
        className="map-recenter-btn"
        title="Fokuskan Peta ke Posisi Sales"
    >
        <LuNavigation className="map-recenter-btn__icon" />
        <span>Fokus Lokasi Sales</span>
    </button>
);
