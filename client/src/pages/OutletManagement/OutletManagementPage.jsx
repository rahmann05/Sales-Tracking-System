import { OutletDirectory } from './OutletDirectory';
import { OutletFormModal } from './OutletFormModal';
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LuStore, LuPlus, LuIdCard, LuFileSpreadsheet } from "react-icons/lu";
import { outletsApi, clustersApi } from '../../services/api';
import { notifySuccess } from '../../services/notificationService';
import { exportImportNikExcel } from '../../utils/customerExport';
import { NikManagementModal } from '../OutletRegistrationReport/components/NikManagementModal';
import { PageHeader } from '../../shared/components/common/PageHeader';
export const OutletManagementPage = () => {
  const {
    user,
    addNotification
  } = useApp();
  const [outlets, setOutlets] = useState([]);
  const [clusterList, setClusterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNikModalOpen, setIsNikModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    outletCode: '',
    address: '',
    latitude: -6.8722,
    longitude: 107.5423,
    clusterId: '',
    clusterName: '',
    ownerName: '',
    phone: ''
  });
  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const [outletsRes, clustersRes] = await Promise.all([outletsApi.getAll(), clustersApi.getAll().catch(() => ({
        data: []
      }))]);
      const list = Array.isArray(outletsRes) ? outletsRes : outletsRes?.data || [];
      const cList = Array.isArray(clustersRes) ? clustersRes : clustersRes?.data || [];
      setOutlets(list);
      setClusterList(cList);
      if (cList.length > 0) {
        setFormData(prev => ({
          ...prev,
          clusterId: prev.clusterId || cList[0].id,
          clusterName: prev.clusterName || cList[0].name
        }));
      }
    } catch (err) {
      console.warn('[OutletManagement] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOutlets();
  }, []);
  const clusters = useMemo(() => {
    const set = new Set();
    outlets.forEach(o => {
      if (o.cluster?.name) set.add(o.cluster.name);
    });
    return Array.from(set);
  }, [outlets]);
  const filteredOutlets = useMemo(() => {
    return outlets.filter(o => {
      const matchSearch = (o.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (o.address || '').toLowerCase().includes(searchQuery.toLowerCase()) || (o.outletCode || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCluster = selectedCluster === 'ALL' || o.cluster?.name === selectedCluster;
      return matchSearch && matchCluster;
    });
  }, [outlets, searchQuery, selectedCluster]);
  const handleSaveAdd = async e => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError('');
    const chosen = clusterList.find(c => c.id === formData.clusterId || c.name === formData.clusterName) || clusterList[0];
    const newEntry = {
      ...formData,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      clusterId: chosen?.id,
      clusterName: chosen?.name,
      cluster: {
        id: chosen?.id,
        name: chosen?.name
      }
    };
    try {
      const response = await outletsApi.create(newEntry);
      setOutlets(prev => [response.data, ...prev]);
      setIsAddModalOpen(false);
      notifySuccess(`Outlet ${newEntry.name} berhasil ditambahkan!`);
      addNotification({
        title: 'Master Outlet Baru Ditambahkan',
        message: `Outlet "${newEntry.name}" telah didaftarkan ke sistem oleh ${user.name}.`,
        roleTarget: ['SUPERVISOR', 'ADMIN']
      });
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleSaveEdit = async e => {
    e.preventDefault();
    if (!editingOutlet) return;
    const chosen = clusterList.find(c => c.id === formData.clusterId || c.name === formData.clusterName) || clusterList[0];
    setOutlets(prev => prev.map(o => o.id === editingOutlet.id ? {
      ...o,
      name: formData.name,
      address: formData.address,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      ownerName: formData.ownerName,
      phone: formData.phone,
      clusterId: chosen?.id,
      cluster: {
        id: chosen?.id,
        name: chosen?.name
      }
    } : o));
    const updatedId = editingOutlet.id;
    setEditingOutlet(null);
    notifySuccess(`Data outlet berhasil diperbarui.`);
    outletsApi.update(updatedId, {
      ...formData,
      clusterId: chosen?.id
    }).catch(err => {
      console.warn('[API] Update outlet error:', err.message);
    });
  };
  const handleDelete = async outlet => {
    if (window.confirm(`Hapus/nonaktifkan outlet "${outlet.name}" dari master data?`)) {
      setOutlets(prev => prev.filter(o => o.id !== outlet.id));
      notifySuccess(`Outlet ${outlet.name} telah dinonaktifkan.`);
      outletsApi.remove(outlet.id).catch(err => {
        console.warn('[API] Delete outlet error:', err.message);
      });
    }
  };
  const openEditModal = o => {
    setEditingOutlet(o);
    setFormData({
      name: o.name || '',
      outletCode: o.outletCode || '',
      address: o.address || '',
      latitude: o.latitude || -6.8722,
      longitude: o.longitude || 107.5423,
      clusterName: o.cluster?.name || 'Klaster Belfoods Bandung Raya',
      ownerName: o.ownerName || '',
      phone: o.phone || ''
    });
  };
  return <div className="page-container space-y-6 pb-24">
      {/* Standardized Header */}
      <PageHeader badge={<span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuStore className="text-sm" /> Pelanggan
          </span>} title="Master outlet" subtitle="Kelola identitas pelanggan, alamat, koordinat, dan wilayah toko." stats={[{
      label: 'Total Outlet',
      value: `${outlets.length} Toko`,
      color: 'emerald'
    }, {
      label: 'Filter Kluster',
      value: selectedCluster === 'ALL' ? 'Semua Kluster' : selectedCluster,
      color: 'blue'
    }]} actions={<div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button type="button" onClick={() => setIsNikModalOpen(true)} className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-surface border border-border-glass hover:bg-surface-container text-on-surface font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0" title="Kelola dan Input NIK 16-Digit Pemilik Toko">
              <LuIdCard className="text-sm" />
              <span>Kelola NIK</span>
            </button>
            <button type="button" onClick={() => exportImportNikExcel(outlets, `IMPORT_NIK_${new Date().toISOString().split('T')[0]}.xls`)} className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-surface border border-border-glass hover:bg-surface-container text-on-surface font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0" title="Ekspor Format Resmi IMPORT NIK.xlsx (7 Kolom)">
              <LuFileSpreadsheet className="text-sm" />
              <span>Ekspor NIK</span>
            </button>
            <button type="button" onClick={() => {
        setFormData({
          name: '',
          outletCode: '',
          address: '',
          latitude: -6.8722,
          longitude: 107.5423,
          clusterName: 'Klaster Belfoods Bandung Raya',
          ownerName: '',
          phone: ''
        });
        setIsAddModalOpen(true);
      }} className="w-full sm:w-auto px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-primary/90 transition-all cursor-pointer shrink-0">
              <LuPlus className="text-sm" />
              <span>Tambah outlet</span>
            </button>
          </div>} />

      {/* Unified Master Outlet Workspace Card */}
      <OutletDirectory clusters={clusters} filteredOutlets={filteredOutlets} handleDelete={handleDelete} loading={loading} openEditModal={openEditModal} outlets={outlets} searchQuery={searchQuery} selectedCluster={selectedCluster} setSearchQuery={setSearchQuery} setSelectedCluster={setSelectedCluster} />

      {/* Modal Add Outlet */}
      {isAddModalOpen && <OutletFormModal mode="create" clusterList={clusterList} formData={formData} onSubmit={handleSaveAdd} error={saveError} saving={saving} setFormData={setFormData} onClose={() => setIsAddModalOpen(false)} />}

      {/* Modal Edit Outlet */}
      {editingOutlet && <OutletFormModal mode="edit" clusterList={clusterList} formData={formData} onSubmit={handleSaveEdit} setFormData={setFormData} onClose={() => setEditingOutlet(null)} />}

      {/* Modal Kelola & Input NIK */}
      <NikManagementModal isOpen={isNikModalOpen} onClose={() => setIsNikModalOpen(false)} customerList={outlets} onDataUpdated={fetchOutlets} />
    </div>;
};
