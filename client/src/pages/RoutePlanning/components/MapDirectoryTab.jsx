import React from 'react';
import { RouteMapView } from './RouteMapView';
import { RjpTeamCard } from './RjpTeamCard';

/**
 * MapDirectoryTab Component
 * Single Responsibility: Konten tab peta spasial rute + direktori tim RJP lapangan.
 */
export const MapDirectoryTab = ({ rjpTeams = [] }) => (
    <div className="space-y-6">
        <RouteMapView selectedRouteName="Klaster Cimahi Selatan & Leuwigajah" />
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
