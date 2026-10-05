/**
 * AdminPermissionsModal.jsx
 * Single Responsibility: Dedicated modal for inspecting and customizing granular permissions
 * of an existing user, supporting one-click template application from any role.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { usersApi, rolesApi } from '../../../services/api';
import { LuX, LuSave, LuShieldCheck, LuLayers, LuSparkles } from 'react-icons/lu';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
      <div className="bg-surface border border-border-glass rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-glass flex items-center justify-between bg-surface-container/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <LuShieldCheck className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-on-surface">
                  Atur Izin Akses Khusus Pengguna
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Pengguna: <span className="font-semibold text-on-surface">{user.name}</span> ({user.email})
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

        {/* Template Quick Switcher Banner */}
        <div className="px-6 py-3 bg-surface-container/50 border-b border-border-glass flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LuLayers className="text-sm text-primary" />
            <span className="text-xs font-bold text-on-surface">Terapkan Template Role:</span>
            <select
              value={templateToApply}
              onChange={(e) => setTemplateToApply(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface border border-border-glass text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availableRoles.map((r) => (
                <option key={r.code} value={r.code}>
                  Template {r.name} ({r.code})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleApplyTemplate}
              className="px-2.5 py-1 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <LuSparkles className="text-xs" />
              <span>Terapkan</span>
            </button>
          </div>

          <div className="text-[11px] text-on-surface-variant">
            Fitur yang aktif akan dapat diakses terlepas dari batasan standar role.
          </div>
        </div>

        {/* Form & Customizer Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
          <div className="bg-surface-container/20 border border-border-glass rounded-2xl p-4">
            <PermissionsCustomizer
              permissions={permissions}
              onTogglePermission={handleToggle}
              onBulkSet={setPermissions}
              onResetToTemplate={handleResetToUserRole}
              selectedRoleName={userRoleDef?.name || user.role}
              isModified={isModifiedFromTemplate}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-6 mt-6 border-t border-border-glass flex items-center justify-end gap-2">
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : (
                <>
                  <LuSave className="text-sm" />
                  <span>Simpan Izin Akses</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
