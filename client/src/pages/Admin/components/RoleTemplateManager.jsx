/**
 * RoleTemplateManager.jsx
 * Single Responsibility: Master hub for viewing system and custom roles,
 * creating new custom roles, and editing their default permission templates.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React, { useState, useEffect } from 'react';
import { rolesApi } from '../../../services/api';
import {
  LuPlus,
  LuShield,
  LuShieldCheck,
  LuUsers,
  LuLayers,
  LuPackage,
  LuTruck,
  LuNavigation,
  LuTrash2,
  LuSave,
  LuX,
} from 'react-icons/lu';
import { FiEdit } from 'react-icons/fi';
import { notifySuccess, notifyError } from '../../../services/notificationService';
import { PermissionsCustomizer } from './PermissionsCustomizer';
import { ALL_PERMISSIONS, getEmptyPermissions, BUILT_IN_ROLE_TEMPLATES } from '../../../constants/permissions';

const ROLE_ICONS = {
  ADMIN: LuShieldCheck,
  SUPERVISOR: LuUsers,
  SALES: LuNavigation,
  KEPALA_GUDANG: LuPackage,
  SUPIR: LuTruck,
};

export const RoleTemplateManager = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(null);

  // New role form
  const [newRoleForm, setNewRoleForm] = useState({
    code: '',
    name: '',
    description: '',
    badgeColor: 'indigo',
    cloneFromRole: 'SALES',
    defaultPermissions: {},
  });

  // Edit role template form
  const [editPermissions, setEditPermissions] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await rolesApi.getAll();
      setRoles(res.data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      notifyError('Gagal memuat data master role');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Handle open create role modal
  const handleOpenCreateModal = () => {
    const defaultTemplate = BUILT_IN_ROLE_TEMPLATES.SALES || getEmptyPermissions();
    setNewRoleForm({
      code: '',
      name: '',
      description: '',
      badgeColor: 'indigo',
      cloneFromRole: 'SALES',
      defaultPermissions: defaultTemplate,
    });
    setIsCreateModalOpen(true);
  };

  // When clone source changes
  const handleCloneChange = (sourceRoleCode) => {
    const source = roles.find((r) => r.code === sourceRoleCode);
    const template = source?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[sourceRoleCode] || getEmptyPermissions();
    setNewRoleForm((prev) => ({
      ...prev,
      cloneFromRole: sourceRoleCode,
      defaultPermissions: template,
    }));
  };

  // Submit create new role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await rolesApi.create({
        code: newRoleForm.code,
        name: newRoleForm.name,
        description: newRoleForm.description,
        badgeColor: newRoleForm.badgeColor,
        defaultPermissions: newRoleForm.defaultPermissions,
      });
      notifySuccess(`Role baru '${newRoleForm.name}' berhasil dibuat`);
      setIsCreateModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || err.message || 'Gagal membuat role baru');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle open edit template modal
  const handleOpenEditModal = (role) => {
    setActiveRole(role);
    setEditPermissions(role.defaultPermissions || {});
    setIsEditModalOpen(true);
  };

  // Submit update role template
  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    if (!activeRole) return;
    setSubmitting(true);
    try {
      await rolesApi.update(activeRole.code, {
        name: activeRole.name,
        description: activeRole.description,
        defaultPermissions: editPermissions,
      });
      notifySuccess(`Template default untuk role '${activeRole.name}' berhasil diperbarui`);
      setIsEditModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || err.message || 'Gagal memperbarui template role');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete custom role
  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      notifyError('Role bawaan sistem tidak dapat dihapus');
      return;
    }
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus role '${role.name}' (${role.code})?`);
    if (!confirmed) return;

    try {
      await rolesApi.delete(role.code);
      notifySuccess(`Role '${role.name}' berhasil dihapus`);
      fetchRoles();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || err.message || 'Gagal menghapus role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-surface border border-border-glass">
        <div>
          <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <LuShield className="text-primary text-base" />
            Master Role & Template Hak Akses
          </h4>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Kelola definisi peran pengguna dan sesuaikan izin fitur default yang akan otomatis diterapkan saat pembuatan akun.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
        >
          <LuPlus className="text-sm" />
          <span>Tambah Role Baru</span>
        </button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-on-surface-variant">
          Memuat daftar role dan template...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => {
            const IconComp = ROLE_ICONS[r.code] || LuLayers;
            const activePermsCount = Object.values(r.defaultPermissions || {}).filter(Boolean).length;
            const totalPermsCount = ALL_PERMISSIONS.length;

            return (
              <div
                key={r.code}
                className="bg-surface border border-border-glass rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/30 transition-colors"
              >
                <div>
                  {/* Top line: Icon, Title & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <IconComp className="text-lg" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                          {r.name}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container border border-border-glass text-on-surface-variant">
                          {r.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {r.isSystem ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Sistem
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Kustom
                        </span>
                      )}
                      <span className="text-[10px] text-on-surface-variant font-medium">
                        {r.userCount || 0} Pengguna
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-on-surface-variant leading-relaxed min-h-[36px] line-clamp-2 mb-4">
                    {r.description || 'Tidak ada deskripsi peran.'}
                  </p>

                  {/* Template Coverage Bar */}
                  <div className="p-3 rounded-xl bg-surface-container/50 border border-border-glass space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-on-surface-variant">Default Fitur Aktif:</span>
                      <span className="font-bold text-on-surface">
                        {activePermsCount} / {totalPermsCount}
                      </span>
                    </div>
                    <div className="w-full bg-border-glass rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(activePermsCount / totalPermsCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border-glass">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-variant border border-border-glass text-xs font-bold text-on-surface transition-colors cursor-pointer"
                  >
                    <FiEdit className="text-xs" />
                    <span>Ubah Template</span>
                  </button>

                  {!r.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(r)}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                      title="Hapus Role Kustom"
                    >
                      <LuTrash2 className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Tambah Role Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface border border-border-glass rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-border-glass flex items-center justify-between bg-surface-container/30 shrink-0">
              <div className="flex items-center gap-2">
                <LuPlus className="text-primary text-lg" />
                <h3 className="font-bold text-sm text-on-surface">Tambah Role Baru ke Sistem</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <LuX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Kode Role (Huruf Kapital & Angka)
                  </label>
                  <input
                    type="text"
                    value={newRoleForm.code}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                    placeholder="Contoh: KOLEKTOR, AUDIT"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-glass text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Nama Tampilan Role
                  </label>
                  <input
                    type="text"
                    value={newRoleForm.name}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                    placeholder="Contoh: Kolektor Pembayaran Lapangan"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-glass text-xs text-on-surface focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Deskripsi Tanggung Jawab Role
                </label>
                <textarea
                  rows={2}
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  placeholder="Jelaskan peran tugas dan kewenangan operasional role ini..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-glass text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Mulai Dari Template Role:
                </label>
                <select
                  value={newRoleForm.cloneFromRole}
                  onChange={(e) => handleCloneChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-glass text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>
                      Duplikasi Template: {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-surface-container/20 border border-border-glass rounded-xl p-4 mt-4">
                <PermissionsCustomizer
                  permissions={newRoleForm.defaultPermissions}
                  onTogglePermission={(key) =>
                    setNewRoleForm((prev) => ({
                      ...prev,
                      defaultPermissions: {
                        ...prev.defaultPermissions,
                        [key]: !prev.defaultPermissions[key],
                      },
                    }))
                  }
                  onBulkSet={(bulk) =>
                    setNewRoleForm((prev) => ({ ...prev, defaultPermissions: bulk }))
                  }
                  onResetToTemplate={() => handleCloneChange(newRoleForm.cloneFromRole)}
                  selectedRoleName={newRoleForm.name || newRoleForm.code || 'Role Baru'}
                  isModified={false}
                />
              </div>

              <div className="pt-4 border-t border-border-glass flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : (
                    <>
                      <LuSave className="text-sm" />
                      <span>Simpan Role Baru</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Template Default Role */}
      {isEditModalOpen && activeRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface border border-border-glass rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-border-glass flex items-center justify-between bg-surface-container/30 shrink-0">
              <div className="flex items-center gap-2">
                <FiEdit className="text-primary text-lg" />
                <div>
                  <h3 className="font-bold text-sm text-on-surface">
                    Ubah Template Hak Akses: {activeRole.name}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Pengguna baru yang memilih role ini akan otomatis mendapatkan konfigurasi izin ini.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <LuX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleUpdateTemplate} className="p-6 overflow-y-auto space-y-4">
              <div className="bg-surface-container/20 border border-border-glass rounded-xl p-4">
                <PermissionsCustomizer
                  permissions={editPermissions}
                  onTogglePermission={(key) =>
                    setEditPermissions((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                  onBulkSet={setEditPermissions}
                  onResetToTemplate={() => setEditPermissions(activeRole.defaultPermissions || {})}
                  selectedRoleName={activeRole.name}
                  isModified={false}
                />
              </div>

              <div className="pt-4 border-t border-border-glass flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : (
                    <>
                      <LuSave className="text-sm" />
                      <span>Simpan Template</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
