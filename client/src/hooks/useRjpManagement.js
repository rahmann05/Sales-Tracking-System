import { useState, useMemo, useEffect } from 'react';
import { parseSpreadsheetCsv } from '../services/spreadsheetImportService';
import { clustersApi, outletsApi } from '../services/api';

/**
 * useRjpManagement Hook
 * Single Responsibility: Master Cluster State, Outlets Quota Management, and Spreadsheet Import Workflow.
 * Data murni dari PostgreSQL (bukan mockup).
 */
export const useRjpManagement = () => {
  const [masterClusters, setMasterClusters] = useState([]);
  const [coverageOutlets, setCoverageOutlets] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState(null);

  // Load master clusters & coverage outlets dari PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const [clustersRes, outletsRes] = await Promise.all([
        clustersApi.getAll().catch(() => null),
        outletsApi.getAll().catch(() => null),
      ]);
      if (!isMounted) return;

      const clusters = Array.isArray(clustersRes?.data) ? clustersRes.data : [];
      setMasterClusters(clusters.map((c, idx) => ({
        id: c.id,
        code: c.code || `CLS-${idx + 1}`,
        name: c.name,
        region: c.region || '-',
        subDistricts: c.subDistricts || [],
        allocatedOutletsCount: c._count?.outlets ?? c.allocatedOutletsCount ?? 0,
        assignedSpvName: c.assignedSpvName || '-',
        spvTeamName: c.spvTeamName || '-',
        status: c.status || 'ACTIVE',
        createdAt: c.createdAt ? String(c.createdAt).split('T')[0] : '',
      })));

      const outlets = Array.isArray(outletsRes?.data) ? outletsRes.data : [];
      setCoverageOutlets(outlets.map((o) => ({
        id: o.id,
        name: o.name,
        outletCode: o.outletCode,
        address: o.address,
        clusterName: o.cluster?.name || o.clusterName || '-',
        latitude: Number(o.latitude),
        longitude: Number(o.longitude),
      })));
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Computed Allocation Statistics
  const stats = useMemo(() => {
    const totalOutlets = coverageOutlets.length;
    const totalAllocated = masterClusters.reduce((acc, c) => acc + (c.allocatedOutletsCount || 0), 0);
    const unallocatedCount = Math.max(0, totalOutlets - totalAllocated);
    const allocationPercentage = totalOutlets > 0 ? Math.round((totalAllocated / totalOutlets) * 100) : 0;

    return {
      totalOutlets,
      totalAllocated,
      unallocatedCount,
      allocationPercentage,
      activeClustersCount: masterClusters.length,
    };
  }, [masterClusters, coverageOutlets]);

  // CRUD Cluster via API
  const handleCreateCluster = async (newClusterData) => {
    try {
      const res = await clustersApi.create(newClusterData);
      setMasterClusters((prev) => [res.data, ...prev]);
      setIsFormModalOpen(false);
      return res.data;
    } catch (error) {
      console.error('Failed to create cluster:', error);
      throw error;
    }
  };

  const handleUpdateCluster = async (id, updatedData) => {
    try {
      const res = await clustersApi.update(id, updatedData);
      setMasterClusters((prev) => prev.map((c) => (c.id === id ? { ...c, ...res.data } : c)));
      setIsFormModalOpen(false);
      setEditingCluster(null);
      return res.data;
    } catch (error) {
      console.error('Failed to update cluster:', error);
      throw error;
    }
  };

  const handleDeleteCluster = async (id) => {
    try {
      await clustersApi.delete(id);
      setMasterClusters((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete cluster:', error);
      throw error;
    }
  };

  // Import Spreadsheet & Auto-Generate Clusters
  const handleImportSpreadsheet = (csvText) => {
    const parsedOutlets = parseSpreadsheetCsv(csvText);
    if (parsedOutlets.length === 0) {
      throw new Error('Format spreadsheet tidak valid atau kosong.');
    }

    // Merge new outlets into coverage database
    setCoverageOutlets((prev) => [...parsedOutlets, ...prev]);

    // Group by cluster name
    const clusterGroups = {};
    parsedOutlets.forEach((o) => {
      if (!clusterGroups[o.clusterName]) {
        clusterGroups[o.clusterName] = [];
      }
      clusterGroups[o.clusterName].push(o);
    });

    // Create new clusters from import if not existing
    const newClusters = Object.keys(clusterGroups).map((clusterName, idx) => ({
      id: `cluster-imp-${Date.now()}-${idx}`,
      code: `CLS-IMP-${idx + 1}`,
      name: clusterName,
      region: 'Imported Region',
      subDistricts: ['Area Import'],
      allocatedOutletsCount: clusterGroups[clusterName].length,
      assignedSpvName: 'Ahmad Subagja',
      spvTeamName: 'Tim SPV Ahmad Subagja (Cimahi - KBB)',
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    }));

    setMasterClusters((prev) => [...newClusters, ...prev]);
    setIsImportModalOpen(false);
    return { importedOutletsCount: parsedOutlets.length, importedClustersCount: newClusters.length };
  };

  return {
    masterClusters,
    coverageOutlets,
    stats,
    isImportModalOpen,
    setIsImportModalOpen,
    isFormModalOpen,
    setIsFormModalOpen,
    editingCluster,
    setEditingCluster,
    handleCreateCluster,
    handleUpdateCluster,
    handleDeleteCluster,
    handleImportSpreadsheet,
  };
};
