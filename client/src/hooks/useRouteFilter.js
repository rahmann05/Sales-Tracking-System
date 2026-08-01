import { useState, useMemo, useCallback } from 'react';

/**
 * Custom Hook: useRouteFilter
 * Manages search query, filter criteria, and returns filtered sales route list.
 */
export function useRouteFilter(initialRoutes = []) {
  const [routes, setRoutes] = useState(initialRoutes);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [query, setQuery] = useState('');

  const filterByStatus = useCallback((status) => {
    setFilterStatus(status);
  }, []);

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const matchesQuery =
        route.name.toLowerCase().includes(query.toLowerCase()) ||
        route.id.toLowerCase().includes(query.toLowerCase()) ||
        route.repName.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        filterStatus === 'ALL' || route.status.toUpperCase() === filterStatus.toUpperCase();

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
