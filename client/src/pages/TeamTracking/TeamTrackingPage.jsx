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

  const isAdmin = user?.role === 'ADMIN';
  const isSupervisor = user?.role === 'SUPERVISOR';
  const isSales = user?.role === 'SALES';

  // Filter Data according to Role Scope
  const filteredSupervisorTeams = isAdmin
    ? supervisorTeams
    : supervisorTeams.filter((t) => t.spvName === user?.name || t.spvName === 'Ahmad Subagja');

  const filteredSalesList = isAdmin
    ? salesList
    : salesList.filter((s) => s.spvName === user?.name || s.spvName === 'Ahmad Subagja' || isSales);

  const filteredRjpTeams = isAdmin
    ? rjpTeams
    : rjpTeams.filter((r) => r.spvName === user?.name || r.spvName === 'Ahmad Subagja' || isSales);

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
      roleTarget: ['SUPERVISOR', 'ADMIN'],
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
      roleTarget: ['SUPERVISOR', 'ADMIN'],
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
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });

    usersApi.remove(userId).catch((err) => {
      console.warn('[API] Remove user error:', err.message);
    });
  };

  return (
    <div className="page-container space-y-6 pb-24">
      {/* Header Bar */}
      <TeamTrackingHeader 
        user={user} 
        onCreateRjpTeam={handleOpenCreateRjpModal}
        onCreateUser={isAdmin ? () => setIsCreateUserModalOpen(true) : null}
      />

      {/* Tabs Navigation (Not shown for Sales, only for SPV & Ops) */}
      {!isSales && (
        <div className="bg-surface-container-low p-1.5 rounded-2xl border border-border-glass grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('spv-teams')}
            className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              activeTab === 'spv-teams'
                ? 'bg-primary text-on-primary border-primary shadow-xs'
                : 'bg-surface border-border-glass text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <LuShieldCheck className="text-base shrink-0" />
            <span className="truncate">{isSupervisor ? 'Tim Supervisor Saya' : `Daftar Tim Supervisor (${filteredSupervisorTeams.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sales-list')}
            className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              activeTab === 'sales-list'
                ? 'bg-primary text-on-primary border-primary shadow-xs'
                : 'bg-surface border-border-glass text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <LuUserCheck className="text-base shrink-0" />
            <span className="truncate">{isSupervisor ? `Sales Bawahan (${filteredSalesList.length})` : `Daftar Sales (${filteredSalesList.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live-gps')}
            className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              activeTab === 'live-gps'
                ? 'bg-primary text-on-primary border-primary shadow-xs'
                : 'bg-surface border-border-glass text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'live-gps' ? 'bg-white' : 'bg-emerald-500'} animate-ping`}></span>
            <LuNavigation className="text-base shrink-0" />
            <span className="truncate">Live GPS Tracking</span>
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
          canManage={isAdmin || isSupervisor}
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
