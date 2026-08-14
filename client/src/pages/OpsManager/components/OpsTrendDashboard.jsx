import React, { useState } from 'react';
import { LuCalendar } from 'react-icons/lu';
import { 
  FiTrendingUp, 
  FiBarChart2, 
  FiPieChart, 
  FiActivity, 
  FiAlertTriangle 
} from 'react-icons/fi';
import { Card } from '../../../components/common/Card';

export const OpsTrendDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('4W'); // '4W' | '3M'

  // Weekly Adherence Data (4 Weeks)
  const weeklyTrend = [
    { week: 'Mgg 1 (Juli)', rate: 82, completed: 164, target: 200 },
    { week: 'Mgg 2 (Juli)', rate: 86, completed: 172, target: 200 },
    { week: 'Mgg 3 (Agust)', rate: 89, completed: 178, target: 200 },
    { week: 'Mgg 4 (Agust)', rate: 94, completed: 188, target: 200 },
  ];

  // Daily visits breakdown across days of week
  const dailyBreakdown = [
    { day: 'Sen', target: 34, actual: 32, label: 'Senin' },
    { day: 'Sel', target: 38, actual: 36, label: 'Selasa' },
    { day: 'Rab', target: 36, actual: 35, label: 'Rabu' },
    { day: 'Kam', target: 40, actual: 38, label: 'Kamis' },
    { day: 'Jum', target: 42, actual: 39, label: 'Jumat' },
    { day: 'Sab', target: 30, actual: 28, label: 'Sabtu' },
  ];

  // Incident reasons breakdown
  const closedReasons = [
    { label: 'Tutup Sementara / Libur', count: 14, percent: 45, color: '#3b82f6' },
    { label: 'Renovasi / Maintenance', count: 8, percent: 26, color: '#8b5cf6' },
    { label: 'Pindah Lokasi / Alamat Baru', count: 6, percent: 19, color: '#f59e0b' },
    { label: 'Tutup Permanen', count: 3, percent: 10, color: '#ef4444' },
  ];

  // Incidents weekly volume
  const incidentTrends = [
    { week: 'Mgg 1', skip: 8, reroute: 4, offPjp: 5 },
    { week: 'Mgg 2', skip: 6, reroute: 5, offPjp: 7 },
    { week: 'Mgg 3', skip: 5, reroute: 3, offPjp: 4 },
    { week: 'Mgg 4', skip: 3, reroute: 2, offPjp: 3 },
  ];

  return (
    <div className="bg-surface border border-border-glass rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-glass pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              <FiActivity />
            </span>
            <h3 className="text-base font-bold text-on-surface">
              Dashboard Tren Kinerja & Analisis Lapangan (Multi-Minggu)
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Evaluasi pola kepatuhan rute, volume kunjungan harian, dan tren insiden toko tutup secara makro
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedPeriod('4W')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === '4W'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/60'
            }`}
          >
            4 Minggu Terakhir
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('3M')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === '3M'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/60'
            }`}
          >
            Kuartal Ini
          </button>
        </div>
      </div>

      {/* Grid Grafik 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tren Kepatuhan RJP (Line / Area SVG) */}
        <Card className="!p-5 rounded-2xl border border-border-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <FiTrendingUp className="text-emerald-500" />
                <span>Tren Tingkat Kepatuhan RJP (%)</span>
              </h4>
              <p className="text-[11px] text-on-surface-variant">Peningkatan kedisiplinan rute 4 minggu berturut-turut</p>
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              +12% Kenaikan
            </span>
          </div>

          <div className="h-44 w-full flex flex-col justify-end pt-4">
            <svg viewBox="0 0 400 120" className="w-full h-28 overflow-visible">
              <defs>
                <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area */}
              <polygon
                points="40,65 140,50 240,35 340,15 340,110 40,110"
                fill="url(#adherenceGrad)"
              />

              {/* Line */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="40,65 140,50 240,35 340,15"
              />

              {/* Points */}
              {[
                { x: 40, y: 65, val: '82%' },
                { x: 140, y: 50, val: '86%' },
                { x: 240, y: 35, val: '89%' },
                { x: 340, y: 15, val: '94%' },
              ].map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#10b981">
                    {p.val}
                  </text>
                </g>
              ))}
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between text-[11px] font-bold text-on-surface-variant px-4 pt-2 border-t border-border-glass">
              {weeklyTrend.map((w, idx) => (
                <span key={idx}>{w.week}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Chart 2: Volume Kunjungan Harian (Bar Chart SVG) */}
        <Card className="!p-5 rounded-2xl border border-border-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <FiBarChart2 className="text-primary" />
                <span>Realisasi Kunjungan vs Target per Hari</span>
              </h4>
              <p className="text-[11px] text-on-surface-variant">Rata-rata volume toko yang dikunjungi per hari kerja</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary"></span> Aktual</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-surface-variant"></span> Target</span>
            </div>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
            {dailyBreakdown.map((item, idx) => {
              const heightActual = (item.actual / 50) * 120;
              const heightTarget = (item.target / 50) * 120;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-32">
                    {/* Target bar */}
                    <div 
                      className="w-2.5 bg-surface-variant/60 rounded-t-md transition-all"
                      style={{ height: `${heightTarget}px` }}
                      title={`Target: ${item.target}`}
                    />
                    {/* Actual bar */}
                    <div 
                      className="w-4 bg-primary rounded-t-md transition-all shadow-sm flex flex-col justify-start items-center pt-1"
                      style={{ height: `${heightActual}px` }}
                      title={`Aktual: ${item.actual}`}
                    >
                      <span className="text-[8px] font-black text-on-primary">{item.actual}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-on-surface">{item.day}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Chart 3: Distribusi Alasan Toko Tutup */}
        <Card className="!p-5 rounded-2xl border border-border-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <FiPieChart className="text-purple-500" />
                <span>Distribusi Alasan Toko Tutup (Bulan Ini)</span>
              </h4>
              <p className="text-[11px] text-on-surface-variant">Analisis penyebab kegagalan visitasi rute master</p>
            </div>
            <span className="text-xs font-black text-on-surface bg-surface-variant/40 px-2.5 py-1 rounded-full">
              31 Insiden
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {closedReasons.map((reason, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: reason.color }} />
                    {reason.label}
                  </span>
                  <span className="font-mono font-bold text-on-surface">
                    {reason.count} Toko ({reason.percent}%)
                  </span>
                </div>
                <div className="w-full bg-surface-variant/40 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${reason.percent}%`, backgroundColor: reason.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Chart 4: Tren Volume Insiden per Minggu */}
        <Card className="!p-5 rounded-2xl border border-border-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <FiAlertTriangle className="text-amber-500" />
                <span>Tren Penurunan Insiden Rute (Skip & Reroute)</span>
              </h4>
              <p className="text-[11px] text-on-surface-variant">Penurunan insiden mengindikasikan master RJP makin presisi</p>
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Menurun 53%
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 text-center">
            {incidentTrends.map((inc, idx) => (
              <div key={idx} className="p-3 bg-surface-variant/20 rounded-xl border border-border-glass space-y-1.5">
                <span className="text-xs font-bold text-on-surface block">{inc.week}</span>
                <div className="text-lg font-black text-on-surface">{inc.skip + inc.reroute + inc.offPjp}</div>
                <div className="text-[10px] text-on-surface-variant space-y-0.5 font-semibold">
                  <div className="text-rose-600">{inc.skip} Skip</div>
                  <div className="text-amber-600">{inc.reroute} Reroute</div>
                  <div className="text-purple-600">{inc.offPjp} Off-PJP</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
