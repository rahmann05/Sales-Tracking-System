import React from 'react';
import { LuPhoneCall, LuCalendarRange, LuTrendingUp, LuShieldAlert } from 'react-icons/lu';

/**
 * ReportTabBar Component
 * Single Responsibility: Render tab switcher for ND6 Distribution Reports suite
 * (1. Daily Real-Time, 2. Dedicated Anomaly Table, 3. Weekly WTD, 4. Month-to-Date MTD).
 */
export const ReportTabBar = ({ activeTab, onSelectTab }) => {
  const tabs = [
    {
      id: 'DAILY',
      label: '1. Laporan Harian Real-Time',
      subtitle: 'Kunjungan, Rute Kronologis & Audit Anomali',
      icon: LuPhoneCall,
      badge: 'Harian',
    },
    {
      id: 'WEEKLY',
      label: '2. Rekap Mingguan (WTD)',
      subtitle: 'Matriks 6 Hari Kerja (Senin-Sabtu)',
      icon: LuCalendarRange,
      badge: 'Mingguan',
    },
    {
      id: 'MTD',
      label: '3. Pencapaian Bulanan (MTD)',
      subtitle: 'Target vs Realisasi & Pertumbuhan LMA',
      icon: LuTrendingUp,
      badge: 'Bulanan',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
              isActive
                ? 'bg-primary text-on-primary border-primary shadow-sm scale-[1.01]'
                : 'bg-surface border-border-glass text-on-surface hover:border-primary/40 hover:bg-surface-variant/20'
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon className={`text-base shrink-0 ${isActive ? 'text-on-primary' : 'text-primary'}`} />
                <span className="font-black text-xs sm:text-sm tracking-tight truncate">{tab.label}</span>
              </div>
              <p
                className={`text-[11px] m-0 leading-tight truncate ${
                  isActive ? 'text-on-primary/80' : 'text-on-surface-variant'
                }`}
              >
                {tab.subtitle}
              </p>
            </div>

            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border ${
                isActive ? 'bg-white/20 text-white border-white/30' : 'bg-surface-container text-on-surface-variant border-border-glass'
              }`}
            >
              {tab.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
};
