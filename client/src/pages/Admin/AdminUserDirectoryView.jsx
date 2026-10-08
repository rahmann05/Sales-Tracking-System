import { DataTable } from '../../shared/components/common/DataTable';
/**
 * AdminUserListPage.jsx
 * Single Responsibility: Orchestrate User Management and Peran & template Hub.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */
/**
 * AdminUserListPage.jsx
 * Single Responsibility: Orchestrate User Management and Peran & template Hub.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React from 'react';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { LuUsers, LuUserPlus, LuShieldCheck, LuShield, LuTrash2, LuSearch, LuCheck } from "react-icons/lu";
import { FiEdit } from 'react-icons/fi';
import { AdminUserModal } from './components/AdminUserModal';
import { AdminPermissionsModal } from './components/AdminPermissionsModal';
import { RoleTemplateManager } from './components/RoleTemplateManager';
export function AdminUserDirectoryView({
  activeSubTab,
  clusters,
  fetchUsers,
  filterCluster,
  filterRole,
  filteredUsers,
  handleDeleteUser,
  handleEditPermissions,
  handleEditUser,
  isPermissionsModalOpen,
  isUserModalOpen,
  loading,
  roles,
  searchQuery,
  selectedUser,
  setActiveSubTab,
  setFilterCluster,
  setFilterRole,
  setIsPermissionsModalOpen,
  setIsUserModalOpen,
  setSearchQuery,
  setSelectedUser,
  users
}) {
  return <div className="workspace-page admin-users space-y-6">
      <PageHeader badge={<span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuUsers className="text-sm" /> Manajemen Pengguna & Hak Akses
          </span>} title="Pengguna & hak akses" subtitle="Kelola akun tim, peran, dan izin akses setiap pengguna." />

      {/* Action Bar & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-border-glass">
        <div className="flex items-center gap-3">
          {/* Segmented Tab Controls */}
          <div className="flex items-center p-1 bg-surface-container/60 rounded-xl border border-border-glass" role="group" aria-label="Tampilan pengguna">
            <button type="button" aria-pressed={activeSubTab === 'users'} onClick={() => setActiveSubTab('users')} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'users' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <LuUsers className="text-sm" />
              <span>Daftar pengguna ({users.length})</span>
            </button>
            <button type="button" aria-pressed={activeSubTab === 'roles'} onClick={() => setActiveSubTab('roles')} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'roles' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <LuShield className="text-sm" />
              <span>Peran & template</span>
            </button>
          </div>
        </div>

        {activeSubTab === 'users' && <button type="button" onClick={() => {
        setSelectedUser(null);
        setIsUserModalOpen(true);
      }} className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs bg-primary text-white hover:bg-neutral-800">
            <LuUserPlus className="text-sm" />
            <span>Tambah Pengguna</span>
          </button>}
      </div>

      {/* Tab Content: Users Management */}
      {activeSubTab === 'users' && <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-surface border border-border-glass shadow-xs">
            <div className="md:col-span-6 relative">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
              <input type="search" aria-label="Cari pengguna" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari nama pengguna, email, role, atau kluster..." className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-container/60 border border-border-glass text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>

            <div className="md:col-span-3">
              <select aria-label="Filter peran" value={filterRole} onChange={e => setFilterRole(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container/60 border border-border-glass text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40">
                <option value="ALL">Semua peran ({users.length})</option>
                {roles.map(r => <option key={r.code} value={r.code}>
                    {r.name} ({r.code})
                  </option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <select aria-label="Filter kluster" value={filterCluster} onChange={e => setFilterCluster(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container/60 border border-border-glass text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40">
                <option value="ALL">Semua kluster</option>
                <option value="NO_CLUSTER">Tanpa Kluster (Pusat)</option>
                {(clusters || []).map(c => <option key={c.id} value={c.id}>
                    {c.name} ({c.region})
                  </option>)}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-surface border border-border-glass rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <DataTable className="mobile-card-table admin-users-table w-full text-left text-sm text-on-surface" aria-label="Daftar pengguna">
                <thead className="bg-surface-container/50 text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                  <tr>
                    <th className="border-b border-border-glass">Nama / Email</th>
                    <th className="border-b border-border-glass">Peran</th>
                    <th className="border-b border-border-glass">Kluster Wilayah</th>
                    <th className="border-b border-border-glass text-center">Hak Akses Fitur</th>
                    <th className="border-b border-border-glass text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  {loading ? <tr>
                      <td colSpan="5" className="text-center text-on-surface-variant">
                        Memuat data pengguna...
                      </td>
                    </tr> : filteredUsers.length === 0 ? <tr>
                      <td colSpan="5" className="text-center text-on-surface-variant">
                        Tidak ada data pengguna yang sesuai filter.
                      </td>
                    </tr> : filteredUsers.map(u => {
                const activePermCount = Object.values(u.permissions || {}).filter(Boolean).length;
                return <tr key={u.id} className="hover:bg-surface-variant/30 transition-colors">
                          <td data-label="Pengguna" className="admin-user-identity">
                            <div className="font-bold text-on-surface">{u.name}</div>
                            {u.staffCode && <div className="font-mono text-xs">{u.staffCode}</div>}
                            <div className="text-xs text-on-surface-variant">{u.email}</div>
                          </td>
                          <td data-label="Peran">
                            <span className="px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-bold text-neutral-800">
                              {u.roleLabel || u.role}
                            </span>
                          </td>
                          <td data-label="Wilayah">
                            {u.clusterName ? <div>
                                <span className="font-bold text-xs text-on-surface">{u.clusterName}</span>
                                {u.region && <div className="text-[11px] text-on-surface-variant">{u.region}</div>}
                              </div> : <span className="text-xs text-on-surface-variant/70 italic">Pusat / seluruh wilayah</span>}
                          </td>
                          <td data-label="Izin" className="text-center">
                            {u.role === 'ADMIN' ? <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200 inline-flex items-center gap-1">
                                <LuCheck className="text-xs" />
                                Akses penuh
                              </span> : <span className="text-[10px] text-primary bg-primary/10 px-2.5 py-1 rounded-full font-bold border border-primary/20">
                                {activePermCount} Fitur Aktif
                              </span>}
                          </td>
                          <td className="mobile-full-width text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.role !== 'ADMIN' && <button type="button" onClick={() => handleEditPermissions(u)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer" title="Atur Hak Akses Fitur">
                                  <LuShieldCheck className="text-sm" />
                                </button>}
                              <button type="button" onClick={() => handleEditUser(u)} className="p-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-variant transition-colors border border-border-glass cursor-pointer" title="Edit Akun & Password">
                                <FiEdit className="text-sm" />
                              </button>
                              <button type="button" onClick={() => handleDeleteUser(u)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200 cursor-pointer" title="Hapus Pengguna">
                                <LuTrash2 className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>;
              })}
                </tbody>
              </DataTable>
            </div>
          </div>
        </div>}

      {/* Tab Content: Roles & Permissions Templates */}
      {activeSubTab === 'roles' && <RoleTemplateManager />}

      {/* Modal: Create/Edit User */}
      {isUserModalOpen && <AdminUserModal user={selectedUser} clusters={clusters || []} onClose={() => setIsUserModalOpen(false)} onSuccess={fetchUsers} />}

      {/* Modal: Edit Permissions */}
      {isPermissionsModalOpen && <AdminPermissionsModal user={selectedUser} onClose={() => setIsPermissionsModalOpen(false)} onSuccess={fetchUsers} />}
    </div>;
}
