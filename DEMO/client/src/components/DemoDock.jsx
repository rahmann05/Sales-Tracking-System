import React from 'react';
import { useDemoController } from '../hooks/useDemoController';
import { DemoAccountSwitcher } from './DemoAccountSwitcher';
import { DemoConstraintPanel } from './DemoConstraintPanel';
import { DemoScenarioGuide } from './DemoScenarioGuide';

export function DemoDock() {
  const demo = useDemoController();
  const dbTarget = demo.status?.database?.target || 'localhost';

  return (
    <aside className="demo-dock-root" aria-label="Panel Kontrol Mode Demo">
      <button
        type="button"
        className="demo-dock-trigger"
        onClick={demo.toggleOpen}
        aria-expanded={demo.open}
      >
        <span className="demo-pill-badge">MODE DEMO</span>
        <span className="demo-trigger-user">
          {demo.currentUser ? `${demo.currentUser.role}: ${demo.currentUser.name}` : 'Belum Login'}
        </span>
      </button>

      {demo.open && (
        <section className="demo-dock-panel">
          <header className="demo-dock-header">
            <div>
              <div className="demo-dock-heading">Panel Pengujian Lintas Peran</div>
              <div className="demo-dock-sub">DB Lokal: {dbTarget}</div>
            </div>
            <div className="demo-header-actions">
              <button
                type="button"
                className="demo-btn-secondary"
                disabled={demo.loading}
                onClick={demo.reload}
              >
                Muat Ulang
              </button>
              <button type="button" className="demo-btn-secondary" onClick={demo.toggleOpen}>
                Tutup
              </button>
            </div>
          </header>

          {demo.notice && (
            <div className={`demo-notice demo-notice--${demo.notice.type}`}>{demo.notice.text}</div>
          )}

          <nav className="demo-tabs" aria-label="Tab Mode Demo">
            <button
              type="button"
              className={`demo-tab ${demo.tab === 'accounts' ? 'demo-tab--active' : ''}`}
              onClick={() => demo.selectTab('accounts')}
            >
              Pindah Akun ({demo.accounts.length})
            </button>
            <button
              type="button"
              className={`demo-tab ${demo.tab === 'scenarios' ? 'demo-tab--active' : ''}`}
              onClick={() => demo.selectTab('scenarios')}
            >
              Skenario Uji
            </button>
            <button
              type="button"
              className={`demo-tab ${demo.tab === 'constraints' ? 'demo-tab--active' : ''}`}
              onClick={() => demo.selectTab('constraints')}
            >
              Constraint & Guardrail
            </button>
          </nav>

          <div className="demo-dock-body">
            {demo.tab === 'accounts' && (
              <DemoAccountSwitcher
                accounts={demo.accounts}
                currentUser={demo.currentUser}
                busyAction={demo.busyAction}
                onSwitchUser={demo.switchToUser}
                onSyncPjp={demo.syncPjpForSales}
              />
            )}
            {demo.tab === 'scenarios' && (
              <DemoScenarioGuide
                scenarios={demo.status?.scenarios}
                accounts={demo.accounts}
                busyAction={demo.busyAction}
                onSwitchUser={demo.switchToUser}
              />
            )}
            {demo.tab === 'constraints' && (
              <DemoConstraintPanel
                groups={demo.status?.groups}
                policy={demo.status?.policy}
                guardrails={demo.status?.guardrails}
                busyAction={demo.busyAction}
                onToggleGroup={demo.toggleGroup}
                onEnableAll={demo.enableAllGroups}
                onRestoreNormal={demo.restoreNormalPolicy}
              />
            )}
          </div>
        </section>
      )}
    </aside>
  );
}
