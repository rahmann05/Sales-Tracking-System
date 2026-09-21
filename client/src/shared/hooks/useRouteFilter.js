import { useState, useMemo, useCallback, useEffect } from 'react';

/**
 * Custom Hook: useRouteFilter
 * Manages search query, filter criteria, and returns filtered sales route list.
 */
export function useRouteFilter(initialRoutes = []) {
  const [routes, setRoutes] = useState(initialRoutes);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [query, setQuery] = useState('');

  // Keep internal routes state synchronized when initialRoutes changes
  useEffect(() => {
    setRoutes(initialRoutes);
  }, [initialRoutes]);

  const filterByStatus = useCallback((status) => {
    setFilterStatus(status);
  }, []);

  const filteredRoutes = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    return (routes || []).filter((route) => {
      const name = String(route.name || '').toLowerCase();
      const id = String(route.id || '').toLowerCase();
      const repName = String(route.repName || '').toLowerCase();
      const region = String(route.region || '').toLowerCase();

      const matchesQuery =
        !q ||
        name.includes(q) ||
        id.includes(q) ||
        repName.includes(q) ||
        region.includes(q);

      const matchesStatus =
        filterStatus === 'ALL' ||
        String(route.status || '').toUpperCase() === filterStatus.toUpperCase();

      return matchesQuery && matchesStatus;
    });
  }, [routes, query, filterStatus]);

  return {
    routes: filteredRoutes,
    allRoutes: routes,
    setRoutes,
    query,
    setQuery,
    filterStatus,
    filterByStatus,
  };
}

