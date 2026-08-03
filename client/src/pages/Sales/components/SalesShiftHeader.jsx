import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuCamera, LuClock } from 'react-icons/lu';

/**
 * SalesShiftHeader Component (Single Responsibility: Display Sales Profile & Shift Attendance Widget)
 * 1 File per Component
 */
export const SalesShiftHeader = () => {
  const { user, shiftAttendance, handleShiftClockIn, handleShiftClockOut } = useApp();

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20" />
          <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-surface" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface">{user.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              {user.roleLabel}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Rute Hari Ini: <span className="font-semibold text-on-surface">{user.cluster}</span> ({user.region})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-surface-variant/40 p-3 rounded-xl border border-border-glass">
        <div className="text-right">
          <p className="text-xs text-on-surface-variant font-medium">Status Shift Harian</p>
          <p className={`text-xs font-bold ${shiftAttendance.clockedIn ? 'text-emerald-600' : 'text-amber-600'}`}>
            {shiftAttendance.clockedIn ? `Masuk: ${shiftAttendance.clockInTime}` : 'Belum Absen Masuk'}
          </p>
        </div>
        {!shiftAttendance.clockedIn ? (
          <button
            type="button"
            onClick={handleShiftClockIn}
            className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <LuCamera className="text-base" />
            <span>Clock In Shift</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleShiftClockOut}
            className="px-3 py-2 bg-surface border border-border-glass text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-variant transition-all flex items-center gap-1.5"
          >
            <LuClock className="text-base text-on-surface-variant" />
            <span>Clock Out</span>
          </button>
        )}
      </div>
    </div>
  );
};
