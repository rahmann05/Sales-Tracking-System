import React from 'react';
import { LuBuilding2, LuFileText, LuClock } from 'react-icons/lu';

/**
 * OutletRegistrationHeader Component
 * Single Responsibility: Render page title, company branding badge, and tab switcher for Sales.
 */
export const OutletRegistrationHeader = ({ activeTab, onSelectTab, division, submissionsCount }) => {
  return (
    <div className="outlet-reg-header-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-extrabold flex items-center gap-1.5">
              <LuBuilding2 /> CV SINAR ANUGRAH FMCG DISTRIBUTOR
            </span>
            <span className="px-3 py-1 bg-sky-500/10 text-sky-600 rounded-full text-xs font-extrabold">
              DIVISI {division === 'BELFOODS' ? 'BELFOODS (BFI)' : (division || 'BELFOODS')}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-on-surface tracking-tight m-0">
            FORM REGISTRASI OUTLET
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 m-0">
            Pendaftaran resmi outlet baru ke dalam sistem distribusi dan call plan kunjungan sales
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-surface-container p-1 rounded-xl border border-border-glass self-start">
          <button
            type="button"
            onClick={() => onSelectTab('FORM')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'FORM'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LuFileText /> Formulir Pendaftaran
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('HISTORY')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LuClock /> Riwayat Pengajuan ({submissionsCount})
          </button>
        </div>
      </div>
    </div>
  );
};
