import React from 'react';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { IncidentCard } from './IncidentCard';
import { LuCircleCheck } from 'react-icons/lu';

/**
 * SupervisorIncidentsTab Component
 * Single Responsibility: Konten tab Laporan Toko Tutup (daftar incident + aksi handle).
 */
export const SupervisorIncidentsTab = ({ closedShopIncidents = [], onHandleIncident }) => (
    <div className="space-y-4">
        <SectionHeader
            title="Laporan Toko Tutup / Kendala Kunjungan"
            subtitle="Tindakan cepat SPV: Lewati Toko (Skip), Reroute Langsung ke toko pengganti, atau Eskalasi ke Manajer Operasional."
        />

        {closedShopIncidents.length === 0 ? (
            <EmptyState
                icon={LuCircleCheck}
                title="Tidak Ada Laporan Toko Tutup"
                description="Seluruh rute kunjungan berjalan normal tanpa kendala outlet tutup."
            />
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closedShopIncidents.map((incident) => (
                    <IncidentCard key={incident.id} incident={incident} onHandle={onHandleIncident} />
                ))}
            </div>
        )}
    </div>
);
