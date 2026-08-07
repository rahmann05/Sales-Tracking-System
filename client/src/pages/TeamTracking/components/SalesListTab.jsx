import React from 'react';
import { Avatar } from '../../../components/common/Avatar';

/**
 * SalesListTab Component
 * Standardized equal height card layout: h-full min-h-[180px] flex flex-col justify-between
 */
export const SalesListTab = ({ filteredSalesList, isSales }) => {
  if (isSales) {
    return (
      <div className="app-card space-y-4">
        <div className="flex items-center justify-between border-b border-border-glass pb-3">
          <div>
            <span className="badge-tertiary mb-1 inline-block">TIM SUPERVISOR SAYA</span>
            <h4 className="card-title">Tim SPV Ahmad Subagja (Cimahi & KBB)</h4>
            <p className="card-subtitle">Cluster: Klaster Cimahi & Bandung Barat</p>
          </div>
          <span className="badge-primary">Total 2 Anggota Sales</span>
        </div>

        <div className="p-3.5 bg-tertiary/10 border border-tertiary/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-on-surface">
          <div>
            <p className="font-bold text-tertiary">Jadwal Tim RJP & Anggota Kunjungan Per Hari</p>
            <p className="text-on-surface-variant">
              Daftar tim RJP dan jadwal harinya dapat diakses pada halaman <strong>Jadwal Master RJP</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      {filteredSalesList.map((sales) => (
        <div key={sales.id} className="app-card h-full min-h-[180px] flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar name={sales.name} size="md" />
                <div>
                  <h4 className="card-title text-base font-bold text-on-surface">{sales.name}</h4>
                  <p className="card-subtitle text-xs text-on-surface-variant">{sales.email} • {sales.phone}</p>
                </div>
              </div>
              <span
                className={`badge-base shrink-0 ${
                  sales.status === 'Checked In'
                    ? 'bg-emerald-500/10 text-emerald-600 font-bold'
                    : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                {sales.status}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 p-3 bg-surface-variant/20 rounded-xl border border-border-glass text-xs mt-auto">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Tim Supervisor:</span>
              <span className="font-bold text-on-surface">{sales.spvTeamName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Tim RJP Kunjungan:</span>
              <span className="font-bold text-tertiary">{sales.rjpTeamName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Lokasi Terakhir:</span>
              <span className="font-semibold text-on-surface">{sales.location}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
