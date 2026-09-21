import { useState } from 'react';
import { getAuthToken, clustersApi, divisionsApi } from '../../services/api';

/**
 * useMasterData - Master clusters & divisions state.
 * Single Responsibility: owns the dynamic master data slices
 * (clusters defined by Supervisor, divisions managed by Admin)
 * and their fetchers.
 */
export const useMasterData = () => {
  // Master Kluster Dinamis (Single Source of Truth yang Didefinisikan Supervisor)
  const [clusters, setClusters] = useState([]);
  // Master Divisi Dinamis (Single Source of Truth dari Admin)
  const [divisions, setDivisions] = useState([]);

  const fetchClusters = async () => {
    try {
      if (!getAuthToken()) return [];
      const res = await clustersApi.getAll();
      const list = Array.isArray(res) ? res : res?.data || [];
      setClusters(list);
      return list;
    } catch (err) {
      console.warn('[useMasterData] Failed to fetch clusters:', err.message);
      return [];
    }
  };

  const fetchDivisions = async () => {
    try {
      if (!getAuthToken()) return [];
      const res = await divisionsApi.getAll();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setDivisions(list);
      return list;
    } catch (err) {
      console.warn('[useMasterData] Failed to fetch divisions:', err.message);
      return [];
    }
  };

  return { clusters, setClusters, fetchClusters, divisions, setDivisions, fetchDivisions };
};
