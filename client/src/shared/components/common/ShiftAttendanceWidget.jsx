import React from 'react';
import { useApp } from '../../../context/AppContext';

export function ShiftAttendanceWidget() {
  const { shiftAttendance: shift, shiftBusy, shiftError, handleShiftClockIn, handleShiftClockOut, settings } = useApp();
  return <section className="rounded-xl border border-border-glass p-3 bg-surface-container space-y-2">
    <div className="flex flex-wrap items-center gap-3 justify-between">
      <div><p className="font-semibold text-sm">Shift hari ini</p><p className="text-sm text-on-surface-variant">{shift.clockOutTime ? `Selesai ${shift.clockOutTime} WIB` : shift.clockedIn ? `Masuk ${shift.clockInTime} WIB` : `Belum masuk · Jadwal ${settings.SHIFT_START_TIME} WIB`}</p></div>
      {!shift.clockOutTime && <button className="btn btn-primary min-h-11" disabled={shiftBusy} onClick={shift.clockedIn ? handleShiftClockOut : handleShiftClockIn}>{shiftBusy ? 'Menyimpan…' : shift.clockedIn ? 'Akhiri shift' : 'Mulai shift'}</button>}
    </div>
    {shiftError && <p role="alert" className="text-sm text-red-600">{shiftError}</p>}
  </section>;
}
