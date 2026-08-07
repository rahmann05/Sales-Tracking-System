import React from 'react';
import { LuCalendar } from 'react-icons/lu';
import { FiCalendar } from 'react-icons/fi';

const DAYS = ['SEMUA', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const DayFilterTabs = ({ selectedDay, onSelectDay }) => {
  return (
    <div className="section-block border-b border-border-glass pb-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-2">
          <LuCalendar className="text-lg text-tertiary" />
          <h3 className="section-title">Pilih Hari Kunjungan Master RJP</h3>
        </div>
        <span className="text-xs font-medium text-on-surface-variant">
          Menampilkan rute untuk hari: <strong className="text-on-surface">{selectedDay}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedDay === day
                ? 'bg-tertiary text-on-tertiary shadow-sm'
                : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
            }`}
          >
            {day === 'SEMUA' ? <span className="flex items-center gap-1"><FiCalendar /> Semua Hari</span> : <span className="flex items-center gap-1"><FiCalendar /> {day}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};
