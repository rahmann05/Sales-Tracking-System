import { ShiftAttendanceWidget } from '../../../shared/components/common/ShiftAttendanceWidget';
import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Avatar } from '../../../shared/components/common/Avatar';

/**
 * SalesShiftHeader Component (Single Responsibility: Display Sales Profile & Shift Attendance Widget)
 * 1 File per Component
 */
export const SalesShiftHeader = () => {
  const { user } = useApp();
  const territory = typeof user.cluster === 'string' ? user.cluster : user.cluster?.name;

  return (
    <div className="role-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar src={user.avatar} name={user.name} size="lg" className="rounded-2xl ring-2 ring-primary/20" />
          <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-surface" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface">{user.name}</h2>

          </div>
          <p className="text-xs text-on-surface-variant">
            Wilayah tugas: <span className="font-semibold text-on-surface">{[territory, user.region].filter(Boolean).join(' · ') || 'Belum ditetapkan'}</span>
          </p>
        </div>
      </div>

      <ShiftAttendanceWidget />
    </div>
  );
};
