import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LuStore, 
  LuPlus, 
  LuSearch, 
  LuFilter, 
  LuMapPin, 
  LuTrash2, 
  LuPhone, 
  LuX,
  LuIdCard,
  LuDownload,
  LuFileSpreadsheet
} from 'react-icons/lu';
import { FiEdit, FiCheckCircle } from 'react-icons/fi';
import { Card } from '../../components/common/Card';
import { outletsApi } from '../../services/api';
import { notifySuccess } from '../../services/notificationService';
import { exportImportNikExcel } from '../../utils/customerExport';
import { NikManagementModal } from '../OutletRegistrationReport/components/NikManagementModal';

export const OutletManagementPage = () => {
  const { user, addNotification } = useApp();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
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
    clusterId: 'cluster-belfoods-01',
    clusterName: 'Klaster Belfoods Bandung Raya',
    ownerName: '',
    phone: '',
  });

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const res = await outletsApi.getAll();
      const list = Array.isArray(res) ? res : res?.data || [];
      setOutlets(list);
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
    outlets.forEach((o) => {
      if (o.cluster?.name) set.add(o.cluster.name);
    });
    return Array.from(set);
  }, [outlets]);

  const filteredOutlets = useMemo(() => {
    return outlets.filter((o) => {
      const matchSearch = 
        (o.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.outletCode || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCluster = selectedCluster === 'ALL' || o.cluster?.name === selectedCluster;
      return matchSearch && matchCluster;
    });
  }, [outlets, searchQuery, selectedCluster]);

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    const newEntry = {
      ...formData,
      id: `outlet-${Date.now()}`,
      outletCode: formData.outletCode || `OUT-${Math.floor(1000 + Math.random() * 9000)}`,
      cluster: { name: formData.clusterName },
    };

    setOutlets((prev) => [newEntry, ...prev]);
    setIsAddModalOpen(false);
    notifySuccess(`Outlet ${newEntry.name} berhasil ditambahkan!`);

    addNotification({
      title: 'Master Outlet Baru Ditambahkan',
      message: `Outlet "${newEntry.name}" telah didaftarkan ke sistem oleh ${user.name}.`,
      roleTarget: ['OPERATIONAL_MANAGER', 'SUPERVISOR'],
    });

    outletsApi.create(newEntry).catch((err) => {
      console.warn('[API] Create outlet error:', err.message);
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingOutlet) return;

    setOutlets((prev) =>
      prev.map((o) =>
        o.id === editingOutlet.id
          ? {
              ...o,
              name: formData.name,
              address: formData.address,
              latitude: Number(formData.latitude),
              longitude: Number(formData.longitude),
              ownerName: formData.ownerName,
              phone: formData.phone,
              cluster: { name: formData.clusterName },
            }
          : o
      )
    );

    const updatedId = editingOutlet.id;
    setEditingOutlet(null);
    notifySuccess(`Data outlet berhasil diperbarui.`);

    outletsApi.update(updatedId, formData).catch((err) => {
      console.warn('[API] Update outlet error:', err.message);
    });
  };

  const handleDelete = async (outlet) => {
    if (window.confirm(`Hapus/nonaktifkan outlet "${outlet.name}" dari master data?`)) {
      setOutlets((prev) => prev.filter((o) => o.id !== outlet.id));
      notifySuccess(`Outlet ${outlet.name} telah dinonaktifkan.`);

      outletsApi.remove(outlet.id).catch((err) => {
        console.warn('[API] Delete outlet error:', err.message);
      });
    }
  };

  const openEditModal = (o) => {
    setEditingOutlet(o);
    setFormData({
      name: o.name || '',
      outletCode: o.outletCode || '',
      address: o.address || '',
      latitude: o.latitude || -6.8722,
      longitude: o.longitude || 107.5423,
      clusterName: o.cluster?.name || 'Klaster Belfoods Bandung Raya',
      ownerName: o.ownerName || '',
      phone: o.phone || '',
    });
  };

  return (
    <div className="page-container space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-3xl border border-border-glass">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
            <LuStore className="text-sm" />
            <span>MASTER DATA OUTLET & TOKO</span>
          </div>
          <h2 className="text-xl font-black text-on-surface">Kelola Master Outlet & Titik Kunjungan</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Kelola {outlets.length} database titik toko dan koordinat GPS pelanggan
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsNikModalOpen(true)}
            className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer w-fit shrink-0"
            title="Kelola dan Input NIK 16-Digit Pemilik Toko"
          >
            <LuIdCard className="text-sm" />
            <span>Kelola / Input NIK</span>
          </button>
          <button
            type="button"
            onClick={() => exportImportNikExcel(outlets, `IMPORT_NIK_${new Date().toISOString().split('T')[0]}.xls`)}
            className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer w-fit shrink-0"
            title="Ekspor Format Resmi IMPORT NIK.xlsx (7 Kolom)"
          >
            <LuFileSpreadsheet className="text-sm" />
            <span>Ekspor IMPORT NIK</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                outletCode: '',
                address: '',
                latitude: -6.8722,
                longitude: 107.5423,
                clusterName: 'Klaster Belfoods Bandung Raya',
                ownerName: '',
                phone: '',
              });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition-all cursor-pointer w-fit shrink-0"
          >
            <LuPlus className="text-sm" />
            <span>+ Tambah Outlet Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari toko berdasarkan nama, kode, atau alamat..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <LuFilter className="text-on-surface-variant text-sm shrink-0" />
          <select
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="py-2.5 px-3 rounded-2xl bg-surface border border-border-glass text-xs text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
          >
            <option value="ALL">Semua Klaster ({outlets.length})</option>
            {clusters.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <Card className="!p-0 rounded-3xl border border-border-glass overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border-glass flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface">
            Menampilkan {filteredOutlets.length} outlet dari total {outlets.length} toko
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">Memuat data master outlet dari PostgreSQL...</div>
        ) : filteredOutlets.length === 0 ? (
          <div className="p-12 text-center text-xs text-on-surface-variant">Tidak ada outlet yang sesuai dengan pencarian.</div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-variant/30 text-on-surface-variant font-bold border-b border-border-glass sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4">Kode & Nama Toko</th>
                  <th className="py-3 px-4">Alamat</th>
                  <th className="py-3 px-4">Klaster</th>
                  <th className="py-3 px-4">Koordinat GPS</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-glass">
                {filteredOutlets.slice(0, 50).map((outlet) => (
                  <tr key={outlet.id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">{outlet.name}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">{outlet.outletCode || outlet.id?.substring(0, 8)}</div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant max-w-[220px] truncate" title={outlet.address}>
                      {outlet.address || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {outlet.cluster?.name || 'Klaster Belfoods'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">
                      {outlet.latitude?.toFixed(4)}, {outlet.longitude?.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(outlet)}
                          className="p-1.5 rounded-lg bg-surface-variant/40 hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
                          title="Edit Outlet"
                        >
                          <FiEdit className="text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(outlet)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-all cursor-pointer"
                          title="Hapus Outlet"
                        >
                          <LuTrash2 className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Add Outlet */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-glass rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border-glass pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <LuPlus />
                </span>
                <h3 className="text-base font-black text-on-surface">Tambah Outlet Baru ke Database</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <LuX className="text-base" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Nama Outlet / Toko</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Borma Toserba Padalarang"
                  className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Alamat Lengkap</label>
                <textarea
                  rows="2"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Raya Padalarang No. 504, Kertamulya, Bandung Barat"
                  className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Klaster Wilayah</label>
                <select
                  value={formData.clusterName}
                  onChange={(e) => setFormData({ ...formData, clusterName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface"
                >
                  <option value="Klaster Belfoods Bandung Raya">Klaster Belfoods Bandung Raya</option>
                  <option value="Klaster Cimahi Tengah">Klaster Cimahi Tengah</option>
                  <option value="Klaster Padalarang (KBB)">Klaster Padalarang (KBB)</option>
                  <option value="Klaster Lembang (KBB Utara)">Klaster Lembang (KBB Utara)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-glass">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-surface-variant/40 hover:bg-surface-variant text-on-surface-variant rounded-xl font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
                >
                  Simpan Outlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Outlet */}
      {editingOutlet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-glass rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border-glass pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <FiEdit />
                </span>
                <h3 className="text-base font-black text-on-surface">Edit Master Data Outlet</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOutlet(null)}
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <LuX className="text-base" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Nama Outlet / Toko</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Alamat Lengkap</label>
                <textarea
                  rows="2"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Klaster Wilayah</label>
                <select
                  value={formData.clusterName}
                  onChange={(e) => setFormData({ ...formData, clusterName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface"
                >
                  <option value="Klaster Belfoods Bandung Raya">Klaster Belfoods Bandung Raya</option>
                  <option value="Klaster Cimahi Tengah">Klaster Cimahi Tengah</option>
                  <option value="Klaster Padalarang (KBB)">Klaster Padalarang (KBB)</option>
                  <option value="Klaster Lembang (KBB Utara)">Klaster Lembang (KBB Utara)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-glass">
                <button
                  type="button"
                  onClick={() => setEditingOutlet(null)}
                  className="px-4 py-2 bg-surface-variant/40 hover:bg-surface-variant text-on-surface-variant rounded-xl font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola & Input NIK */}
      <NikManagementModal
        isOpen={isNikModalOpen}
        onClose={() => setIsNikModalOpen(false)}
        customerList={outlets}
        onDataUpdated={fetchOutlets}
      />
    </div>
  );
};
