import React, { useState, useEffect } from 'react';
import { LuX, LuSave, LuMapPin, LuUser, LuUserCheck, LuPalette, LuLayers, LuStore, LuLoader } from 'react-icons/lu';
import { usersApi } from '../../../../services/api';
import '../../../../styles/components/EditClusterModal.css';

const PRESET_COLORS = [
  { name: 'Sky Blue', hex: '#3B82F6' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Teal', hex: '#0D9488' },
];

const PRESET_REGIONS = [
  'Cimahi',
  'Bandung Barat',
  'Kota Bandung',
  'Bandung Selatan',
  'Bandung Timur',
  'Bandung Utara',
  'Kabupaten Bandung',
];

/**
 * EditClusterModal Component
 * Single Responsibility: Modal form for editing master cluster identity, region, color, sales assignment, and supervisor.
 */
export const EditClusterModal = ({ isOpen, cluster, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [colorHex, setColorHex] = useState('#3B82F6');
  const [assignedSalesId, setAssignedSalesId] = useState('');
  const [assignedSpvId, setAssignedSpvId] = useState('');
  
  const [salesUsers, setSalesUsers] = useState([]);
  const [supervisorUsers, setSupervisorUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Populate form fields when cluster changes
  useEffect(() => {
    if (cluster) {
      setName(cluster.name || '');
      setRegion(cluster.region || 'Cimahi');
      setColorHex(cluster.colorHex || '#3B82F6');
      setAssignedSalesId(cluster.assignedSalesId || cluster.assignedSales?.id || '');
      setAssignedSpvId(cluster.assignedSpvId || '');
      setErrorMsg('');
    }
  }, [cluster]);

  // Load Supervisors & Sales for assignment dropdown
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const [spvRes, salesRes] = await Promise.all([
          usersApi.getAll({ role: 'SUPERVISOR' }).catch(() => ({ data: [] })),
          usersApi.getAll({ role: 'SALES' }).catch(() => ({ data: [] })),
        ]);
        if (!isMounted) return;

        const spvs = Array.isArray(spvRes?.data) ? spvRes.data : [];
        const sales = Array.isArray(salesRes?.data) ? salesRes.data : [];
        setSupervisorUsers(spvs);
        setSalesUsers(sales);

        // Auto-select sales if not already assigned
        if (sales.length > 0) {
          setAssignedSalesId((prev) => {
            const exists = sales.some((u) => u.id === prev);
            return exists ? prev : sales[0].id;
          });
        }

        // Auto-select supervisor
        if (spvs.length > 0) {
          setAssignedSpvId((prev) => {
            const exists = spvs.some((u) => u.id === prev);
            return exists ? prev : spvs[0].id;
          });
        }
      } catch (err) {
        console.error('Failed to load users for assignment:', err);
      } finally {
        if (isMounted) setIsLoadingUsers(false);
      }
    };

    fetchUsers();
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen || !cluster) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama cluster tidak boleh kosong.');
      return;
    }

    if (!assignedSalesId) {
      setErrorMsg('Sales lapangan bertugas wajib dipilih.');
      return;
    }

    const selectedSales = salesUsers.find((u) => u.id === assignedSalesId);
    const selectedSpv = supervisorUsers.find((u) => u.id === assignedSpvId);

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: name.trim(),
        region: region.trim(),
        colorHex,
        assignedSalesId,
        assignedSalesName: selectedSales?.name || '',
        assignedSpvId: selectedSpv?.id || null,
        assignedSpvName: selectedSpv?.name || '',
      };

      await onSave(cluster.id, payload);
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menyimpan perubahan klaster.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-cluster-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="edit-cluster-modal-box">
        {/* Modal Header */}
        <div className="edit-cluster-modal-header">
          <div>
            <h3 className="edit-cluster-modal-title">
              <LuLayers className="text-primary text-xl" />
              Edit Master Cluster
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                {cluster.code || 'CLS'}
              </span>
            </h3>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5 font-medium">
              Perbarui identitas blueprint cluster, sales bertugas, dan supervisor
            </p>
          </div>
          <button type="button" onClick={onClose} className="edit-cluster-modal-close" title="Tutup">
            <LuX />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="edit-cluster-modal-body">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Nama Cluster */}
            <div className="edit-cluster-form-group">
              <label className="edit-cluster-label">
                Nama Cluster & Wilayah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Cluster Cimahi - (DADAN) W2"
                className="edit-cluster-input font-medium"
                required
              />
            </div>

            {/* Region Selection */}
            <div className="edit-cluster-form-group">
              <label className="edit-cluster-label">
                <LuMapPin className="text-primary" /> Region Wilayah Operasional
              </label>
              <div className="flex gap-2">
                <select
                  value={PRESET_REGIONS.includes(region) ? region : 'CUSTOM'}
                  onChange={(e) => {
                    if (e.target.value !== 'CUSTOM') {
                      setRegion(e.target.value);
                    }
                  }}
                  className="edit-cluster-select flex-1 font-medium"
                >
                  {PRESET_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="CUSTOM">Region Lainnya (Ketik Manual)...</option>
                </select>
                {(!PRESET_REGIONS.includes(region) || region === 'CUSTOM') && (
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Nama Region Baru..."
                    className="edit-cluster-input flex-1 font-medium"
                    required
                  />
                )}
              </div>
            </div>

            {/* Sales Bertugas */}
            <div className="edit-cluster-form-group">
              <label className="edit-cluster-label">
                <LuUser className="text-primary" /> Sales Lapangan Bertugas (Wajib 1 Orang) <span className="text-red-500">*</span>
              </label>
              <select
                value={assignedSalesId}
                onChange={(e) => setAssignedSalesId(e.target.value)}
                className="edit-cluster-select font-medium"
                disabled={isLoadingUsers || salesUsers.length === 0}
                required
              >
                {salesUsers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Supervisor Penanggung Jawab */}
            <div className="edit-cluster-form-group">
              <label className="edit-cluster-label">
                <LuUserCheck className="text-emerald-600" /> Supervisor Wilayah Penanggung Jawab
              </label>
              <select
                value={assignedSpvId}
                onChange={(e) => setAssignedSpvId(e.target.value)}
                className="edit-cluster-select font-medium"
                disabled={isLoadingUsers || supervisorUsers.length === 0}
              >
                {supervisorUsers.map((spv) => (
                  <option key={spv.id} value={spv.id}>
                    {spv.name} ({spv.email})
                  </option>
                ))}
              </select>
              {isLoadingUsers && (
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-1">
                  <LuLoader className="animate-spin text-xs" /> Memuat daftar pengguna...
                </span>
              )}
            </div>

            {/* Cluster Route Color */}
            <div className="edit-cluster-form-group">
              <label className="edit-cluster-label">
                <LuPalette className="text-primary" /> Warna Rute Cluster
              </label>
              <div className="edit-cluster-color-picker-grid">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColorHex(c.hex)}
                    className={`edit-cluster-color-pill ${colorHex === c.hex ? 'active' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-border-glass bg-transparent"
                    title="Pilih Warna Kustom"
                  />
                  <span className="text-xs font-mono font-bold text-on-surface-variant uppercase">{colorHex}</span>
                </div>
              </div>
            </div>

            {/* Cluster Stats Info Card */}
            <div className="edit-cluster-info-card">
              <div className="flex items-center gap-2">
                <LuStore className="text-primary text-lg" />
                <div>
                  <div className="text-xs font-bold text-on-surface">
                    {cluster.allocatedOutletsCount || 0} Toko Terdaftar
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    Total outlet aktif dalam blueprint cluster ini
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                ● {cluster.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="edit-cluster-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="edit-cluster-btn-cancel"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="edit-cluster-btn-submit"
            >
              {isSubmitting ? (
                <>
                  <LuLoader className="animate-spin text-sm" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <LuSave className="text-sm" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
