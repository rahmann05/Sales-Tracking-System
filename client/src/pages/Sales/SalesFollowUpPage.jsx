import {OperationalIssues} from '../Warehouse/components/OperationalIssues';
import React from 'react';
import {FollowUpPanel} from '../../shared/components/common/FollowUpPanel';
import {OutletFieldTasks} from './OutletFieldTasks';
export function SalesFollowUpPage(){
  return <div className="workspace-page sales-workspace"><header className="sales-heading"><div><p className="admin-eyebrow">Sales / Arahan dan temuan</p><h1>Perlu tindakan</h1><p>Kerjakan arahan dari supervisor. Kunjungan fisik yang dijadwalkan dibuka melalui agenda; komunikasi atau perbaikan data cukup dicatat hasilnya di sini.</p></div></header><OutletFieldTasks/><FollowUpPanel/><OperationalIssues/></div>;
}
