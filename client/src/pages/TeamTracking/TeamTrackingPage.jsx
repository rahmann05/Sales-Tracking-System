import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
import { TeamAssignmentPanel } from '../RoutePlanning/components/TeamAssignmentPanel';
import { LiveSalesGpsTrackingTab } from './components/LiveSalesGpsTrackingTab';

export function TeamTrackingPage() {
  const { user, setActiveTab } = useApp();
  const [tab, setTab] = useState('members');
  const canLiveTracking =
    user.role === 'ADMIN' ||
    (user.role === 'SUPERVISOR' && user.permissions?.can_view_live_tracking !== false);
  const activeView = canLiveTracking ? tab : 'members';

  return (
    <div className="page-container workspace-page space-y-6">
      <header className="workspace-heading">
        <div>
          <h1>{user.role === 'SUPERVISOR' ? 'Tim sales saya' : 'Tim sales & penugasan'}</h1>
          <p>
            Kelola keanggotaan tim. Penugasan wilayah dan rencana kunjungan tersedia di Wilayah
            &amp; jadwal RJP.
          </p>
        </div>
        <div className="app-actions">
          <button
            type="button"
            className="app-button"
            onClick={() => setActiveTab(TAB_IDS.ROUTE_PLANNING)}
          >
            Wilayah &amp; jadwal RJP
          </button>
          {user.role === 'ADMIN' && (
            <button
              type="button"
              className="app-button"
              onClick={() => setActiveTab(TAB_IDS.USER_MANAGEMENT)}
            >
              Kelola akun pengguna
            </button>
          )}
        </div>
      </header>
      {canLiveTracking && (
        <nav className="app-actions" aria-label="Tampilan tim">
          <button
            type="button"
            className={`app-button ${activeView === 'members' ? 'app-button-primary' : ''}`}
            aria-pressed={activeView === 'members'}
            onClick={() => setTab('members')}
          >
            Anggota &amp; penugasan
          </button>
          <button
            type="button"
            className={`app-button ${activeView === 'tracking' ? 'app-button-primary' : ''}`}
            aria-pressed={activeView === 'tracking'}
            onClick={() => setTab('tracking')}
          >
            Posisi sales
          </button>
        </nav>
      )}
      {activeView === 'members' ? (
        <TeamAssignmentPanel
          onChanged={() => window.dispatchEvent(new CustomEvent('operational-data-changed'))}
        />
      ) : (
        <LiveSalesGpsTrackingTab />
      )}
    </div>
  );
}
