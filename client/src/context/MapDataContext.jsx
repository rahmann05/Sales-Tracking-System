import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
      const res = await usersApi.getAll({ role: 'SALES' });
      setSalesUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch sales users:', err);
    }
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchOutlets(), fetchClusters(), fetchSalesUsers()]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Initial fetch
    if (localStorage.getItem('token')) {
      fetchAllData();
    }
  }, [fetchAllData]);

  useEffect(() => {
    // Setup Socket.IO for cache invalidation
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io({
      transports: ['websocket', 'polling'],
      query: { userId: 'MAP_CLIENT' }
    });

    socket.on('cache:invalidate', ({ dataType }) => {
      console.log(`[MapData] Cache invalidated for: ${dataType}`);
      if (dataType === 'outlets') fetchOutlets();
      else if (dataType === 'clusters') fetchClusters();
      else if (dataType === 'users') fetchSalesUsers();
      
      setDataVersion(v => v + 1);
    });

    return () => socket.disconnect();
  }, []);

  const invalidate = (dataType) => {
    if (dataType === 'outlets') fetchOutlets();
    else if (dataType === 'clusters') fetchClusters();
    else if (dataType === 'users') fetchSalesUsers();
    
    setDataVersion(v => v + 1);
  };

  return (
    <MapDataContext.Provider value={{
      outlets,
      clusters,
      salesUsers,
      dataVersion,
      isLoading,
      invalidate,
      refetchAll: fetchAllData
    }}>
      {children}
    </MapDataContext.Provider>
  );
};

export const useMapData = () => {
  const context = useContext(MapDataContext);
  if (!context) {
    throw new Error('useMapData must be used within MapDataProvider');
  }
  return context;
};
