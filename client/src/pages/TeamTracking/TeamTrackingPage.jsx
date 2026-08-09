import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LuUsers, LuPlus, LuNavigation, LuShieldCheck, LuUserCheck, LuCalendar, LuBriefcase } from 'react-icons/lu';
import { FiXCircle, FiCheckCircle, FiUser } from 'react-icons/fi';
import { Avatar } from '../../components/common/Avatar';
import { SpvTeamListTab } from './components/SpvTeamListTab';
import { SalesListTab } from './components/SalesListTab';
import { RjpTeamListTab } from './components/RjpTeamListTab';
import { CreateRjpTeamModal } from './components/CreateRjpTeamModal';
import { TeamTrackingHeader } from './components/TeamTrackingHeader';
import '../../styles/pages/TeamTracking.css';

export const TeamTrackingPage = () => {
  const { 
    user, 
    supervisorTeams = [], 
    salesList = [], 
    rjpTeams = [],
    handleCreateRjpTeam
  } = useApp();

  const [activeTab, setActiveTab] = useState('spv-teams'); // 'spv-teams', 'sales-list', 'rjp-teams'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isOpsOrAdmin = ['MANAJER_OPERASIONAL', 'ADMIN'].includes(user?.role);
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

  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
  };

  const handleSubmitRjpTeam = (payload) => {
    handleCreateRjpTeam(payload);
    setIsModalOpen(false);
    alert(`Tim RJP "${payload.name}" berhasil dibuat! Rute kunjungan akan terdistribusi ke anggota sales.`);
  };

  return (
    <div className="page-container">
      {/* Header Bar Strictly Custom per Role */}
      <TeamTrackingHeader user={user} onCreateRjpTeam={handleOpenCreateModal} />

      {/* Tabs Navigation (Not shown for Sales, only for SPV & Ops) */}
      {!isSales && (
        <div className="flex items-center gap-2 border-b border-border-glass pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('spv-teams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'spv-teams'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
            }`}
          >
            <LuShieldCheck className="text-sm" />
            <span>{isSupervisor ? 'Tim Supervisor Saya' : `Daftar Tim Supervisor (${filteredSupervisorTeams.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('sales-list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sales-list'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
            }`}
          >
            <LuUserCheck className="text-sm" />
            <span>{isSupervisor ? `Sales Bawahan Saya (${filteredSalesList.length})` : `Daftar Sales (${filteredSalesList.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('rjp-teams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rjp-teams'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
            }`}
          >
            <LuNavigation className="text-sm" />
            <span>{isSupervisor ? `Tim RJP Tim Saya (${filteredRjpTeams.length})` : `Daftar Tim RJP (${filteredRjpTeams.length})`}</span>
          </button>
        </div>
      )}

      {/* TAB 1: DAFTAR TIM SUPERVISOR */}
      {activeTab === 'spv-teams' && <SpvTeamListTab filteredSupervisorTeams={filteredSupervisorTeams} />}

      {/* TAB 2: DAFTAR SALES */}
      {activeTab === 'sales-list' && <SalesListTab filteredSalesList={filteredSalesList} isSales={isSales} />}

      {/* TAB 3: DAFTAR TIM RJP / KUNJUNGAN */}
      {activeTab === 'rjp-teams' && <RjpTeamListTab filteredRjpTeams={filteredRjpTeams} />}

      {/* MODAL BUAT TIM RJP / KUNJUNGAN BARU */}
      {isModalOpen && (
        <CreateRjpTeamModal 
          user={user}
          isSupervisor={isSupervisor}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitRjpTeam}
        />
      )}
    </div>
  );
};
