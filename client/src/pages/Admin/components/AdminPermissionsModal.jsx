/**
 * AdminPermissionsModal.jsx
 * Single Responsibility: Dedicated modal for inspecting and customizing granular permissions
 * of an existing user, supporting one-click template application from any role.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { usersApi, rolesApi } from '../../../services/api';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { notifySuccess, notifyError } from '../../../services/notificationService';
import { PermissionsCustomizer } from './PermissionsCustomizer';
import { BUILT_IN_ROLE_TEMPLATES, getEmptyPermissions } from '../../../constants/permissions';

export const AdminPermissionsModal = ({ user, onClose, onSuccess }) => {
  const [permissions, setPermissions] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [templateToApply, setTemplateToApply] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch roles to allow template switching
  useEffect(() => {
    let isMounted = true;
    const fetchRoles = async () => {
      try {
        const res = await rolesApi.getAll();
        if (isMounted && res?.data) {
          setAvailableRoles(res.data);
        }
      } catch (err) {
        console.error('Failed to load roles in permissions modal:', err);
      }
    };
    fetchRoles();
    return () => { isMounted = false; };
  }, []);

  // Initialize permissions from user
  useEffect(() => {
    if (user) {
      setPermissions(user.permissions || {});
      setTemplateToApply(user.role || 'SALES');
    }
  }, [user]);

  // Current user's role definition
  const userRoleDef = useMemo(() => {
    return availableRoles.find((r) => r.code === user?.role);
  }, [availableRoles, user?.role]);

  // Check if permissions differ from current role template
  const isModifiedFromTemplate = useMemo(() => {
    const template = userRoleDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[user?.role] || {};
    const allKeys = new Set([...Object.keys(template), ...Object.keys(permissions || {})]);
    for (const key of allKeys) {
      if (!!template[key] !== !!permissions[key]) {
        return true;
      }
    }
    return false;
  }, [userRoleDef, user?.role, permissions]);

  // Toggle single permission
  const handleToggle = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Reset to the user's current role template
  const handleResetToUserRole = () => {
    const template = userRoleDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[user?.role] || getEmptyPermissions();
    setPermissions(template);
  };

  // Apply template from a different selected role
  const handleApplyTemplate = () => {
    if (!templateToApply) return;
    const targetDef = availableRoles.find((r) => r.code === templateToApply);
    const template = targetDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[templateToApply] || getEmptyPermissions();
    setPermissions(template);
    notifySuccess(`Template role ${targetDef?.name || templateToApply} diterapkan`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await usersApi.updatePermissions(user.id, permissions);
      notifySuccess('Izin akses pengguna berhasil diperbarui');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return <NativeDialog open title={`Izin akses · ${user.name}`} onClose={onClose} busy={loading} className="admin-permissions-dialog">
    <p className="admin-dialog-description">Tinjau izin untuk {user.email}. Perubahan berlaku setelah disimpan.</p>
    <form onSubmit={handleSubmit}>
      <fieldset disabled={loading} className="admin-permissions-fields">
        <div className="admin-template-picker"><label>Template peran<select value={templateToApply} onChange={event=>setTemplateToApply(event.target.value)}>{availableRoles.map(role=><option key={role.code} value={role.code}>{role.name}</option>)}</select></label><button type="button" onClick={handleApplyTemplate}>Gunakan template</button></div>
        <PermissionsCustomizer permissions={permissions} onTogglePermission={handleToggle} onBulkSet={setPermissions} onResetToTemplate={handleResetToUserRole} selectedRoleName={userRoleDef?.name||user.role} isModified={isModifiedFromTemplate}/>
      </fieldset>
      <footer className="admin-dialog-actions"><button type="button" disabled={loading} onClick={onClose}>Batal</button><button type="submit" disabled={loading} className="admin-primary-button">{loading?'Menyimpan…':'Simpan izin akses'}</button></footer>
    </form>
  </NativeDialog>;
};
