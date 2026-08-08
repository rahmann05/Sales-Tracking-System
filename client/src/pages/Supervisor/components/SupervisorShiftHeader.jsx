import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuCamera, LuClock, LuShieldCheck, LuMapPin } from 'react-icons/lu';
import { Avatar } from '../../../components/common/Avatar';
import { notifySuccess } from '../../../services/notificationService';

/**
 * SupervisorShiftHeader Component
 * Single Responsibility: Display Supervisor Profile & Shift Attendance Widget (Clock In/Out).
 * 1 File per Component
 */
export const SupervisorShiftHeader = () => {
  const { user, shiftAttendance, handleShiftClockIn, handleShiftClockOut } = useApp();

  const onClockIn = () => {
    handleShiftClockIn('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
    notifySuccess('Absen Masuk Shift Kerja Supervisor berhasil dicatat!');
  };

  const onClockOut = () => {
    handleShiftClockOut();
    notifySuccess('Absen Pulang Shift Kerja Supervisor berhasil dicatat. Sampai jumpa besok!');
  };

  return (
    <div className="bg-surface border border-border-glass rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar
            src={user?.avatar}
            name={user?.name || 'Ahmad Subagja'}
            size="lg"
            className="rounded-2xl ring-2 ring-primary/30"
          />
          <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-surface" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tight">
              {user?.name || 'Ahmad Subagja'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <LuShieldCheck className="text-xs" />
              {user?.roleLabel || 'Supervisor Operasional'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-1">
            <LuMapPin className="text-xs text-primary shrink-0" />
            <span>Wilayah Tugas: <strong className="text-on-surface font-semibold">Klaster Cimahi, Padalarang & Lembang</strong></span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-surface-variant/30 p-3.5 rounded-2xl border border-border-glass">
        <div className="text-right">
          <p className="text-[11px] text-on-surface-variant font-medium">Status Presensi Shift SPV</p>
          <p className={`text-xs font-bold ${shiftAttendance.clockedIn ? 'text-emerald-600' : 'text-amber-600'}`}>
            {shiftAttendance.clockedIn ? `Masuk: ${shiftAttendance.clockInTime}` : 'Belum Absen Masuk Shift'}
          </p>
        </div>
        {!shiftAttendance.clockedIn ? (
          <button
            type="button"
            onClick={onClockIn}
            className="px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <LuCamera className="text-base" />
            <span>Clock In Shift</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClockOut}
            className="px-3.5 py-2.5 bg-surface border border-border-glass text-on-surface text-xs font-bold rounded-xl hover:bg-surface-variant transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LuClock className="text-base text-on-surface-variant" />
            <span>Clock Out Shift</span>
          </button>
        )}
      </div>
    </div>
  );
};
