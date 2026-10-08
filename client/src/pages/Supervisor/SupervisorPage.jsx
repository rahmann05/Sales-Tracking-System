import { AdminApprovalPage } from '../Admin/AdminApprovalPage';
import { ManualSalesReview } from '../../shared/components/common/ManualSalesReview';
import { SupervisorFieldView } from './components/SupervisorFieldView';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../shared/hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { SupervisorTabBar } from './components/SupervisorTabBar';
import { SupervisorActionCenterTab } from './components/SupervisorActionCenterTab';
import { SupervisorDailyRecapTab } from './components/SupervisorDailyRecapTab';
import { IncidentHandleModal } from './components/IncidentHandleModal';
import { LuShieldCheck, LuCalendar, LuRefreshCw } from "react-icons/lu";
import { dailyCallsApi, absensiApi } from '../../services/api';
import { wibDateKey } from '../../../../shared/visit-metrics.mjs';
import {AttentionPanel} from '../../shared/components/common/AttentionPanel';

/**
 * SupervisorPage Component (Orchestrator)
 * Single Responsibility: Unified Command Center for Supervisor.
 * Mengorganisasikan 3 pilar operasional:
 * 1. Kunjungan Lapangan & Live PJP Route
 * 2. Pusat Approval & Kendala (Action Center: Manual Sales, Toko Tutup, Buka Kunci, Luar RJP)
 * 3. Rekap Harian & Kinerja Tim (Consolidated Daily Recap & KPI Breakdown)
 */
