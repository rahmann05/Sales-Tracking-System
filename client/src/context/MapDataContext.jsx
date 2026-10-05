import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { outletsApi, clustersApi, usersApi } from '../services/api';
import { io } from 'socket.io-client';

const MapDataContext = createContext();

export const MapDataProvider = ({ children }) => {
  const [outlets, setOutlets] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOutlets = async () => {
    try {
      const res = await outletsApi.getAll();
      setOutlets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch outlets:', err);
    }
  };

  const fetchClusters = async () => {
    try {
      const res = await clustersApi.getAll();
      setClusters(res.data || []);
    } catch (err) {
      console.error('Failed to fetch clusters:', err);
    }
  };

  const fetchSalesUsers = async () => {
    try {
      const userStr = localStorage.getItem('authUser');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user || (user.role !== 'SUPERVISOR' && user.role !== 'ADMIN')) return;

      const res = await usersApi.getAll({ role: 'SALES' });
      setSalesUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch sales users:', err);
    }
  };

  const hasFetchedRef = React.useRef(false);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    hasFetchedRef.current = true;
    await Promise.all([fetchOutlets(), fetchClusters(), fetchSalesUsers()]);
    setIsLoading(false);
  }, []);

  const ensureDataLoaded = useCallback(() => {
    if (hasFetchedRef.current || !localStorage.getItem('token')) return;
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const handleAuthLogin = () => {
      hasFetchedRef.current = false;
    };

    const handleAuthLogout = () => {
      hasFetchedRef.current = false;
      setOutlets([]);
      setClusters([]);
      setSalesUsers([]);
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:expired', handleAuthLogout);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:expired', handleAuthLogout);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  useEffect(() => {
    // Only establish Socket.IO for cache invalidation if authenticated
    const token = localStorage.getItem('token');
    if (!token) return;

    let socket = null;
    try {
      socket = io({
        transports: ['polling', 'websocket'], // Polling first eliminates aborted WSS connection errors
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 2,
        reconnectionDelay: 8000,
        timeout: 10000,
        query: { userId: 'MAP_CLIENT' },
      });

      socket.on('connect_error', (err) => {
        // Suppress benign connection errors in dev
        console.debug('[MapData Socket] Connection notice:', err.message);
      });

      socket.on('cache:invalidate', ({ dataType }) => {
        if (!hasFetchedRef.current) return;
        if (dataType === 'outlets') fetchOutlets();
        else if (dataType === 'clusters') fetchClusters();
        else if (dataType === 'users') fetchSalesUsers();

        setDataVersion((v) => v + 1);
      });
    } catch (err) {
      console.warn('[MapData Socket] Initialization notice:', err.message);
    }

    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, []);

  const invalidate = (dataType) => {
    if (dataType === 'outlets') fetchOutlets();
    else if (dataType === 'clusters') fetchClusters();
    else if (dataType === 'users') fetchSalesUsers();
    
    setDataVersion(v => v + 1);
  };

  const contextValue = useMemo(() => ({
    outlets,
    clusters,
    salesUsers,
    dataVersion,
    isLoading,
    invalidate,
    ensureDataLoaded,
    refetchAll: fetchAllData,
  }), [outlets, clusters, salesUsers, dataVersion, isLoading, ensureDataLoaded, fetchAllData]);

  return (
    <MapDataContext.Provider value={contextValue}>
      {children}
    </MapDataContext.Provider>
  );
};

export const useMapData = () => {
  const context = useContext(MapDataContext);
  if (!context) {
    throw new Error('useMapData must be used within MapDataProvider');
  }
  const { ensureDataLoaded } = context;
  useEffect(() => {
    ensureDataLoaded();
  }, [ensureDataLoaded]);
  return context;
};
