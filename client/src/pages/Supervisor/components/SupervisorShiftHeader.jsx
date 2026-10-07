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
    <div className="bg-surface border border-border-glass rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar
            src={user?.avatar}
            name={user?.name || 'Belum Ditugaskan'}
            size="lg"
            className="rounded-2xl ring-2 ring-primary/30"
          />
          <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-surface" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tight">
              {user?.name || 'Belum Ditugaskan'}
            </h2>

          </div>
          <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-1">
            <LuMapPin className="text-xs text-primary shrink-0" />
            <span>Wilayah Tugas: <strong className="text-on-surface font-semibold">{clusters.length > 0 ? clusters.map((c) => c.name).join(', ') : (user?.region || 'Klaster Terdaftar')}</strong></span>
          </p>
        </div>
      </div>

      <ShiftAttendanceWidget />
    </div>
  );
};