export const SupervisorPage = () => {
  const {
    user,
    salesStops = [],
    salesList = [],
    incidents = [],
    offPjpAttendances = [],
    orders = [],
    handleSupervisorValidateOffPJP,
    handleSupervisorSkipOutlet,
    handleSupervisorDirectReroute,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  } = useApp();

  const { modalType, payload: selectedIncident, openModal, closeModal } = useModal();
  const [activeTab, setActiveTab] = useState('action_center');

  // Date Filter State
  const [selectedDate, setSelectedDate] = useState(() => wibDateKey());
  const [dailyReport, setDailyReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError,setReportError]=useState('');
  const reportRequest=useRef(0);
  const [manualPendingCount, setManualPendingCount] = useState(0);

  // 1. Fetch real pending manual sales queue (PJP + OFF_PJP)
  const loadManualPending = useCallback(async () => {
    try {
      const [pjpRes, offPjpRes] = await Promise.all([
        absensiApi.getManualSales({ kind: 'PJP', status: 'PENDING', page: 1, limit: 1 }).catch(() => null),
        absensiApi.getManualSales({ kind: 'OFF_PJP', status: 'PENDING', page: 1, limit: 1 }).catch(() => null),
      ]);
      const total = (pjpRes?.data?.total || 0) + (offPjpRes?.data?.total || 0);
      setManualPendingCount(total);
    } catch (err) {
      console.warn('[SupervisorPage] Error loading manual sales count:', err);
    }
  }, []);

  // 2. Fetch real Daily Call Report for selectedDate
  const loadDailyReport = useCallback(async (date) => {
    const request=++reportRequest.current;
    setLoadingReport(true);
    setDailyReport(null);setReportError('');
    try {
      const res = await dailyCallsApi.getReport({ date });
      if (request===reportRequest.current&&res?.data) {
        setDailyReport(res.data);
      }
    } catch (err) {
      if(request===reportRequest.current)setReportError(err.message);
    } finally {
      if(request===reportRequest.current)setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    loadManualPending();
    loadDailyReport(selectedDate);

    const handler = () => {
      loadManualPending();
      loadDailyReport(selectedDate);
    };

    window.addEventListener('operational-data-changed', handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener('operational-data-changed', handler);
      window.removeEventListener('focus', handler);
    };
  }, [loadManualPending, loadDailyReport, selectedDate]);

  // Operational Queues calculation
  const closedShopIncidents = incidents.filter((i) => i.type === 'CLOSED_SHOP');
  const pendingClosedIncidents = closedShopIncidents.filter((i) => i.status === 'PENDING_SPV').length;
  const offPjpRequests = incidents.filter((i) => i.type === 'OFF_PJP_REQUEST');
  const unlockRequests = incidents.filter((i) => i.type === 'UNLOCK_REQUEST');
  const pendingUnlockCount = unlockRequests.filter((r) => r.status === 'PENDING' || !r.status).length;
  const pendingOffPjpCount = offPjpAttendances.filter((a) => a.status === 'PENDING' || a.validationStatus === 'MENUNGGU').length;

  const pendingOrders = orders.filter((o) => ['PENDING', 'PENDING_APPROVAL'].includes(o.status)).length;
  const totalPendingActions =
    manualPendingCount +
    pendingOrders +
    pendingClosedIncidents +
    pendingUnlockCount +
    pendingOffPjpCount +
    offPjpRequests.filter((r) => ['PENDING', 'PENDING_SPV'].includes(r.status)).length;

  // Real visits count from database report for selectedDate
  const completedStopsCount = dailyReport?.summary?.totalActualCalls ?? '—';
  const totalPlanCalls = dailyReport?.summary?.totalPlanCalls ?? 0;

  const handleSkipConfirm = async (incidentId) => {
    if (await handleSupervisorSkipOutlet(incidentId) === false) return false;
    closeModal();
    notifySuccess('Outlet berhasil di-SKIP! Sales dapat melanjutkan ke outlet berikutnya.');
  };

  const handleDirectRerouteConfirm = async (payload) => {
    const result = await handleSupervisorDirectReroute(payload);
    if (result === false) return false;
    closeModal();
    notifySuccess(result?.pending ? 'Usulan reroute menunggu persetujuan admin.' : 'Toko pengganti ditambahkan ke PJP sales.');
  };

  const handleApproveUnlock = async (requestId, stopId, userRole) => {
    if (await handleApproveUnlockRequest(requestId, stopId, userRole) === false) return false;
    notifySuccess('Permintaan Unlock disetujui! Pengecualian presensi berlaku untuk pemohon sesuai masa berlaku.');
  };

  const handleRejectUnlock = async (requestId) => {
    if (await handleRejectUnlockRequest(requestId) === false) return false;
    notifySuccess('Permintaan Unlock ditolak.');
  };

  return (
    <div className="workspace-page space-y-6">
      {/* 1. Standardized Universal Page Header with Date Filter and Real Stats */}
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuShieldCheck className="text-sm" /> SUPERVISOR
          </span>
        }
        title="Operasional tim sales"
        subtitle="Siapkan tim dan PJP, tangani permintaan, dampingi kunjungan, lalu evaluasi hasil harian."
        stats={[
          { label: 'Salesman', value: `${salesList.length} Personel`, color: 'neutral' },
          { label:'Kunjungan penagihan',value:dailyReport?.summary?.totalCollectionCalls??'—',color:'neutral' },
          { label:'Janji pembayaran (laporan sales)',value:dailyReport?.summary?.totalPaymentPromises??'—',color:'neutral' },
          {
            label: 'Kendala Butuh Aksi',
            value: `${totalPendingActions} Antrean`,
            color: totalPendingActions > 0 ? 'rose' : 'emerald',
          },
          {
            label: 'Kunjungan Aktual (IN/OUT)',
            value: totalPlanCalls > 0 ? `${completedStopsCount} / ${totalPlanCalls} Toko` : `${completedStopsCount} Toko`,
            color: completedStopsCount > 0 ? 'emerald' : 'neutral',
          },
        ]}
        actions={
          <div className="flex items-center gap-2 bg-surface-container/60 border border-border-glass rounded-xl px-3 py-1.5 shadow-xs">
            <LuCalendar className="text-primary text-sm shrink-0 pointer-events-none" />
            <label htmlFor="spv-date-picker" className="text-xs font-bold text-on-surface-variant whitespace-nowrap">
              Filter Tanggal:
            </label>
            <input
              id="spv-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-surface rounded-lg px-2.5 py-1 text-xs font-bold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none cursor-pointer"
            />
            {selectedDate !== wibDateKey() && (
              <button
                type="button"
                onClick={() => setSelectedDate(wibDateKey())}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer whitespace-nowrap"
                title="Kembali ke Hari Ini"
              >
                Hari Ini
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                loadManualPending();
                loadDailyReport(selectedDate);
              }}
              disabled={loadingReport}
              className="p-1 rounded-lg hover:bg-surface text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer disabled:opacity-50"
              title="Muat ulang data"
            >
              <LuRefreshCw className={`text-xs ${loadingReport ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* 2. 3-Pillar Workspace Tab Bar */}
      <SupervisorTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingActions={totalPendingActions}
      />
      {reportError&&<p role="alert" className="text-red-600">Laporan tanggal {selectedDate} gagal dimuat: {reportError}</p>}

      {/* 3. Tab Contents */}
      {activeTab === 'field' && <SupervisorFieldView selectedDate={selectedDate} />}

      {activeTab === 'action_center' && (
        <>
          <AdminApprovalPage embedded />
          <ManualSalesReview />
          <AttentionPanel/>
          <SupervisorActionCenterTab
            closedShopIncidents={closedShopIncidents}
            unlockRequests={unlockRequests}
            offPjpAttendances={offPjpAttendances}
            offPjpRequests={offPjpRequests}
            onHandleIncident={(inc) => openModal('INCIDENT_HANDLE', inc)}
            onApproveUnlock={handleApproveUnlock}
            onRejectUnlock={handleRejectUnlock}
            onValidateOffPjp={handleSupervisorValidateOffPJP}
          />
        </>
      )}

      {activeTab === 'daily_recap' && (
        <SupervisorDailyRecapTab
          salesStops={dailyReport?.rows || []}
          salesList={salesList}
          incidents={incidents}
          offPjpAttendances={offPjpAttendances}
          orders={orders}
          dailyReport={dailyReport}
          selectedDate={selectedDate}
          user={user}
        />
      )}

      {/* 4. Modal for Skip / Direct Reroute Decision */}
      {modalType === 'INCIDENT_HANDLE' && selectedIncident && (
        <IncidentHandleModal
          isOpen={true}
          incident={selectedIncident}
          onClose={closeModal}
          onSkip={handleSkipConfirm}
          onDirectReroute={handleDirectRerouteConfirm}
        />
      )}
    </div>
  );
};
