import React, { useState } from 'react';
import { SectionHeader } from './SectionHeader';
import { ApprovalSubFilterChips } from './ApprovalSubFilterChips';
import { IncidentCard } from './IncidentCard';
import { UnlockRequestCard } from '../../Admin/components/UnlockRequestCard';
import { OffPjpAttendanceCard } from './OffPjpAttendanceCard';

/**
 * SupervisorApprovalsTab Component
 * Single Responsibility: Present all pending approvals for Supervisor with dedicated sub-filter chips
 */
export const SupervisorApprovalsTab = ({
    incidents = [],
    offPjpAttendances = [],
    onDirectReroute,
    onRequestReroute,
    onSkip,
    onApproveUnlock,
    onRejectUnlock,
    onValidateOffPjp,
}) => {
    const [subFilter, setSubFilter] = useState('ALL');

    const closedShopReports = incidents.filter((i) => i.type === 'CLOSED_SHOP');
    const unlockRequests = incidents.filter((i) => i.type === 'UNLOCK_REQUEST');
    const offPjpRequests = incidents.filter((i) => i.type === 'OFF_PJP_REQUEST');

    const counts = {
        ALL: closedShopReports.length + unlockRequests.length + offPjpAttendances.length + offPjpRequests.length,
        CLOSED_SHOP: closedShopReports.length,
        UNLOCK: unlockRequests.length,
        OFF_PJP_ATTENDANCE: offPjpAttendances.length,
        OFF_PJP_REQUEST: offPjpRequests.length,
    };

    const showUnlock = subFilter === 'ALL' || subFilter === 'UNLOCK';
    const showOffPjpAttendance = subFilter === 'ALL' || subFilter === 'OFF_PJP_ATTENDANCE';
    const showOffPjpRequest = subFilter === 'ALL' || subFilter === 'OFF_PJP_REQUEST';
    const showClosed = subFilter === 'ALL' || subFilter === 'CLOSED_SHOP';

    return (
        <div className="space-y-6">
            <ApprovalSubFilterChips activeFilter={subFilter} onSelectFilter={setSubFilter} counts={counts} />

            {showUnlock && unlockRequests.length > 0 && (
                <div className="space-y-3">
                    <SectionHeader
                        title="Permintaan Buka Kunci (Unlock) Presensi Outlet"
                        subtitle="Permohonan pembukaan presensi dari tim Sales yang terkunci karena belum menyelesaikan toko sebelumnya"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
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

            {showOffPjpAttendance && offPjpAttendances.length > 0 && (
                <div className="space-y-3">
                    <SectionHeader
                        title="Validasi Absen Toko Luar RJP"
                        subtitle="Sales melakukan check-in dan foto di toko prospek di luar jadwal PJP hari ini"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                        {offPjpAttendances.map((att) => (
                            <OffPjpAttendanceCard
                                key={att.id}
                                attendance={att}
                                onValidate={onValidateOffPjp}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showOffPjpRequest && offPjpRequests.length > 0 && (
                <div className="space-y-3">
                    <SectionHeader
                        title="Pengajuan Kunjungan Toko Luar RJP"
                        subtitle="Permintaan izin kunjungan tambahan ke toko prospek hari ini"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                        {offPjpRequests.map((req) => (
                            <IncidentCard
                                key={req.id}
                                incident={req}
                                onDirectReroute={onDirectReroute}
                                onRequestReroute={onRequestReroute}
                                onSkip={onSkip}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showClosed && closedShopReports.length > 0 && (
                <div className="space-y-3">
                    <SectionHeader
                        title="Laporan Toko Tutup"
                        subtitle="Toko yang dilaporkan tutup dan memerlukan tindakan lewati (skip) atau dialihkan (reroute)"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                        {closedShopReports.map((inc) => (
                            <IncidentCard
                                key={inc.id}
                                incident={inc}
                                onDirectReroute={onDirectReroute}
                                onRequestReroute={onRequestReroute}
                                onSkip={onSkip}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
