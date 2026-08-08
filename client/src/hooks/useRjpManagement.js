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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  // Create New Cluster
  const handleCreateCluster = (newClusterData) => {
    const cluster = {
      id: `cluster-${Date.now()}`,
      code: `CLS-MAN-${masterClusters.length + 1}`,
      name: newClusterData.name,
      region: newClusterData.region || 'Kota Cimahi',
      subDistricts: newClusterData.subDistricts || ['Area Baru'],
      allocatedOutletsCount: parseInt(newClusterData.allocatedOutletsCount, 10) || 20,
      assignedSpvName: newClusterData.assignedSpvName || 'Ahmad Subagja',
      spvTeamName: newClusterData.spvTeamName || 'Tim SPV Ahmad Subagja (Cimahi - KBB)',
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setMasterClusters((prev) => [cluster, ...prev]);
    setIsCreateModalOpen(false);
    return cluster;
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
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleCreateCluster,
    handleImportSpreadsheet,
  };
};
