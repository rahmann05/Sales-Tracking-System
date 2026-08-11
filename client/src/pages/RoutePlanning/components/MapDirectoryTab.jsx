import React from 'react';
import { RouteMapView } from './RouteMapView';
import { RjpTeamCard } from './RjpTeamCard';
import { useApp } from '../../../context/AppContext';

/**
 * MapDirectoryTab Component
 * Single Responsibility: Konten tab peta spasial rute + direktori tim RJP lapangan.
 */
export const MapDirectoryTab = ({ rjpTeams = [] }) => {
    const { salesList = [], salesStops = [] } = useApp();
    const today = new Date().toISOString().split('T')[0];
    const todayStops = salesStops.filter(s => s.date === today);

    return (
        <div className="space-y-6">
            {/* Peta Spasial Card */}
            <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm flex flex-col h-[500px]">
                <h3 className="text-base font-extrabold text-on-surface mb-3 shrink-0">
                    Peta Spasial Rute & Klaster
                </h3>
                <div className="flex-1 w-full relative rounded-xl overflow-hidden border border-border-glass">
                    <RouteMapView selectedRouteName="Semua Rute" />
                </div>
            </div>

            {/* Tabel Monitoring Kunjungan & Absensi */}
            <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-on-surface">Monitoring Kunjungan & Absensi Hari Ini</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border-glass">
                                <th className="py-3 px-4 font-semibold text-on-surface">Sales</th>
                                <th className="py-3 px-4 font-semibold text-on-surface">Target Kunjungan</th>
                                <th className="py-3 px-4 font-semibold text-on-surface">Progres Selesai</th>
                                <th className="py-3 px-4 font-semibold text-on-surface">Posisi Terakhir</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesList.map(sales => {
                                const myStops = todayStops.filter(s => s.assignedSalesName === sales.name);
                                const completed = myStops.filter(s => s.status === 'COMPLETED').length;
                                const lastStop = [...myStops].reverse().find(s => s.status === 'COMPLETED');
                                
                                return (
                                    <tr key={sales.id} className="border-b border-border-glass last:border-0 hover:bg-surface-variant/30 transition-colors">
                                        <td className="py-3 px-4 font-medium text-on-surface">{sales.name}</td>
                                        <td className="py-3 px-4 text-on-surface-variant">{myStops.length} Toko</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold">
                                                {completed} / {myStops.length}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-on-surface-variant text-xs truncate max-w-[200px]">
                                            {lastStop ? lastStop.outletName : 'Belum Mulai / Belum Ada Posisi'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {salesList.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-4 text-center text-on-surface-variant text-sm">
                                        Tidak ada data sales
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Direktori Tim RJP Lapangan */}
            <div>
                <h3 className="text-base font-extrabold text-on-surface mb-1">
                    Direktori Tim RJP Lapangan ({rjpTeams.length} Tim Aktif)
                </h3>
                <p className="text-xs text-on-surface-variant mb-4">
                    Daftar supervisor dan anggota sales yang bertugas di wilayah Bandung Barat & Cimahi
                </p>
                <div className="flex flex-col gap-3.5">
                    {rjpTeams.map((team) => (
                        <RjpTeamCard key={team.id} team={team} />
                    ))}
                </div>
            </div>
        </div>
    );
};
