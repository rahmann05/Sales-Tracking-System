/**
 * Maps Constants
 * Single Responsibility: Immutable konfigurasi untuk Google Maps components.
 */

export const GOOGLE_MAP_CONTAINER_STYLE = {
    width: '100%',
    height: '100%',
};

export const GOOGLE_MAP_OPTIONS = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
};

// Default lokasi gudang / kantor pusat (Cimahi) sebagai titik awal rute
export const DEFAULT_DEPOT_LOCATION = { lat: -6.87, lng: 107.54 };
