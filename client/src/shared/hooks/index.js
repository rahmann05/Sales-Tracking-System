/**
 * Barrel export for SHARED custom hooks only.
 * Page-specific hooks live under src/pages/<Page>/hooks/
 * and must be imported from there directly (no shared -> pages layering).
 * Single import point: `import { useAuth, useModal } from '../../hooks'`
 */

export { useApi } from './useApi';
export { useAuth } from './useAuth';
export { useDeviceCamera } from './useDeviceCamera';
export { useGeofence } from './useGeofence';
export { useLiveClock } from './useLiveClock';
export { useModal } from './useModal';
export { useRouteFilter } from './useRouteFilter';
export { useSearch } from './useSearch';
export { useTabNavigation } from './useTabNavigation';
