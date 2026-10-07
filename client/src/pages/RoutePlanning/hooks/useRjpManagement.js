import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { parseSpreadsheetCsv } from '../../../services/spreadsheetImportService';
import { clustersApi, outletsApi, collectPages } from '../../../services/api';

/**
 * useRjpManagement Hook
 * Single Responsibility: Master Cluster State, Outlets Quota Management, and Spreadsheet Import Workflow.
 * Data murni dari PostgreSQL (bukan mockup).
 */
export const useRjpManagement = () => {
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [deletingId,setDeletingId]=useState(null);
  const revision=useRef(0);
  const [masterClusters, setMasterClusters] = useState([]);
  const [coverageOutlets, setCoverageOutlets] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState(null);

  // Load master clusters & coverage outlets dari PostgreSQL
  const load = useCallback(async () => {
      const current=++revision.current;setLoading(true);setError('');
      try {
      const [clustersRes, outletsRes] = await Promise.all([
        clustersApi.getAll(),
        collectPages(outletsApi.getAll),
      ]);

      if(current!==revision.current)return;
      const clusters = Array.isArray(clustersRes?.data) ? clustersRes.data : [];
      setMasterClusters(clusters.map((c) => {
        const assignedSales = c.assignedSales;
        const supervisor = c.supervisor;
        const spvName = supervisor?.name || (c.assignedSpvName && c.assignedSpvName !== '-' ? c.assignedSpvName : 'Belum Ditugaskan');
        return {
          id: c.id,
          code: c.code || 'Belum memiliki kode',
          name: c.name,
          tradeType:new Set((c.outlets || []).map(outlet=>outlet.type)).size>1?'MIXED':c.outlets?.[0]?.type || null,
          region: c.region || '—',
          colorHex: c.colorHex || '#3B82F6',
          subDistricts: c.subDistricts || [],
          allocatedOutletsCount: c._count?.outlets ?? c.allocatedOutletsCount ?? 0,
          assignedSalesId: c.assignedSalesId || assignedSales?.id || null,
          assignedSalesName: assignedSales?.name || 'Belum Ditugaskan',
          supervisorId: c.supervisorId || null,
          assignedSpvId: c.supervisorId || null,
          assignedSpvName: spvName,
          spvTeamName: `Tim SPV ${spvName}`,
          status: c.status || 'ACTIVE',
          createdAt: c.createdAt ? String(c.createdAt).split('T')[0] : '',
        };
      }));

      const outlets = Array.isArray(outletsRes?.data) ? outletsRes.data : [];
      setCoverageOutlets(outlets.map((o) => ({
        id: o.id,
        name: o.name,
        outletCode: o.outletCode,
        address: o.address,
        clusterName: (!o.cluster || o.cluster.deletedAt || o.cluster.name==='Belum Ditugaskan') ? '-' : (o.cluster.name || o.clusterName || '-'),
        type: o.type || 'MODERN_TRADE',
        latitude: Number(o.latitude),
        longitude: Number(o.longitude),
      })));
      } catch(err){if(current===revision.current)setError(err.message);}
      finally{if(current===revision.current)setLoading(false);}
  },[]);
  useEffect(()=>{load();return()=>{revision.current++;};},[load]);

  // Computed Allocation Statistics
  const stats = useMemo(() => {
    const totalOutlets = coverageOutlets.length;
    const gtOutlets = coverageOutlets.filter(o => o.type === 'GENERAL_TRADE');
    const mtOutlets = coverageOutlets.filter(o => o.type !== 'GENERAL_TRADE');
    
    const totalAllocated = coverageOutlets.filter(o => o.clusterName !== '-').length;
    const gtAllocated = gtOutlets.filter(o => o.clusterName !== '-').length;
    const mtAllocated = mtOutlets.filter(o => o.clusterName !== '-').length;

    const unallocatedCount = Math.max(0, totalOutlets - totalAllocated);
    const allocationPercentage = totalOutlets > 0 ? Math.round((totalAllocated / totalOutlets) * 100) : 0;

    return {
      totalOutlets,
      gtCount: gtOutlets.length,
      mtCount: mtOutlets.length,
      totalAllocated,
      gtAllocated,
      mtAllocated,
      unallocatedCount,
      allocationPercentage,
      activeClustersCount: masterClusters.length,
    };
  }, [masterClusters, coverageOutlets]);

  // CRUD Cluster via API
  const handleUpdateCluster = async (id, updatedData) => {
    try {
      const res = await clustersApi.update(id, updatedData);
      await load();
      setIsFormModalOpen(false);
      setEditingCluster(null);
      return res.data;
    } catch (error) {
      console.error('Failed to update cluster:', error);
      throw error;
    }
  };

  const handleDeleteCluster = async (id) => {
    if(deletingId)return false;
    setDeletingId(id);
    try {
      await clustersApi.delete(id);
      await load();
    } catch (error) {
      setError(error.message);
      return false;
    } finally {setDeletingId(null);}
  };

  const handleImportSpreadsheet=async csvText=>{
    const rows=parseSpreadsheetCsv(csvText);
    if(!rows.length)throw new Error('CSV tidak berisi data');
    const res=await clustersApi.importRjp(rows);await load();setIsImportModalOpen(false);return res.data;
  };

  return {reload:load,error,loading,deletingId,
    masterClusters,
    coverageOutlets,
    stats,
    isImportModalOpen,
    setIsImportModalOpen,
    isFormModalOpen,
    setIsFormModalOpen,
    editingCluster,
    setEditingCluster,
    handleUpdateCluster,
    handleDeleteCluster,
    handleImportSpreadsheet,
  };
};
