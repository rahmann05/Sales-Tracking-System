import React, { useState } from 'react';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ApprovalSubFilterChips } from './ApprovalSubFilterChips';
import { OffPjpAttendanceCard } from './OffPjpAttendanceCard';
import { OffPjpRequestCard } from './OffPjpRequestCard';
import { UnlockRequestCard } from '../../Admin/components/UnlockRequestCard';
import { LuCircleCheck } from 'react-icons/lu';

/**
 * SupervisorApprovalsTab Component
 * Single Responsibility: Konten tab Antrean Approval & Validasi (unlock, absen luar RJP, pengajuan toko).
 */
export const SupervisorApprovalsTab = ({
    unlockRequests = [],
    offPjpAttendances = [],
    offPjpRequests = [],
    totalPending = 0,
    userRole,
    onApproveUnlock,
    onRejectUnlock,
    onValidateOffPjp,
    onApproveOffPjpRequest,
}) => {
    const [subFilter, setSubFilter] = useState('ALL');

    const counts = {
        ALL: totalPending,
        UNLOCK: unlockRequests.length,
        OFF_PJP_ATTENDANCE: offPjpAttendances.length,
        OFF_PJP_REQUEST: offPjpRequests.length,
    };

    const showUnlock = subFilter === 'ALL' || subFilter === 'UNLOCK';
    const showOffPjpAttendance = subFilter === 'ALL' || subFilter === 'OFF_PJP_ATTENDANCE';
    const showOffPjpRequest = subFilter === 'ALL' || subFilter === 'OFF_PJP_REQUEST';

    return (
        <div className="space-y-6">
            <ApprovalSubFilterChips activeFilter={subFilter} onSelectFilter={setSubFilter} counts={counts} />

            {showUnlock && unlockRequests.length > 0 && (
                <div className="space-y-3">
                    <SectionHeader
                        title="Permintaan Buka Kunci (Unlock) Presensi Outlet"
                        subtitle="Permohonan pembukaan presensi dari tim Sales / Driver / Helper yang terkunci karena belum menyelesaikan toko sebelumnya"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                        {unlockRequests.map((req) => (
                            <UnlockRequestCard
                                key={req.id}
                                request={req}
                                onApprove={(id, stopId) => onApproveUnlock(id, stopId, userRole)}
                                onReject={onRejectUnlock}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showOffPjpAttendance && (
                <div className="space-y-3">
                    <SectionHeader
                        title="Validasi Presensi Toko Luar RJP"
                        subtitle="Tinjau dan beri validasi presensi sales di luar rute terjadwal (disertai foto GPS dan alasan)"
                    />
                    {offPjpAttendances.length === 0 ? (
                        <EmptyState
                            icon={LuCircleCheck}
                            title="Tidak Ada Presensi Luar RJP"
                            description="Semua presensi tim sales berada dalam koridor jadwal RJP resmi."
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                            {offPjpAttendances.map((item) => (
                                <OffPjpAttendanceCard key={item.id} item={item} onValidate={onValidateOffPjp} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showOffPjpRequest && offPjpRequests.length > 0 && (
                <div className="space-y-3">
                    <SectionHeader
                        title="Pengajuan Toko Baru di Luar RJP"
                        subtitle="Permohonan pendaftaran outlet baru dari tim lapangan untuk dievaluasi kelayakannya"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                        {offPjpRequests.map((req) => (
                            <OffPjpRequestCard key={req.id} request={req} onApprove={onApproveOffPjpRequest} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
