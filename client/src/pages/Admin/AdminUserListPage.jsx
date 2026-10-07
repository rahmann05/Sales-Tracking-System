import { AdminUserDirectoryView } from './AdminUserDirectoryView';
/**
 * AdminUserListPage.jsx
 * Single Responsibility: Orchestrate User Management and Master Role & Template Hub.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { usersApi, rolesApi } from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';
export const AdminUserListPage = ({
  onGoBack
}) => {
  const {
    setActiveTab,
    clusters
  } = useApp();

  // Primary page tabs: 'users' | 'roles'
  const [activeSubTab, setActiveSubTab] = useState('users');

  // Users data & state
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterCluster, setFilterCluster] = useState('ALL');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([usersApi.getAll(), rolesApi.getAll().catch(() => ({
        data: []
      }))]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      notifyError('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  const handleEditUser = user => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };
  const handleEditPermissions = user => {
    setSelectedUser(user);
    setIsPermissionsModalOpen(true);
  };
  const handleDeleteUser = async user => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin menonaktifkan pengguna ${user.name}?`);
    if (!confirmed) return;
    try {
      await usersApi.remove(user.id);
      notifySuccess(`Pengguna ${user.name} berhasil dinonaktifkan`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Role filter
      if (filterRole !== 'ALL' && u.role !== filterRole) {
        return false;
      }
      // Cluster filter
      if (filterCluster !== 'ALL') {
        if (filterCluster === 'NO_CLUSTER' && u.clusterId) return false;
        if (filterCluster !== 'NO_CLUSTER' && u.clusterId !== filterCluster) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchRole = u.role?.toLowerCase().includes(q);
        const matchCluster = u.clusterName?.toLowerCase().includes(q);
        return matchName || matchEmail || matchRole || matchCluster;
      }
      return true;
    });
  }, [users, filterRole, filterCluster, searchQuery]);
  return <AdminUserDirectoryView activeSubTab={activeSubTab} clusters={clusters} fetchUsers={fetchUsers} filterCluster={filterCluster} filterRole={filterRole} filteredUsers={filteredUsers} handleDeleteUser={handleDeleteUser} handleEditPermissions={handleEditPermissions} handleEditUser={handleEditUser} isPermissionsModalOpen={isPermissionsModalOpen} isUserModalOpen={isUserModalOpen} loading={loading} roles={roles} searchQuery={searchQuery} selectedUser={selectedUser} setActiveSubTab={setActiveSubTab} setActiveTab={setActiveTab} setFilterCluster={setFilterCluster} setFilterRole={setFilterRole} setIsPermissionsModalOpen={setIsPermissionsModalOpen} setIsUserModalOpen={setIsUserModalOpen} setSearchQuery={setSearchQuery} setSelectedUser={setSelectedUser} users={users} />;
};
