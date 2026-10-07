import { ShiftAttendanceWidget } from '../../../shared/components/common/ShiftAttendanceWidget';
import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuMapPin } from 'react-icons/lu';
import { Avatar } from '../../../shared/components/common/Avatar';

/**
 * SupervisorShiftHeader Component
 * Single Responsibility: Display Supervisor Profile & Shift Attendance Widget (Clock In/Out).
 * 1 File per Component
 */
export const SupervisorShiftHeader = () => {
  const { user, clusters = [] } = useApp();

  return (
    <div className="bg-surface border border-border-glass rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative shrink-0">
          <Avatar
            src={user?.avatar}
            name={user?.name || 'Belum Ditugaskan'}
            size="lg"
            className="ring-2 ring-primary/20 shadow-xs"
          />
          <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-surface shadow-xs" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg md:text-xl font-black text-on-surface tracking-tight truncate">
              {user?.name || 'Belum Ditugaskan'}
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
              Supervisor
            </span>
          </div>
          <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-1 min-w-0">
            <LuMapPin className="text-xs text-primary shrink-0" />
            <span className="truncate">
              Wilayah Tugas:{' '}
              <strong className="text-on-surface font-semibold">
                {clusters.length > 0 ? clusters.map((c) => c.name).join(', ') : (user?.region || 'Klaster Terdaftar')}
              </strong>
            </span>
          </p>
        </div>
      </div>

      <div className="shrink-0 w-full md:w-auto">
        <ShiftAttendanceWidget />
      </div>
    </div>
  );
};
