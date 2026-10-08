import React from 'react';
import {SalesViewTab} from '../RoutePlanning/components/SalesViewTab';
export function SalesSchedulePage(){
  return <div className="workspace-page sales-workspace"><header className="sales-heading"><div><p className="admin-eyebrow">Sales / Rencana penugasan</p><h1>Jadwal kunjungan</h1><p>Periksa PJP Anda per tanggal. Presensi dan order dilakukan melalui Kunjungan hari ini.</p></div></header><SalesViewTab/></div>;
}
