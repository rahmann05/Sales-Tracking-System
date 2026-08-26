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
      label: '1. Daily Call Real-Time',
      subtitle: 'Absensi & Kunjungan Harian',
      icon: LuPhoneCall,
      badge: 'Real-Time',
      badgeColor: 'bg-blue-500/10 text-blue-600',
    },
    {
      id: 'ANOMALIES',
      label: '2. Audit Absensi Janggal',
      subtitle: 'Tabel Khusus Durasi & GPS',
      icon: LuShieldAlert,
      badge: '🚨 Audit',
      badgeColor: 'bg-rose-500/10 text-rose-600',
    },
    {
      id: 'WEEKLY',
      label: '3. Rekap Mingguan (WTD)',
      subtitle: 'Matriks 6 Hari Kerja (Senin-Sabtu)',
      icon: LuCalendarRange,
      badge: 'Weekly',
      badgeColor: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      id: 'MTD',
      label: '4. Month-to-Date (MTD)',
      subtitle: 'Target Bulanan & Pertumbuhan LMA',
      icon: LuTrendingUp,
      badge: 'Monthly',
      badgeColor: 'bg-purple-500/10 text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                ? 'bg-primary text-on-primary border-primary shadow-md scale-[1.01]'
                : 'bg-surface border-border-glass text-on-surface hover:border-primary/40 hover:bg-surface-variant/20'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon className={`text-base shrink-0 ${tab.id === 'ANOMALIES' && !isActive ? 'text-rose-600' : ''}`} />
                <span className="font-extrabold text-xs sm:text-sm tracking-tight">{tab.label}</span>
              </div>
              <p
                className={`text-[11px] m-0 leading-tight ${
                  isActive ? 'text-on-primary/80' : 'text-on-surface-variant'
                }`}
              >
                {tab.subtitle}
              </p>
            </div>

            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                isActive ? 'bg-white/20 text-white' : tab.badgeColor
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
