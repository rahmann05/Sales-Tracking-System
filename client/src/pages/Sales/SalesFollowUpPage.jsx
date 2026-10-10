import React from 'react';
import {FollowUpPanel} from '../../shared/components/common/FollowUpPanel';
import {OutletFieldTasks} from './OutletFieldTasks';
export function SalesFollowUpPage(){
  return <div className="workspace-page sales-workspace"><header className="sales-heading"><div><p className="admin-eyebrow">Sales / Arahan dan temuan</p><h1>Tindak lanjut</h1><p>Selesaikan arahan kunjungan, kirim hasil beserta bukti, lalu pantau pemeriksaannya.</p></div></header><OutletFieldTasks/><FollowUpPanel/></div>;
}
