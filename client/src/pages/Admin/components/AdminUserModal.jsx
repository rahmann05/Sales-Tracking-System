/**
 * AdminUserModal.jsx
 * Single Responsibility: Unified dialog for creating and editing user accounts,
 * integrating reactive role templates and instant permission customization.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { usersApi, rolesApi } from '../../../services/api';
import { LuX, LuSave, LuUserPlus, LuUserCheck, LuMapPin, LuKey, LuMail, LuUser } from 'react-icons/lu';
import { notifySuccess, notifyError } from '../../../services/notificationService';
import { RoleCardSelector } from './RoleCardSelector';
import { PermissionsCustomizer } from './PermissionsCustomizer';
import { BUILT_IN_ROLE_TEMPLATES, getEmptyPermissions } from '../../../constants/permissions';

export const AdminUserModal = ({ user, clusters = [], onClose, onSuccess }) => {
  const isEditing = !!user;

  // Roles registry
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES',
    clusterId: '',
  });

  // Permissions state
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch available roles from backend
  useEffect(() => {
    let isMounted = true;
    const loadRoles = async () => {
      try {
        const res = await rolesApi.getAll();
        if (isMounted && res?.data) {
          setAvailableRoles(res.data);
        }
      } catch (err) {
        console.error('Failed to load roles from API, falling back to built-ins:', err);
        // Fallback to built-in roles
        if (isMounted) {
          setAvailableRoles([
            { code: 'ADMIN', name: 'Admin', description: 'Administrator dengan wewenang penuh mengurus seluruh fitur, operasional, logistik, dan pengaturan sistem.', badgeColor: 'blue', isSystem: true, defaultPermissions: BUILT_IN_ROLE_TEMPLATES.ADMIN },
            { code: 'SUPERVISOR', name: 'Supervisor', description: 'Supervisi tim sales, monitoring live GPS, persetujuan toko baru, validasi koordinat, dan laporan.', badgeColor: 'purple', isSystem: true, defaultPermissions: BUILT_IN_ROLE_TEMPLATES.SUPERVISOR },
            { code: 'SALES', name: 'Sales Field', description: 'Sales lapangan untuk eksekusi rute PJP, absensi toko, input pesanan PO, dan registrasi NOO.', badgeColor: 'emerald', isSystem: true, defaultPermissions: BUILT_IN_ROLE_TEMPLATES.SALES },
            { code: 'KEPALA_GUDANG', name: 'Kepala Gudang', description: 'Manajemen logistik gudang, penerimaan packing list admin, alokasi rute supir, dan monitor pengiriman.', badgeColor: 'amber', isSystem: true, defaultPermissions: BUILT_IN_ROLE_TEMPLATES.KEPALA_GUDANG },
            { code: 'SUPIR', name: 'Supir Pengiriman', description: 'Armada pengiriman lapangan, navigasi rute pengantaran toko, dan input bukti serah terima barang.', badgeColor: 'orange', isSystem: true, defaultPermissions: BUILT_IN_ROLE_TEMPLATES.SUPIR },
          ]);
        }
      } finally {
        if (isMounted) setLoadingRoles(false);
      }
    };
    loadRoles();
    return () => { isMounted = false; };
  }, []);

  // Initialize form data when editing or creating
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Blank when editing
        role: user.roleCode || user.role || 'SALES',
        clusterId: user.clusterId || '',
      });
      setPermissions(user.permissions || {});
    } else {
      // New user defaults to SALES template
      const defaultRole = 'SALES';
      const roleDef = availableRoles.find((r) => r.code === defaultRole);
      const initialPerms = roleDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES.SALES || getEmptyPermissions();
      setPermissions(initialPerms);
    }
  }, [user, availableRoles]);

  // Active role definition
  const currentRoleDef = useMemo(() => {
    return availableRoles.find((r) => r.code === formData.role);
  }, [availableRoles, formData.role]);

  // Check if permissions differ from current role template
  const isModifiedFromTemplate = useMemo(() => {
    const template = currentRoleDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[formData.role] || {};
    const allKeys = new Set([...Object.keys(template), ...Object.keys(permissions || {})]);
    for (const key of allKeys) {
      if (!!template[key] !== !!permissions[key]) {
        return true;
      }
    }
    return false;
  }, [currentRoleDef, formData.role, permissions]);

  // Handle Role Selection (Auto-load template)
  const handleSelectRole = (newRoleCode) => {
    const targetDef = availableRoles.find((r) => r.code === newRoleCode);
    const templatePerms = targetDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[newRoleCode] || getEmptyPermissions();

    setFormData((prev) => ({ ...prev, role: newRoleCode, clusterId: newRoleCode !== prev.role ? '' : prev.clusterId }));
    setPermissions(templatePerms);
  };

  // Toggle single permission
  const handleTogglePermission = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Reset to current role's template
  const handleResetToTemplate = () => {
    const templatePerms = currentRoleDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[formData.role] || getEmptyPermissions();
    setPermissions(templatePerms);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        // Update user profile and role
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          clusterId: formData.clusterId || null,
        };
        await usersApi.update(user.id, updateData);

        // Update password if specified
        if (formData.password) {
          await usersApi.updatePassword(user.id, formData.password);
        }

        // Update permissions
        await usersApi.updatePermissions(user.id, permissions);

        notifySuccess('Data dan izin pengguna berhasil diperbarui');
      } else {
        // Create user with direct permissions
        if (!formData.password) {
          notifyError('Password wajib diisi untuk pengguna baru');
          setLoading(false);
          return;
        }

        const createPayload = {
          ...formData,
          clusterId: formData.clusterId || null,
          permissions,
        };

        await usersApi.create(createPayload);
        notifySuccess('Pengguna baru dan izin akses berhasil dibuat');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
      <div className="bg-surface border border-border-glass rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-glass flex items-center justify-between bg-surface-container/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              {isEditing ? <LuUserCheck className="text-xl" /> : <LuUserPlus className="text-xl" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">
                {isEditing ? 'Edit Profil & Hak Akses Pengguna' : 'Tambah Pengguna Baru & Template Hak Akses'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Konfigurasikan informasi akun, tetapkan peran (role), dan sesuaikan izin akses fitur secara langsung.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
          >
            <LuX className="text-xl" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Account Details & Role Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <LuUser className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: Hendra Wijaya"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-border-glass text-sm text-on-surface focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="hendra@perusahaan.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-border-glass text-sm text-on-surface focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Password {isEditing && <span className="text-[11px] font-normal text-on-surface-variant/70">(Kosongkan jika tidak diganti)</span>}
                </label>
                <div className="relative">
                  <LuKey className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isEditing ? 'Biarkan kosong untuk mempertahankan' : 'Minimal 6 karakter'}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-border-glass text-sm text-on-surface focus:border-primary focus:outline-none"
                    minLength={6}
                    required={!isEditing}
                  />
                </div>
              </div>

              {/* Role Card Selector */}
              {loadingRoles ? (
                <div className="p-4 text-center text-xs text-on-surface-variant">
                  Memuat daftar role...
                </div>
              ) : (
                <RoleCardSelector
                  roles={availableRoles}
                  selectedRole={formData.role}
                  onSelectRole={handleSelectRole}
                />
              )}

              <p className="text-sm text-on-surface-variant">Penugasan tim dan wilayah sales dikelola pada menu Tim, wilayah, dan PJP setelah akun disimpan.</p>
              {/* Cluster Assignment (If applicable) */}
              {formData.role !== 'ADMIN' && (currentRoleDef?.baseRole || formData.role) !== 'SALES' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Penugasan Kluster Wilayah
                  </label>
                  <div className="relative">
                    <LuMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                    <select
                      name="clusterId"
                      value={formData.clusterId}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-border-glass text-sm text-on-surface focus:border-primary focus:outline-none"
                    >
                      <option value="">-- Tanpa Kluster (Pusat / Semua Area) --</option>
                      {clusters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.region})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Permission Template & Granular Customizer (7 cols) */}
            <div className="lg:col-span-7 bg-surface-container/20 border border-border-glass rounded-2xl p-4 flex flex-col">
              <PermissionsCustomizer
                permissions={permissions}
                onTogglePermission={handleTogglePermission}
                onBulkSet={setPermissions}
                onResetToTemplate={handleResetToTemplate}
                selectedRoleName={currentRoleDef?.name || formData.role}
                isModified={isModifiedFromTemplate}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-6 mt-6 border-t border-border-glass flex items-center justify-between">
            <div className="text-xs text-on-surface-variant">
              Role aktif: <span className="font-bold text-on-surface">{currentRoleDef?.name || formData.role}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : (
                  <>
                    <LuSave className="text-sm" />
                    <span>{isEditing ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
