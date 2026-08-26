import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LuUsers, LuPlus, LuNavigation, LuShieldCheck, LuUserCheck, LuUserPlus } from 'react-icons/lu';
import { SpvTeamListTab } from './components/SpvTeamListTab';
import { SalesListTab } from './components/SalesListTab';
import { RjpTeamListTab } from './components/RjpTeamListTab';
import { LiveSalesGpsTrackingTab } from './components/LiveSalesGpsTrackingTab';
import { CreateRjpTeamModal } from './components/CreateRjpTeamModal';
import { CreateUserModal } from './components/CreateUserModal';
import { EditUserModal } from './components/EditUserModal';
import { TeamTrackingHeader } from './components/TeamTrackingHeader';
import { usersApi } from '../../services/api';
import '../../styles/pages/TeamTracking.css';

export const TeamTrackingPage = () => {
  const { 
    user, 
    supervisorTeams = [], 
    setSupervisorTeams,
    salesList = [], 
    setSalesList,
    rjpTeams = [],
    handleCreateRjpTeam,
    addNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState('spv-teams'); // 'spv-teams', 'sales-list', 'rjp-teams'
  const [isRjpModalOpen, setIsRjpModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const isOpsOrAdmin = ['OPERATIONAL_MANAGER', 'ADMIN'].includes(user?.role);
  const isSupervisor = user?.role === 'SUPERVISOR';
  const isSales = user?.role === 'SALES';

  // Filter Data according to Role Scope
  const filteredSupervisorTeams = isOpsOrAdmin
    ? supervisorTeams
    : supervisorTeams.filter((t) => t.spvName === user.name || t.spvName === 'Ahmad Subagja');

  const filteredSalesList = isOpsOrAdmin
    ? salesList
    : salesList.filter((s) => s.spvName === user.name || s.spvName === 'Ahmad Subagja' || isSales);

  const filteredRjpTeams = isOpsOrAdmin
    ? rjpTeams
    : rjpTeams.filter((r) => r.spvName === user.name || r.spvName === 'Ahmad Subagja' || isSales);

  const handleOpenCreateRjpModal = () => {
    setIsRjpModalOpen(true);
  };

  const handleSubmitRjpTeam = (payload) => {
    handleCreateRjpTeam(payload);
    setIsRjpModalOpen(false);
  };

  const handleCreateUser = async (newUserData) => {
    const newSalesEntry = {
      id: newUserData.id || `sales-${Date.now()}`,
      name: newUserData.name,
      email: newUserData.email,
      phone: newUserData.phone || '0812-3456-7890',
      spvName: newUserData.spvName || 'Ahmad Subagja',
      spvTeamName: `Tim SPV ${newUserData.spvName || 'Ahmad Subagja'}`,
      rjpTeamName: `RJP ${newUserData.cluster || 'Cimahi'}`,
      status: 'Active',
      location: newUserData.cluster || 'Bandung Raya',
    };

    setSalesList((prev) => [newSalesEntry, ...prev]);

    addNotification({
      title: 'Personel Baru Ditambahkan',
      message: `${newUserData.name} (${newUserData.role}) telah ditambahkan ke sistem oleh ${user.name}.`,
      roleTarget: ['OPERATIONAL_MANAGER', 'SUPERVISOR'],
    });

    // Call API in background
    usersApi.create(newUserData).catch((err) => {
      console.warn('[API] Create user error:', err.message);
    });
  };

  const handleUpdateUser = async (updatedData) => {
    setSalesList((prev) =>
      prev.map((s) =>
        s.id === updatedData.id
          ? {
              ...s,
              name: updatedData.name,
              email: updatedData.email,
              cluster: updatedData.cluster,
              spvName: updatedData.spvName,
              spvTeamName: `Tim SPV ${updatedData.spvName}`,
            }
          : s
      )
    );

    addNotification({
      title: 'Data Personel Diperbarui',
      message: `Data ${updatedData.name} telah diperbarui.`,
      roleTarget: ['OPERATIONAL_MANAGER', 'SUPERVISOR'],
    });

    usersApi.update(updatedData.id, updatedData).catch((err) => {
      console.warn('[API] Update user error:', err.message);
    });
  };

  const handleDeleteUser = async (userId) => {
    setSalesList((prev) => prev.filter((s) => s.id !== userId));

    addNotification({
      title: 'Personel Dinonaktifkan',
      message: `Akun personel telah dinonaktifkan dari sistem.`,
      roleTarget: ['OPERATIONAL_MANAGER', 'SUPERVISOR'],
    });

    usersApi.remove(userId).catch((err) => {
      console.warn('[API] Remove user error:', err.message);
    });
  };

  return (
    <div className="page-container space-y-6 pb-24">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TeamTrackingHeader user={user} onCreateRjpTeam={handleOpenCreateRjpModal} />
        {isOpsOrAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateUserModalOpen(true)}
            className="px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition-all cursor-pointer w-fit shrink-0"
          >
            <LuUserPlus className="text-sm" />
            <span>+ Tambah Personel</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation (Not shown for Sales, only for SPV & Ops) */}
      {!isSales && (
        <div className="flex items-center gap-2 border-b border-border-glass pb-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('spv-teams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'spv-teams'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
            }`}
          >
            <LuShieldCheck className="text-sm" />
            <span>{isSupervisor ? 'Tim Supervisor Saya' : `Daftar Tim Supervisor (${filteredSupervisorTeams.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sales-list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'sales-list'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
            }`}
          >
            <LuUserCheck className="text-sm" />
            <span>{isSupervisor ? `Sales Bawahan Saya (${filteredSalesList.length})` : `Daftar Sales (${filteredSalesList.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live-gps')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'live-gps'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-surface border border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>🛰️ Live GPS Tracking Sales</span>
          </button>
        </div>
      )}

      {/* TAB 0: LIVE GPS TRACKING SALES */}
      {activeTab === 'live-gps' && <LiveSalesGpsTrackingTab />}

      {/* TAB 1: DAFTAR TIM SUPERVISOR */}
      {activeTab === 'spv-teams' && <SpvTeamListTab filteredSupervisorTeams={filteredSupervisorTeams} />}

      {/* TAB 2: DAFTAR SALES */}
      {activeTab === 'sales-list' && (
        <SalesListTab 
          filteredSalesList={filteredSalesList} 
          isSales={isSales} 
          canManage={isOpsOrAdmin}
          onEditUser={(u) => setEditingUser(u)}
        />
      )}

      {/* TAB 3: DAFTAR TIM RJP / KUNJUNGAN */}
      {activeTab === 'rjp-teams' && <RjpTeamListTab filteredRjpTeams={filteredRjpTeams} />}

      {/* MODAL BUAT TIM RJP */}
      {isRjpModalOpen && (
        <CreateRjpTeamModal 
          user={user}
          isSupervisor={isSupervisor}
          onClose={() => setIsRjpModalOpen(false)}
          onSubmit={handleSubmitRjpTeam}
        />
      )}

      {/* MODAL TAMBAH USER */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      {/* MODAL EDIT USER */}
      <EditUserModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onUpdate={handleUpdateUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
};
