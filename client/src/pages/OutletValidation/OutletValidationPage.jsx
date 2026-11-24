import React from 'react';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
import { OutletValidationPanel } from './components/OutletValidationPanel';
import '../../styles/pages/OutletWorkspace.css';
import '../../styles/pages/OutletValidation.css';

export function OutletValidationPage() {
  const { user, setActiveTab } = useApp();
  const canManageOutlets = ['ADMIN', 'SUPERVISOR'].includes(user?.role)
    ? user.permissions?.can_manage_outlets !== false
    : Boolean(user?.permissions?.can_manage_outlets);
  const canAccessRjp =
    ['ADMIN', 'SUPERVISOR'].includes(user?.role) && user.permissions?.can_access_rjp !== false;
  return (
    <main className="workspace-page outlet-workspace">
      <header className="outlet-page-heading">
        <div>
          <p className="outlet-eyebrow">Pelanggan / Pemeriksaan &amp; kualitas data</p>
          <h1>Validasi outlet</h1>
          <p>
            Cocokkan data dengan Google, tugaskan verifikasi Sales lapangan bila diperlukan, lalu
            perbarui master &amp; titik PJP secara sinkron.
          </p>
        </div>
        <div className="app-actions">
          {canManageOutlets && (
            <button
              type="button"
              className="app-button"
              onClick={() => setActiveTab?.(TAB_IDS.OUTLET_MANAGEMENT)}
            >
              Master outlet
            </button>
          )}
          {canAccessRjp && (
            <button
              type="button"
              className="app-button"
              onClick={() => setActiveTab?.(TAB_IDS.ROUTE_PLANNING)}
            >
              Wilayah &amp; PJP
            </button>
          )}
        </div>
      </header>
      <OutletValidationPanel />
    </main>
  );
}
