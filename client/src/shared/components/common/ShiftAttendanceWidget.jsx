import React from 'react';
import { useApp } from '../../../context/AppContext';

export function ShiftAttendanceWidget() {
  const { shiftAttendance: shift, shiftBusy, shiftError, handleShiftClockIn, handleShiftClockOut, settings } = useApp();

  return (
    <div className="rounded-2xl border border-border-glass p-3 sm:px-4 sm:py-3 bg-surface-container/50 shadow-xs flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            shift.clockOutTime
              ? 'bg-slate-400'
              : shift.clockedIn
              ? 'bg-emerald-500 animate-pulse'
              : 'bg-amber-400'
          }`}
        />
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            Shift Hari Ini
          </p>
          <p className="text-xs font-semibold text-on-surface truncate">
            {shift.clockOutTime
              ? `Selesai · ${shift.clockOutTime} WIB`
              : shift.clockedIn
              ? `Aktif · Masuk ${shift.clockInTime} WIB`
              : `Belum Masuk · Jadwal ${settings?.SHIFT_START_TIME || '08:00'} WIB`}
          </p>
        </div>
      </div>

      {!shift.clockOutTime && (
        <button
          type="button"
          disabled={shiftBusy}
          onClick={shift.clockedIn ? handleShiftClockOut : handleShiftClockIn}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50 ${
            shift.clockedIn
              ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20'
              : 'bg-primary hover:bg-primary/90 text-on-primary'
          }`}
        >
          {shiftBusy ? 'Menyimpan…' : shift.clockedIn ? 'Akhiri Shift' : 'Mulai Shift'}
        </button>
      )}

      {shiftError && (
        <p role="alert" className="text-xs text-rose-600 w-full mt-1">
          {shiftError}
        </p>
      )}
    </div>
  );
}
