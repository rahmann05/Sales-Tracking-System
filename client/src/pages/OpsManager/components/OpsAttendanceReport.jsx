import React, { useState } from 'react';
import { 
  LuUserCheck, 
  LuClock, 
  LuCalendar 
} from 'react-icons/lu';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { Card } from '../../../components/common/Card';

export const OpsAttendanceReport = () => {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const attendanceData = [
    {
      id: 'att-1',
      salesName: 'Budi Santoso',
      role: 'Sales Field Rep',
      cluster: 'Klaster Cimahi Tengah',
      clockIn: '07:45 WIB',
      clockOut: '17:15 WIB',
      workHours: '9 Jam 30 Mnt',
      status: 'TEPAT_WAKTU',
      date: 'Hari Ini',
      inPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    },
    {
      id: 'att-2',
      salesName: 'Siti Rahma',
      role: 'Sales Field Rep',
      cluster: 'Klaster Padalarang',
      clockIn: '07:52 WIB',
      clockOut: '17:05 WIB',
      workHours: '9 Jam 13 Mnt',
      status: 'TEPAT_WAKTU',
      date: 'Hari Ini',
      inPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    },
    {
      id: 'att-3',
      salesName: 'Agus Wijaya',
      role: 'Sales Field Rep',
      cluster: 'Klaster Lembang',
      clockIn: '08:12 WIB',
      clockOut: '17:30 WIB',
      workHours: '9 Jam 18 Mnt',
      status: 'TERLAMBAT',
      date: 'Hari Ini',
      inPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      lateReason: 'Kendala kemacetan di Setiabudi',
    },
    {
      id: 'att-4',
      salesName: 'YULI',
      role: 'Sales Field Rep (Belfoods)',
      cluster: 'Klaster Belfoods Bandung',
      clockIn: '07:40 WIB',
      clockOut: '17:00 WIB',
      workHours: '9 Jam 20 Mnt',
      status: 'TEPAT_WAKTU',
      date: 'Hari Ini',
      inPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
  ];

  const filtered = selectedFilter === 'ALL'
    ? attendanceData
    : attendanceData.filter((a) => a.status === selectedFilter);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="!p-4 bg-emerald-500/5 border-emerald-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
            <LuUserCheck className="text-sm" /> Kehadiran Tim
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600">4 / 4</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">100% Masuk Kerja</span>
          </div>
        </Card>

        <Card className="!p-4 bg-blue-500/5 border-blue-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
            <LuClock className="text-sm" /> Rata-rata Jam Masuk
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-on-surface">07:52</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">WIB (Shift Pagi)</span>
          </div>
        </Card>

        <Card className="!p-4 bg-teal-500/5 border-teal-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-teal-700 flex items-center gap-1.5">
            <FiCheckCircle className="text-sm" /> Tepat Waktu
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-teal-600">75%</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">3 dari 4 Sales</span>
          </div>
        </Card>

        <Card className="!p-4 bg-amber-500/5 border-amber-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
            <FiAlertTriangle className="text-sm" /> Terlambat Masuk
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600">1</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">Agus Wijaya (+12 Mnt)</span>
          </div>
        </Card>
      </div>

      {/* Tabel Absensi Tim */}
      <Card className="!p-0 rounded-2xl border border-border-glass overflow-hidden">
        <div className="p-4 border-b border-border-glass flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <LuClock className="text-primary" />
              <span>Log Presensi Shift & Jam Kerja Lapangan</span>
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Rekapitulasi clock-in shift pagi dan clock-out shift sore seluruh armada sales
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-variant/30 p-1 rounded-xl border border-border-glass text-xs">
              <button
                type="button"
                onClick={() => setSelectedFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedFilter === 'ALL' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Semua ({attendanceData.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('TEPAT_WAKTU')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedFilter === 'TEPAT_WAKTU' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Tepat Waktu
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('TERLAMBAT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedFilter === 'TERLAMBAT' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Terlambat
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-variant/30 text-on-surface-variant font-bold border-b border-border-glass">
              <tr>
                <th className="py-3 px-4">Nama Personel</th>
                <th className="py-3 px-4">Klaster Rute</th>
                <th className="py-3 px-4">Clock-In (Masuk)</th>
                <th className="py-3 px-4">Clock-Out (Pulang)</th>
                <th className="py-3 px-4">Total Jam Kerja</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass">
              {filtered.map((att) => (
                <tr key={att.id} className="hover:bg-surface-variant/10 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-on-surface">{att.salesName}</div>
                    <div className="text-[10px] text-on-surface-variant">{att.role}</div>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant font-medium">{att.cluster}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-on-surface">{att.clockIn}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-on-surface">{att.clockOut}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-on-surface">{att.workHours}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        att.status === 'TEPAT_WAKTU'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                      }`}
                    >
                      {att.status === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
                    </span>
                    {att.lateReason && (
                      <span className="block text-[9px] text-amber-700 mt-1 max-w-[140px] mx-auto truncate" title={att.lateReason}>
                        {att.lateReason}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
