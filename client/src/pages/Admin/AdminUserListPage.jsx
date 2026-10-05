/**
 * AdminUserListPage.jsx
 * Single Responsibility: Orchestrate User Management and Master Role & Template Hub.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { usersApi, rolesApi } from '../../services/api';
import {
  LuUsers,
  LuUserPlus,
  LuArrowLeft,
  LuShieldCheck,
  LuShield,
  LuTrash2,
  LuSearch,
  LuFilter,
  LuKey,
  LuCheck,
} from 'react-icons/lu';
import { FiEdit } from 'react-icons/fi';
import { AdminUserModal } from './components/AdminUserModal';
import { AdminPermissionsModal } from './components/AdminPermissionsModal';
import { RoleTemplateManager } from './components/RoleTemplateManager';
import { notifySuccess, notifyError } from '../../services/notificationService';

export const AdminUserListPage = ({ onGoBack }) => {
  const { setActiveTab, clusters } = useApp();
  
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
      const [usersRes, rolesRes] = await Promise.all([
        usersApi.getAll(),
        rolesApi.getAll().catch(() => ({ data: [] })),
      ]);
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

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleEditPermissions = (user) => {
    setSelectedUser(user);
    setIsPermissionsModalOpen(true);
  };

  const handleDeleteUser = async (user) => {
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
    return users.filter((u) => {
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuUsers className="text-sm" /> Manajemen Pengguna & Hak Akses
          </span>
        }
        title="Pusat Otorisasi & Akun Pengguna"
        subtitle="Kelola akun, peran dinamis, template izin akses default, dan kustomisasi hak akses per pengguna."
      />

      {/* Action Bar & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-border-glass">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab(TAB_IDS.ROLE_WORKSPACE)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer"
          >
            <LuArrowLeft className="text-sm" />
            <span>Kembali</span>
          </button>

          {/* Segmented Tab Controls */}
          <div className="flex items-center p-1 bg-surface-container/60 rounded-xl border border-border-glass">
            <button
              type="button"
              onClick={() => setActiveSubTab('users')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'users'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <LuUsers className="text-sm" />
              <span>Daftar Akun ({users.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('roles')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'roles'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <LuShield className="text-sm" />
              <span>Master Role & Template</span>
            </button>
          </div>
        </div>

        {activeSubTab === 'users' && (
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setIsUserModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs bg-primary text-white hover:bg-neutral-800"
          >
            <LuUserPlus className="text-sm" />
            <span>Tambah Pengguna</span>
          </button>
        )}
      </div>

      {/* Tab Content: Users Management */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-surface border border-border-glass shadow-xs">
            <div className="md:col-span-6 relative">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pengguna, email, role, atau kluster..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-container/60 border border-border-glass text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container/60 border border-border-glass text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="ALL">-- Semua Role ({users.length}) --</option>
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={filterCluster}
                onChange={(e) => setFilterCluster(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container/60 border border-border-glass text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="ALL">-- Semua Kluster --</option>
                <option value="NO_CLUSTER">Tanpa Kluster (Pusat)</option>
                {(clusters || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.region})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-surface border border-border-glass rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-on-surface">
                <thead className="bg-surface-container/50 text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 border-b border-border-glass">Nama / Email</th>
                    <th className="px-5 py-4 border-b border-border-glass">Peran (Role)</th>
                    <th className="px-5 py-4 border-b border-border-glass">Kluster Wilayah</th>
                    <th className="px-5 py-4 border-b border-border-glass text-center">Hak Akses Fitur</th>
                    <th className="px-5 py-4 border-b border-border-glass text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-on-surface-variant">
                        Memuat data pengguna...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-on-surface-variant">
                        Tidak ada data pengguna yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const activePermCount = Object.values(u.permissions || {}).filter(Boolean).length;

                      return (
                        <tr key={u.id} className="hover:bg-surface-variant/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-on-surface">{u.name}</div>
                            <div className="text-xs text-on-surface-variant">{u.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-bold text-neutral-800">
                              {u.roleLabel || u.role}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {u.clusterName ? (
                              <div>
                                <span className="font-bold text-xs text-on-surface">{u.clusterName}</span>
                                {u.region && (
                                  <div className="text-[11px] text-on-surface-variant">{u.region}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-on-surface-variant/70 italic">Pusat / Seluruh Wilayah</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {u.role === 'ADMIN' ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200 inline-flex items-center gap-1">
                                <LuCheck className="text-xs" />
                                Full Access (Admin)
                              </span>
                            ) : (
                              <span className="text-[10px] text-primary bg-primary/10 px-2.5 py-1 rounded-full font-bold border border-primary/20">
                                {activePermCount} Fitur Aktif
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.role !== 'ADMIN' && (
                                <button
                                  type="button"
                                  onClick={() => handleEditPermissions(u)}
                                  className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer"
                                  title="Atur Hak Akses Fitur"
                                >
                                  <LuShieldCheck className="text-sm" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEditUser(u)}
                                className="p-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-variant transition-colors border border-border-glass cursor-pointer"
                                title="Edit Akun & Password"
                              >
                                <FiEdit className="text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200 cursor-pointer"
                                title="Hapus Pengguna"
                              >
                                <LuTrash2 className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Roles & Permissions Templates */}
      {activeSubTab === 'roles' && <RoleTemplateManager />}

      {/* Modal: Create/Edit User */}
      {isUserModalOpen && (
        <AdminUserModal
          user={selectedUser}
          clusters={clusters || []}
          onClose={() => setIsUserModalOpen(false)}
          onSuccess={fetchUsers}
        />
      )}

      {/* Modal: Edit Permissions */}
      {isPermissionsModalOpen && (
        <AdminPermissionsModal
          user={selectedUser}
          onClose={() => setIsPermissionsModalOpen(false)}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};
