import React, { useState } from 'react';
import { SectionHeader } from '../../../shared/components/common/SectionHeader';
import { EmptyState } from '../../../shared/components/common/EmptyState';
import { IncidentCard } from './IncidentCard';
import { UnlockRequestCard } from '../../Admin/components/UnlockRequestCard';
import { OffPjpAttendanceCard } from './OffPjpAttendanceCard';
import { ACTION_CENTER_FILTERS } from '../../../constants/supervisor';
import { LuCircleCheck, LuClock, LuKey, LuStore } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';

/**
 * SupervisorActionCenterTab Component
 * Single Responsibility: Unified Operational Action Center for Supervisor.
 * Symmetric, cohesive Apple-Editorial layout for handling operational bottlenecks:
 * Toko Tutup (Reroute/Skip), Buka Kunci Presensi (Unlock), dan Absen Luar RJP.
 */
export const SupervisorActionCenterTab = ({
  closedShopIncidents = [],
  unlockRequests = [],
  offPjpAttendances = [],
  offPjpRequests = [],
  onHandleIncident,
  onApproveUnlock,
  onRejectUnlock,
  onValidateOffPjp,
}) => {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const pendingClosedShop = closedShopIncidents.filter((i) => i.status === 'PENDING_SPV');
  const pendingUnlock = unlockRequests.filter((r) => r.status === 'PENDING' || !r.status);
  const pendingOffPjpAtt = offPjpAttendances.filter((a) => a.status === 'PENDING' || a.status === 'WAITING_SPV');
  const pendingOffPjpReq = offPjpRequests.filter((r) => r.status === 'PENDING_SPV' || r.status === 'PENDING');

  const counts = {
    ALL: pendingClosedShop.length + pendingUnlock.length + pendingOffPjpAtt.length + pendingOffPjpReq.length,
    CLOSED_SHOP: pendingClosedShop.length,
    UNLOCK: pendingUnlock.length,
    OFF_PJP: pendingOffPjpAtt.length + pendingOffPjpReq.length,
  };

  const showClosedShop = activeFilter === 'ALL' || activeFilter === 'CLOSED_SHOP';
  const showUnlock = activeFilter === 'ALL' || activeFilter === 'UNLOCK';
  const showOffPjp = activeFilter === 'ALL' || activeFilter === 'OFF_PJP';

  const hasAnyItems = counts.ALL > 0;

  return (
    <div className="space-y-6">
      {/* 1. Symmetrical KPI Cards for Pending Operational Blockers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 w-full">
        <div className="bg-surface border border-border-glass rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-on-surface-variant">Kendala Toko Tutup</span>
            <p className="text-2xl sm:text-3xl font-black text-on-surface m-0">{pendingClosedShop.length}</p>
            <span className="text-[11px] text-on-surface-variant block">Butuh instruksi Skip / Reroute</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center justify-center text-lg shrink-0">
            <FiAlertCircle />
          </div>
        </div>

        <div className="bg-surface border border-border-glass rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-on-surface-variant">Buka Kunci Presensi</span>
            <p className="text-2xl sm:text-3xl font-black text-on-surface m-0">{pendingUnlock.length}</p>
            <span className="text-[11px] text-on-surface-variant block">Sales terkunci di outlet</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center text-lg shrink-0">
            <LuKey />
          </div>
        </div>

        <div className="bg-surface border border-border-glass rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-on-surface-variant">Absen Luar RJP</span>
            <p className="text-2xl sm:text-3xl font-black text-on-surface m-0">{pendingOffPjpAtt.length + pendingOffPjpReq.length}</p>
            <span className="text-[11px] text-on-surface-variant block">Kunjungan toko non-jadwal</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-surface-container text-on-surface border border-border-glass flex items-center justify-center text-lg shrink-0">
            <LuClock />
          </div>
        </div>
      </div>

      {/* 2. Symmetrical Segmented Sub-filter Chips */}
      <div className="bg-surface-container/60 p-1.5 rounded-2xl border border-border-glass grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full">
        {ACTION_CENTER_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          const count = counts[filter.id] ?? 0;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 w-full border ${
                isActive
                  ? 'bg-surface text-on-surface border-border-glass shadow-xs'
                  : 'bg-transparent border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface/40'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {Icon && <Icon className="text-sm shrink-0" />}
                <span className="truncate">{filter.label}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  isActive
                    ? 'bg-surface-container text-on-surface'
                    : count > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    : 'bg-surface-container/80 text-on-surface-variant'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Empty State if nothing pending */}
      {!hasAnyItems && (
        <EmptyState
          icon={LuCircleCheck}
          title="Semua Antrean Operasional Bersih"
          description="Tidak ada kendala toko tutup, permohonan unlock, atau presensi luar RJP yang membutuhkan tindakan saat ini."
        />
      )}

      {/* 4. Closed Shop Incidents Section */}
      {showClosedShop && closedShopIncidents.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            title="Laporan Toko Tutup & Kendala Rute"
            subtitle="Ambil tindakan cepat: Izinkan lewati (Skip) atau alihkan rute langsung (Reroute) ke toko pengganti"
          />
          <div className="space-y-3">
            {closedShopIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onHandleIncident={onHandleIncident}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Unlock Requests Section */}
      {showUnlock && unlockRequests.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            title="Permintaan Buka Kunci (Unlock) Presensi"
            subtitle="Permohonan pembukaan presensi dari sales yang terkunci karena toko sebelumnya belum selesai"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {unlockRequests.map((req) => (
              <UnlockRequestCard
                key={req.id}
                request={req}
                onApprove={(id, stopId) => onApproveUnlock(id, stopId)}
                onReject={onRejectUnlock}
              />
            ))}
          </div>
        </div>
      )}

      {/* 6. Off-PJP Attendances Section */}
      {showOffPjp && (offPjpAttendances.length > 0 || offPjpRequests.length > 0) && (
        <div className="space-y-3">
          <SectionHeader
            title="Validasi Kunjungan & Absensi Luar RJP"
            subtitle="Verifikasi bukti foto dan catatan check-in sales di toko prospek di luar jadwal PJP hari ini"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {offPjpAttendances.map((att) => (
              <OffPjpAttendanceCard
                key={att.id}
                attendance={att}
                onValidate={onValidateOffPjp}
              />
            ))}
            {offPjpRequests.map((req) => (
              <IncidentCard
                key={req.id}
                incident={req}
                onHandleIncident={onHandleIncident}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
