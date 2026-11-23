import { OperationalIssues } from '../Warehouse/components/OperationalIssues';
import React from 'react';
import { FollowUpPanel } from '../../shared/components/common/FollowUpPanel';
import { OutletFieldTasks } from './OutletFieldTasks';
export function SalesFollowUpPage() {
  return (
    <div className="workspace-page sales-workspace">
      <header className="sales-heading">
        <div>
          <p className="admin-eyebrow">Sales / Arahan dan temuan</p>
          <h1>Perlu tindakan</h1>
          <p>
            Kerjakan arahan dari supervisor di lokasi outlet menggunakan verifikasi titik GPS dan
            kamera langsung, lalu kirim hasilnya untuk diperiksa.
          </p>
        </div>
      </header>
      <OutletFieldTasks />
      <FollowUpPanel />
      <OperationalIssues />
    </div>
  );
}
