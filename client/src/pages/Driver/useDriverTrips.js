import { useCallback, useEffect, useRef, useState } from 'react';
import { deliveryApi, collectPages } from '../../services/api';
import { useWorkspaceState } from '../../shared/hooks/useWorkspaceState';
import { preferredTrip } from '../../../../shared/driver-workspace.mjs';
export function useDriverTrips() {
  const [routes, setRoutes] = useState([]),
    [issues, setIssues] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [updatedAt, setUpdatedAt] = useState(null);
  const [selectedId, selectTrip] = useWorkspaceState('driverTrip', '');
  const flight = useRef(0),
    hasLoaded = useRef(false);
  const refresh = useCallback(async (trigger = false) => {
    const version = ++flight.current;
    const showSpinner = !hasLoaded.current || trigger === true || Boolean(trigger?.target);
    if (showSpinner) setLoading(true);
    try {
      const [trips, tasks] = await Promise.all([
        collectPages(deliveryApi.getDeliveryRoutes, { open: 'true' }),
        deliveryApi.getMyIssues(),
      ]);
      if (version !== flight.current) return;
      setRoutes(trips.data || []);
      setIssues(tasks.data || []);
      setUpdatedAt(new Date().toISOString());
      setError('');
      hasLoaded.current = true;
    } catch (e) {
      if (version === flight.current) setError(e.message || 'Gagal memperbarui trip.');
    } finally {
      if (version === flight.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh(true);
    const timer = setInterval(() => refresh(false), 30000);
    const onChanged = () => refresh(false);
    window.addEventListener('delivery:changed', onChanged);
    return () => {
      flight.current++;
      clearInterval(timer);
      window.removeEventListener('delivery:changed', onChanged);
    };
  }, [refresh]);
  return {
    routes,
    issues,
    loading,
    error,
    updatedAt,
    refresh,
    activeRoute: preferredTrip(routes, selectedId),
    selectTrip,
  };
}
