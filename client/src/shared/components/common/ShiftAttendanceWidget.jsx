import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ShiftEvidenceDialog } from './ShiftEvidenceDialog';
import { shiftDateKey } from '../../../../../shared/shift-policy.mjs';
import { CONFIG_DEFAULTS } from '../../../../../shared/config.mjs';
import { useDomainPermission } from '../../hooks/useDomainPermission';
import '../../../styles/common/ShiftAttendanceWidget.css';

export function ShiftAttendanceWidget() {
  const canStart = useDomainPermission('START_SHIFT');
  const {
    shiftAttendance: shift,
    shiftBusy,
    shiftError,
    handleShiftClockIn,
    handleShiftClockOut,
    settings,
  } = useApp();
  const [dialog, setDialog] = useState(false);
  const values = shift.clockedIn ? { ...CONFIG_DEFAULTS, ...shift.policyValues } : settings;
  const dateKey = shift.clockedIn
    ? shift.dateKey
    : shiftDateKey(Date.now(), values.SHIFT_DAY_CUTOFF_TIME || '00:00');
  const action = shift.clockedIn ? 'SHIFT_OUT' : 'SHIFT_IN',
    handler = shift.clockedIn ? handleShiftClockOut : handleShiftClockIn;
  const start = () => setDialog(true);
  if (settings.FEATURE_SHIFT_MODE === 'OFF' && !shift.clockedIn) return null;

  const dotModifier = shift.clockOutTime
    ? 'shift-widget-dot-done'
    : shift.clockedIn
      ? 'shift-widget-dot-active'
      : 'shift-widget-dot-idle';

  return (
    <div className="shift-widget">
      <div className="shift-widget-status">
        <span className={`shift-widget-dot ${dotModifier}`} aria-hidden="true" />
        <div className="shift-widget-meta">
          <p className="shift-widget-date">Shift · {dateKey} WIB</p>
          <p className="shift-widget-state">
            {shift.finished && !shift.clockOutTime
              ? 'Kegiatan shift selesai (tanpa bukti keluar)'
              : shift.clockOutTime
                ? `Selesai · ${shift.clockOutTime} WIB`
                : shift.clockedIn
                  ? shift.clockInTime
                    ? `Aktif · Masuk ${shift.clockInTime} WIB`
                    : 'Kegiatan shift aktif (tanpa bukti masuk)'
                  : `Belum Masuk · Jadwal ${settings?.SHIFT_START_TIME || '08:00'} WIB`}
          </p>
        </div>
      </div>

      {!shift.finished && (shift.clockedIn || canStart) && (
        <button
          type="button"
          disabled={
            shiftBusy ||
            (!shift.clockedIn && ['PAUSED', 'OFF'].includes(settings.FEATURE_SHIFT_MODE))
          }
          onClick={start}
          className={`app-button ${shift.clockedIn ? 'shift-widget-btn-end' : 'app-button-primary'}`}
        >
          {shiftBusy ? 'Menyimpan…' : shift.clockedIn ? 'Akhiri Shift' : 'Mulai Shift'}
        </button>
      )}

      {shiftError && (
        <p role="alert" className="app-error shift-widget-error">
          {shiftError}
        </p>
      )}
      {dialog && (
        <ShiftEvidenceDialog
          action={action}
          dateKey={dateKey}
          values={values}
          busy={shiftBusy}
          error={shiftError}
          onClose={() => setDialog(false)}
          onConfirm={handler}
        />
      )}
    </div>
  );
}
