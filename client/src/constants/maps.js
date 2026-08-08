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

/**
 * Palet warna per leg rute (titik → titik).
 * Di-cycle berdasarkan index leg.
 */
export const ROUTE_LEG_COLORS = Object.freeze([
    '#2563eb', // blue
    '#059669', // emerald
    '#d97706', // amber
    '#dc2626', // red
    '#7c3aed', // violet
    '#0891b2', // cyan
    '#db2777', // pink
    '#65a30d', // lime
    '#ea580c', // orange
    '#4f46e5', // indigo
]);

export const getRouteLegColor = (index) => ROUTE_LEG_COLORS[index % ROUTE_LEG_COLORS.length];
