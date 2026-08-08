import React from 'react';
import { LuCalendar, LuStore } from 'react-icons/lu';
import '../../../../styles/components/SalesRollingScheduleView.css';

const DAYS_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * SalesRollingScheduleView Component
 * Single Responsibility: Display Personal Weekly Rolling Timeline for Sales Rep.
 * 1 File = 1 Component
 */
export const SalesRollingScheduleView = ({ userSchedule = {}, todayDay = 'Senin', onSelectDay, salesName }) => {
  return (
    <div className="sales-schedule-container">
      <div>
        <h3 className="text-base font-extrabold text-on-surface flex items-center gap-2">
          <LuCalendar className="text-primary" />
          <span>Jadwal Rolling Mingguan {salesName ? `(${salesName})` : 'Saya'}</span>
        </h3>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Rotasi wilayah dan target kunjungan harian yang diatur oleh Supervisor
        </p>
      </div>

      <div className="sales-schedule-grid">
        {DAYS_LIST.map((day) => {
          const isToday = day === todayDay;
          const dayInfo = userSchedule[day] || { clusterName: 'Rolling / Follow-up', outletsCount: 10, subDistrict: 'Bandung Barat' };

          return (
            <div
              key={day}
              onClick={() => onSelectDay && onSelectDay(day)}
              className={`sales-schedule-day-card ${isToday ? 'active-today' : ''} cursor-pointer hover:border-primary transition-all`}
              title={`Klik untuk melihat rute hari ${day}`}
            >
              <div className="sales-schedule-day-badge">
                <span>{day}</span>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-on-primary">
                    TERPILIH
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-on-surface line-clamp-2">{dayInfo.clusterName}</div>

              <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-auto pt-2 border-t border-border-glass">
                <span className="flex items-center gap-1 font-semibold">
                  <LuStore className="text-primary" />
                  {dayInfo.outletsCount} Toko
                </span>
                <span className="text-[10px]">{dayInfo.subDistrict || 'Bandung Barat'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
