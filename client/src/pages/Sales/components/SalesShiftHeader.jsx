import React from 'react';
import {useApp} from '../../../context/AppContext';
import {ShiftAttendanceWidget} from '../../../shared/components/common/ShiftAttendanceWidget';
export function SalesShiftHeader(){
  const {user,clusters=[]}=useApp();
  const territory=typeof user.cluster==='string'?user.cluster:user.cluster?.name;
  const assigned=clusters.filter(c=>c.id===user.clusterId||c.assignedSalesId===user.id).map(c=>c.name).filter(Boolean);
  return <section className="sales-panel sales-shift"><div><p className="admin-eyebrow">Presensi shift Anda</p><h2>{user.name}</h2><p>{[territory||[...new Set(assigned)].join(', '),user.region].filter(Boolean).join(' · ')||'Informasi wilayah belum tersedia'}</p></div><ShiftAttendanceWidget/></section>;
}
