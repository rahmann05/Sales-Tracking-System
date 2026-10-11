import React from 'react';
import {ShiftAttendanceWidget} from '../../../shared/components/common/ShiftAttendanceWidget';
import {useApp} from '../../../context/AppContext';
export function SupervisorShiftHeader(){
  const {user}=useApp();
  return <section className="spv-panel spv-shift"><div><p className="admin-eyebrow">Presensi shift Anda</p><h2>{user?.name}</h2><p>Kelola presensi dan selesaikan shift yang masih aktif.</p></div><ShiftAttendanceWidget/></section>;
}
