import { RoleTemplateGrid } from './RoleTemplateGrid';
import { RoleTemplateEditModal } from './RoleTemplateEditModal';
/**
 * RoleTemplateManager.jsx
 * Single Responsibility: Master hub for viewing system and custom roles,
 * creating new custom roles, and editing their default permission templates.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React, { useState, useEffect } from 'react';
import { rolesApi } from '../../../services/api';
import { LuPlus, LuShield, LuShieldCheck, LuUsers, LuPackage, LuTruck, LuNavigation, LuSave, LuX } from 'react-icons/lu';
import { FiEdit } from 'react-icons/fi';
import { notifySuccess, notifyError } from '../../../services/notificationService';
import { PermissionsCustomizer } from './PermissionsCustomizer';
import { getEmptyPermissions, BUILT_IN_ROLE_TEMPLATES } from '../../../constants/permissions';
const ROLE_ICONS = {
  ADMIN: LuShieldCheck,
  SUPERVISOR: LuUsers,
  SALES: LuNavigation,
  KEPALA_GUDANG: LuPackage,
  SUPIR: LuTruck
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
    defaultPermissions: {}
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
      defaultPermissions: defaultTemplate
    });
    setIsCreateModalOpen(true);
  };

  // When clone source changes
  const handleCloneChange = sourceRoleCode => {
    const source = roles.find(r => r.code === sourceRoleCode);
    const template = source?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[sourceRoleCode] || getEmptyPermissions();
    setNewRoleForm(prev => ({
      ...prev,
      cloneFromRole: sourceRoleCode,
      defaultPermissions: template
    }));
  };

  // Submit create new role
  const handleCreateRole = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await rolesApi.create({
        baseRole: roles.find(r => r.code === newRoleForm.cloneFromRole)?.baseRole || newRoleForm.cloneFromRole,
        code: newRoleForm.code,
        name: newRoleForm.name,
        description: newRoleForm.description,
        badgeColor: newRoleForm.badgeColor,
        defaultPermissions: newRoleForm.defaultPermissions
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
  const handleOpenEditModal = role => {
    setActiveRole(role);
    setEditPermissions(role.defaultPermissions || {});
    setIsEditModalOpen(true);
  };

  // Submit update role template
  const handleUpdateTemplate = async e => {
    e.preventDefault();
    if (!activeRole) return;
    setSubmitting(true);
    try {
      await rolesApi.update(activeRole.code, {
        name: activeRole.name,
        description: activeRole.description,
        defaultPermissions: editPermissions
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
  const handleDeleteRole = async role => {
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
  return <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-surface border border-border-glass">
        <div>
          <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <LuShield className="text-primary text-base" />
            Master Role & Template Hak Akses
          </h4>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Role kustom mengikuti alur role dasar yang disalin. Template izin berlaku saat akses, dan izin khusus akun dapat menimpa template.
          </p>
        </div>

        <button type="button" onClick={handleOpenCreateModal} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer">
          <LuPlus className="text-sm" />
          <span>Tambah Role Baru</span>
        </button>
      </div>

      {/* Roles Grid */}
      {loading ? <div className="p-12 text-center text-xs text-on-surface-variant">
          Memuat daftar role dan template...
        </div> : <RoleTemplateGrid ROLE_ICONS={ROLE_ICONS} handleDeleteRole={handleDeleteRole} handleOpenEditModal={handleOpenEditModal} roles={roles} />}

      {/* Modal: Tambah Role Baru */}
      {isCreateModalOpen && <RoleTemplateEditModal handleCloneChange={handleCloneChange} handleCreateRole={handleCreateRole} newRoleForm={newRoleForm} roles={roles} setIsCreateModalOpen={setIsCreateModalOpen} setNewRoleForm={setNewRoleForm} submitting={submitting} />}

      {/* Modal: Edit Template Default Role */}
      {isEditModalOpen && activeRole && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
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
              <button onClick={() => setIsEditModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                <LuX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleUpdateTemplate} className="p-6 overflow-y-auto space-y-4">
              <div className="bg-surface-container/20 border border-border-glass rounded-xl p-4">
                <PermissionsCustomizer permissions={editPermissions} onTogglePermission={key => setEditPermissions(prev => ({
              ...prev,
              [key]: !prev[key]
            }))} onBulkSet={setEditPermissions} onResetToTemplate={() => setEditPermissions(activeRole.defaultPermissions || {})} selectedRoleName={activeRole.name} isModified={false} />
              </div>

              <div className="pt-4 border-t border-border-glass flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-variant transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50">
                  {submitting ? 'Menyimpan...' : <>
                      <LuSave className="text-sm" />
                      <span>Simpan Template</span>
                    </>}
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
};
