import { useState, useEffect, useCallback } from 'react';
import { staffAttendanceApi } from '../../services/api';
const emptyShift = { clockedIn: false, clockInTime: null, clockOutTime: null };
const time = value => value ? new Date(value).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : null;
const mapShift = record => record ? { clockedIn: !record.checkOutAt&&record.checklist?.state!=='FINISHED',finished:Boolean(record.checkOutAt||record.checklist?.state==='FINISHED'), clockInTime: record.checklist?.startKind==='BUSINESS_START'?null:time(record.checkInAt), clockOutTime: time(record.checkOutAt), lateMinutes: record.lateMinutes,dateKey:record.dateKey,policyValues:record.policySnapshot?.values } : emptyShift;
export function useShiftAttendance(user) {
  const [shiftAttendance, setShiftAttendance] = useState(emptyShift);
  const [shiftBusy, setBusy] = useState(false);
  const [shiftError, setError] = useState('');
  useEffect(() => {
    let active = true;
    setShiftAttendance(emptyShift); setError('');
    if (!user?.id) return;
    const load = async () => {
      try {
        const res = await staffAttendanceApi.getToday();
        if (active) setShiftAttendance(mapShift(res.data.find(r => r.kind === 'SHIFT'&&!r.checkOutAt&&r.checklist?.state!=='FINISHED')||res.data.filter(r=>r.kind==='SHIFT').at(-1)));
      } catch (error) { if (active) setError(error.message); }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [user?.id]);
  const submit = useCallback(async (action,evidence={}) => {
    setBusy(true); setError('');
    try { const res = await staffAttendanceApi.record({ action,...evidence }); setShiftAttendance(mapShift(res.data));return true; }
    catch (error) { setError(error.message);return false; }
    finally { setBusy(false); }
  }, []);
  return { shiftAttendance, shiftBusy, shiftError, handleShiftClockIn: evidence => submit('SHIFT_IN',evidence), handleShiftClockOut: evidence => submit('SHIFT_OUT',evidence) };
}
