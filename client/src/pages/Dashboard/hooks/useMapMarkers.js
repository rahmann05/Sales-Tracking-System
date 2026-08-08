import { useCallback } from 'react';

/**
 * useMapMarkers Hook
 * Single Responsibility: Menyediakan factory functions untuk marker symbols Google Maps.
 */
export const useMapMarkers = () => {
    const getMarkerSymbol = useCallback((hexColor, isSelected = false) => {
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

    const getSalesLocationSymbol = useCallback(() => {
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

    return { getMarkerSymbol, getSalesLocationSymbol };
};
