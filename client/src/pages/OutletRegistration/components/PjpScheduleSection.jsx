import React from 'react';
import { LuCalendar } from 'react-icons/lu';

const DAYS_LIST = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

/**
 * PjpScheduleSection Component
 * Single Responsibility: Manage Visit Week Schedule (All Week, Week Ganjil, Week Genap) and Day toggles.
 */
export const PjpScheduleSection = ({
  visitWeekSchedule,
  visitDays = [],
  onToggleDay,
  onChange,
}) => {
  return (
    <div className="outlet-reg-section-card">
      <div className="outlet-reg-section-title">
        <LuCalendar className="text-primary" />
        <span>8. Rencana Jadwal Kunjungan (PJP)</span>
      </div>
      <div className="space-y-4">
        <div>
          <label className="outlet-reg-label">SIKLUS MINGGU KUNJUNGAN</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ALL_WEEK', label: 'ALL WEEK (Tiap Minggu)' },
              { id: 'WEEK_GANJIL', label: 'WEEK GANJIL (W1/W3)' },
              { id: 'WEEK_GENAP', label: 'WEEK GENAP (W2/W4)' },
            ].map((w) => (
              <div
                key={w.id}
                onClick={() => onChange('visitWeekSchedule', w.id)}
                className={`outlet-reg-radio-card justify-center text-center p-2 text-xs font-bold ${
                  visitWeekSchedule === w.id ? 'active' : ''
                }`}
              >
                {w.label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="outlet-reg-label">PILIH HARI KUNJUNGAN</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {DAYS_LIST.map((day) => {
              const isChecked = visitDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onToggleDay(day)}
                  className={`p-2 rounded-xl text-xs font-extrabold transition-all border ${
                    isChecked
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-container text-on-surface-variant border-border-glass'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
