import React from 'react';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor',
  SALES: 'Sales',
  KEPALA_GUDANG: 'Kepala Gudang',
  SUPIR: 'Supir',
};

export function DemoAccountSwitcher({
  accounts,
  currentUser,
  busyAction,
  onSwitchUser,
  onSyncPjp,
}) {
  if (!accounts.length) {
    return (
      <div className="demo-empty">
        Belum ada akun aktif pada database lokal. Pastikan seed/data lokal sudah terisi.
      </div>
    );
  }

  return (
    <div className="demo-stack">
      <div className="demo-toolbar-row">
        <span className="demo-hint">
          Pilih akun untuk pindah peran secara instan dengan JWT asli.
        </span>
        <button
          type="button"
          className="demo-btn-secondary"
          disabled={Boolean(busyAction)}
          onClick={() => onSyncPjp(null, false)}
        >
          Sync Semua PJP
        </button>
      </div>

      <div className="demo-account-list">
        {accounts.map((acc) => {
          const isCurrent = currentUser?.id === acc.id;
          const switching = busyAction === `switch:${acc.id}`;
          const syncing = busyAction === `sync:${acc.id}`;
          return (
            <div
              key={acc.id}
              className={`demo-account-card ${isCurrent ? 'demo-account-card--active' : ''}`}
            >
              <div className="demo-account-meta">
                <div className="demo-account-title-row">
                  <span className={`demo-role-badge demo-role-badge--${acc.role}`}>
                    {ROLE_LABELS[acc.role] || acc.role}
                  </span>
                  <strong className="demo-account-name">{acc.name}</strong>
                  {isCurrent && <span className="demo-active-chip">Aktif</span>}
                </div>
                <div className="demo-account-sub">
                  <span>{acc.email}</span>
                  {acc.cluster?.name && <span>Cluster: {acc.cluster.name}</span>}
                  {acc.supervisor?.name && <span>SPV: {acc.supervisor.name}</span>}
                </div>
              </div>

              <div className="demo-account-actions">
                {acc.role === 'SALES' && (
                  <button
                    type="button"
                    className="demo-btn-secondary"
                    disabled={Boolean(busyAction)}
                    onClick={() => onSyncPjp(acc.id, true)}
                    title="Bangun ulang PJP hari ini dari cluster terbaru (bila belum ada absensi/order)"
                  >
                    {syncing ? 'Menyinkronkan...' : 'Sync PJP'}
                  </button>
                )}
                <button
                  type="button"
                  className="demo-btn-primary"
                  disabled={Boolean(busyAction) || isCurrent}
                  onClick={() => onSwitchUser(acc.id)}
                >
                  {isCurrent ? 'Sedang Dipakai' : switching ? 'Memindahkan...' : 'Pakai Akun'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
