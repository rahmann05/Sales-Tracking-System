import React from 'react';
import {useApp} from '../../../context/AppContext';
import {ShiftAttendanceWidget} from '../../../shared/components/common/ShiftAttendanceWidget';
export function SalesShiftHeader(){
  const {user}=useApp();
  const territory=typeof user.cluster==='string'?user.cluster:user.cluster?.name;
  return <section className="sales-panel sales-shift"><div><p className="admin-eyebrow">Presensi shift Anda</p><h2>{user.name}</h2><p>{[territory,user.region].filter(Boolean).join(' · ')||'Wilayah belum ditetapkan'}</p></div><ShiftAttendanceWidget/></section>;
}
