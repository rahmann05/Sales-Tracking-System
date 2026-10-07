import { AdminUserModalView } from './AdminUserModalView';
/**
 * AdminUserModal.jsx
 * Single Responsibility: Unified dialog for creating and editing user accounts,
 * integrating reactive role templates and instant permission customization.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { usersApi, rolesApi } from '../../../services/api';
import { notifySuccess, notifyError } from '../../../services/notificationService';
import { BUILT_IN_ROLE_TEMPLATES, getEmptyPermissions } from '../../../constants/permissions';
export const AdminUserModal = ({
  user,
  clusters = [],
  onClose,
  onSuccess
}) => {
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
    clusterId: ''
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
          setAvailableRoles([{
            code: 'ADMIN',
            name: 'Admin',
            description: 'Administrator dengan wewenang penuh mengurus seluruh fitur, operasional, logistik, dan pengaturan sistem.',
            badgeColor: 'blue',
            isSystem: true,
            defaultPermissions: BUILT_IN_ROLE_TEMPLATES.ADMIN
          }, {
            code: 'SUPERVISOR',
            name: 'Supervisor',
            description: 'Supervisi tim sales, monitoring live GPS, persetujuan toko baru, validasi koordinat, dan laporan.',
            badgeColor: 'purple',
            isSystem: true,
            defaultPermissions: BUILT_IN_ROLE_TEMPLATES.SUPERVISOR
          }, {
            code: 'SALES',
            name: 'Sales Field',
            description: 'Sales lapangan untuk eksekusi rute PJP, absensi toko, input pesanan PO, dan registrasi NOO.',
            badgeColor: 'emerald',
            isSystem: true,
            defaultPermissions: BUILT_IN_ROLE_TEMPLATES.SALES
          }, {
            code: 'KEPALA_GUDANG',
            name: 'Kepala Gudang',
            description: 'Manajemen logistik gudang, penerimaan packing list admin, alokasi rute supir, dan monitor pengiriman.',
            badgeColor: 'amber',
            isSystem: true,
            defaultPermissions: BUILT_IN_ROLE_TEMPLATES.KEPALA_GUDANG
          }, {
            code: 'SUPIR',
            name: 'Supir Pengiriman',
            description: 'Armada pengiriman lapangan, navigasi rute pengantaran toko, dan input bukti serah terima barang.',
            badgeColor: 'orange',
            isSystem: true,
            defaultPermissions: BUILT_IN_ROLE_TEMPLATES.SUPIR
          }]);
        }
      } finally {
        if (isMounted) setLoadingRoles(false);
      }
    };
    loadRoles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize form data when editing or creating
  useEffect(() => {
    if (user) {
      setFormData({
        staffCode: user.staffCode || '',
        name: user.name || '',
        email: user.email || '',
        password: '',
        // Blank when editing
        role: user.roleCode || user.role || 'SALES',
        clusterId: user.clusterId || ''
      });
      setPermissions(user.permissions || {});
    } else {
      // New user defaults to SALES template
      const defaultRole = 'SALES';
      const roleDef = availableRoles.find(r => r.code === defaultRole);
      const initialPerms = roleDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES.SALES || getEmptyPermissions();
      setPermissions(initialPerms);
    }
  }, [user, availableRoles]);

  // Active role definition
  const currentRoleDef = useMemo(() => {
    return availableRoles.find(r => r.code === formData.role);
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
  const handleSelectRole = newRoleCode => {
    const targetDef = availableRoles.find(r => r.code === newRoleCode);
    const templatePerms = targetDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[newRoleCode] || getEmptyPermissions();
    setFormData(prev => ({
      ...prev,
      role: newRoleCode,
      clusterId: newRoleCode !== prev.role ? '' : prev.clusterId
    }));
    setPermissions(templatePerms);
  };

  // Toggle single permission
  const handleTogglePermission = key => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Reset to current role's template
  const handleResetToTemplate = () => {
    const templatePerms = currentRoleDef?.defaultPermissions || BUILT_IN_ROLE_TEMPLATES[formData.role] || getEmptyPermissions();
    setPermissions(templatePerms);
  };
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        // Update user profile and role
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          clusterId: formData.clusterId || null
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
          permissions
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
  return <AdminUserModalView availableRoles={availableRoles} clusters={clusters} currentRoleDef={currentRoleDef} formData={formData} handleChange={handleChange} handleResetToTemplate={handleResetToTemplate} handleSelectRole={handleSelectRole} handleSubmit={handleSubmit} handleTogglePermission={handleTogglePermission} isEditing={isEditing} isModifiedFromTemplate={isModifiedFromTemplate} loading={loading} loadingRoles={loadingRoles} onClose={onClose} permissions={permissions} setFormData={setFormData} setPermissions={setPermissions} />;
};
