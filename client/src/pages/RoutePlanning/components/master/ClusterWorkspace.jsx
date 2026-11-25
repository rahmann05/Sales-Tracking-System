import { useFeaturePolicy } from '../../../../shared/hooks/useFeaturePolicy';
import React, { useDeferredValue, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { TAB_IDS } from '../../../../constants/navigation';
import { useWorkspaceState } from '../../../../shared/hooks/useWorkspaceState';
import { setWorkspaceValues } from '../../../../shared/utils/workspaceNavigation';

export function ClusterWorkspace({ management: m, onEdit, onOutlets, onOpenPlanner, onOpenTeam }) {
  const featurePolicy = useFeaturePolicy('CLUSTERS');
  const { user, setActiveTab } = useApp();
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [selected, setSelected] = useWorkspaceState('clusterId', '');
  const deferredQuery = useDeferredValue(query);
  const canManage =
    ['ADMIN', 'SUPERVISOR'].includes(user.role) && user.permissions?.can_manage_clusters !== false;
  const canPlan =
    ['ADMIN', 'SUPERVISOR'].includes(user.role) && user.permissions?.can_manage_rjp !== false;
  const canInspectOutlets =
    ['ADMIN', 'SUPERVISOR'].includes(user.role) &&
    (user.permissions?.can_manage_outlets !== false ||
      Boolean(user.permissions?.can_validate_outlet));
  const clusters = m.masterClusters || [];
  const stats = m.stats || { totalAllocated: 0, totalOutlets: 0 };
  const visible = clusters
    .filter((c) => {
      if (filterMode === 'NEEDS_PIC') {
        return c.name !== 'Belum Ditugaskan' && (!c.supervisorId || !c.assignedSalesId);
      }
      if (filterMode === 'GENERAL_TRADE' || filterMode === 'MODERN_TRADE') {
        return c.tradeType === filterMode;
      }
      return true;
    })
    .filter((c) =>
      `${c.name} ${c.code} ${c.region} ${c.assignedSpvName} ${c.assignedSalesName}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase())
    );
  const current = visible.find((c) => c.id === selected) || visible[0];
  const currentOutlets = current
    ? (m.coverageOutlets || []).filter((o) =>
        o.clusterId ? o.clusterId === current.id : o.clusterName === current.name
      )
    : [];
  const needsCheckCount = currentOutlets.filter(
    (o) => o.hasOperationalPoint === false || (o.issues && o.issues.length > 0)
  ).length;
  const openOutletDetail = (outletId) => {
    if (typeof window !== 'undefined' && window.location?.href) {
      setWorkspaceValues({ outletId }, { tab: TAB_IDS.OUTLET_MANAGEMENT });
    }
    setActiveTab?.(TAB_IDS.OUTLET_MANAGEMENT);
  };
  const needsPicCount = clusters.filter(
    (c) => c.name !== 'Belum Ditugaskan' && (!c.supervisorId || !c.assignedSalesId)
  ).length;
  return (
    <section className="cluster-workspace">
      <div className="planner-intro">
        <div>
          <h2>Wilayah dan penanggung jawab</h2>
          <p>
            Kelompokkan outlet berdasarkan wilayah dan jenis perdagangan, lalu jadwalkan langsung ke
            Jadwal kunjungan.
          </p>
        </div>
        {canManage && (
          <div className="app-actions">
            {onOpenTeam && (
              <button type="button" className="admin-button" onClick={onOpenTeam}>
                Atur tim &amp; Sales
              </button>
            )}
            <button
              type="button"
              className="admin-button"
              disabled={!featurePolicy.canStart}
              title={featurePolicy.reason}
              onClick={() => m.setIsImportModalOpen(true)}
            >
              Impor outlet
            </button>
            <button
              type="button"
              className="admin-button primary"
              disabled={!featurePolicy.canStart}
              title={featurePolicy.reason}
              onClick={() => setActiveTab(TAB_IDS.CREATE_CLUSTER)}
            >
              Buat cluster dari peta
            </button>
          </div>
        )}
      </div>
      <div className="planner-metrics">
        <div>
          <span>Cluster terdaftar</span>
          <strong>{clusters.filter((c) => c.name !== 'Belum Ditugaskan').length}</strong>
        </div>
        <div>
          <span>Outlet dalam wilayah</span>
          <strong>
            {stats.totalAllocated}/{stats.totalOutlets}
          </strong>
        </div>
        <div>
          <span>Cluster perlu penanggung jawab</span>
          <strong>{needsPicCount}</strong>
        </div>
      </div>
      {m.error && (
        <p role="alert" className="admin-feedback error">
          {m.error}
          <button type="button" className="admin-button" onClick={m.reload}>
            Muat ulang
          </button>
        </p>
      )}
      <div className="cluster-workspace-columns">
        <section className="admin-panel">
          <div className="planner-panel-body">
            <label className="app-field">
              Cari wilayah
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cluster, Sales, atau Supervisor"
              />
            </label>
            <div className="cluster-scope-pills" role="group" aria-label="Saring wilayah">
              <button
                type="button"
                className="cluster-pill"
                aria-pressed={filterMode === 'ALL'}
                onClick={() => setFilterMode('ALL')}
              >
                Semua ({clusters.length})
              </button>
              <button
                type="button"
                className="cluster-pill"
                aria-pressed={filterMode === 'NEEDS_PIC'}
                onClick={() => setFilterMode('NEEDS_PIC')}
              >
                Perlu PIC ({needsPicCount})
              </button>
              <button
                type="button"
                className="cluster-pill"
                aria-pressed={filterMode === 'GENERAL_TRADE'}
                onClick={() => setFilterMode('GENERAL_TRADE')}
              >
                GT
              </button>
              <button
                type="button"
                className="cluster-pill"
                aria-pressed={filterMode === 'MODERN_TRADE'}
                onClick={() => setFilterMode('MODERN_TRADE')}
              >
                MT
              </button>
            </div>
          </div>
          <div className="cluster-directory">
            {visible.map((c) => (
              <button
                type="button"
                key={c.id}
                aria-pressed={current?.id === c.id}
                onClick={() => setSelected(c.id)}
              >
                <div className="cluster-dir-title">
                  <span
                    className="cluster-color-dot"
                    style={{ backgroundColor: c.colorHex || '#1b66ca' }}
                    aria-hidden="true"
                  />
                  <strong>{c.name}</strong>
                  {c.tradeType && (
                    <span className="cluster-trade-tag">
                      {c.tradeType === 'MODERN_TRADE'
                        ? 'MT'
                        : c.tradeType === 'MIXED'
                          ? 'Mix'
                          : 'GT'}
                    </span>
                  )}
                </div>
                <span>
                  {c.region} · {c.allocatedOutletsCount} outlet
                </span>
                <small>
                  {c.assignedSalesName} · {c.assignedSpvName}
                </small>
                {(!c.assignedSalesId || !c.supervisorId) && c.name !== 'Belum Ditugaskan' && (
                  <em>Penugasan belum lengkap</em>
                )}
              </button>
            ))}
            {m.loading && (
              <p role="status" className="app-empty">
                Memuat wilayah…
              </p>
            )}
            {!m.loading && !visible.length && (
              <p className="app-empty">
                {query || filterMode !== 'ALL'
                  ? 'Tidak ada wilayah sesuai pencarian atau filter.'
                  : 'Belum ada wilayah. Buat cluster pertama untuk mengelompokkan outlet.'}
              </p>
            )}
          </div>
        </section>
        <section className="admin-panel planner-panel-body cluster-detail-panel">
          {current ? (
            <>
              <div className="planner-status-line">
                <div className="cluster-detail-title">
                  <span
                    className="cluster-color-dot"
                    style={{ backgroundColor: current.colorHex || '#1b66ca' }}
                    aria-hidden="true"
                  />
                  <h2>{current.name}</h2>
                </div>
                <span>{current.code}</span>
              </div>
              <dl className="cluster-summary">
                <dt>Region</dt>
                <dd>{current.region}</dd>
                <dt>Jenis perdagangan</dt>
                <dd>
                  {current.tradeType === 'GENERAL_TRADE'
                    ? 'General Trade'
                    : current.tradeType === 'MODERN_TRADE'
                      ? 'Modern Trade'
                      : current.tradeType === 'MIXED'
                        ? 'Campuran · perlu diperbaiki'
                        : 'Belum ada outlet'}
                </dd>
                <dt>Supervisor</dt>
                <dd>{current.assignedSpvName}</dd>
                <dt>Sales penanggung jawab</dt>
                <dd>{current.assignedSalesName}</dd>
                <dt>Anggota outlet</dt>
                <dd>{current.allocatedOutletsCount}</dd>
              </dl>
              {current.name !== 'Belum Ditugaskan' &&
                (!current.supervisorId || !current.assignedSalesId) &&
                canManage && (
                  <div className="cluster-inline-callout">
                    <span>
                      Lengkapi Supervisor &amp; Sales penanggung jawab agar outlet cluster ini siap
                      dijadwalkan ke Jadwal kunjungan.
                    </span>
                    <button type="button" className="admin-button" onClick={() => onEdit(current)}>
                      Tetapkan PIC
                    </button>
                  </div>
                )}
              {canManage && (
                <fieldset
                  disabled={!!m.error || m.loading || !!m.deletingId || !featurePolicy.canStart}
                >
                  <div className="app-actions">
                    {canPlan &&
                      onOpenPlanner &&
                      current.name !== 'Belum Ditugaskan' &&
                      current.supervisorId && (
                        <button
                          type="button"
                          className="admin-button primary"
                          onClick={() => onOpenPlanner(current)}
                        >
                          Susun jadwal PJP
                        </button>
                      )}
                    <button
                      type="button"
                      className="admin-button"
                      onClick={() => onOutlets(current)}
                    >
                      Kelola anggota outlet
                    </button>
                    <button
                      type="button"
                      className="admin-button"
                      disabled={current.name === 'Belum Ditugaskan'}
                      onClick={() => onEdit(current)}
                    >
                      Edit penanggung jawab
                    </button>
                    <button
                      type="button"
                      className="admin-button"
                      disabled={
                        current.name === 'Belum Ditugaskan' ||
                        current.allocatedOutletsCount > 0 ||
                        !!current.assignedSalesId
                      }
                      onClick={() => {
                        if (window.confirm(`Hapus cluster kosong ${current.name}?`))
                          m.handleDeleteCluster(current.id);
                      }}
                    >
                      Hapus cluster kosong
                    </button>
                  </div>
                </fieldset>
              )}
              <div className="cluster-outlet-members">
                <div className="cluster-outlet-members-head">
                  <h3>Daftar outlet dalam cluster</h3>
                  <span>
                    {currentOutlets.length} outlet
                    {needsCheckCount > 0 ? ` · ${needsCheckCount} perlu cek` : ''}
                  </span>
                </div>
                {currentOutlets.length > 0 ? (
                  <ol className="cluster-outlet-list">
                    {currentOutlets.map((outlet, index) => {
                      const hasGap =
                        outlet.hasOperationalPoint === false ||
                        (outlet.issues && outlet.issues.length > 0);
                      return (
                        <li key={outlet.id}>
                          <span className="cluster-outlet-index">{index + 1}</span>
                          <div className="cluster-outlet-meta">
                            <div className="cluster-outlet-title-row">
                              <strong>{outlet.name}</strong>
                              <span className="cluster-outlet-code">
                                {outlet.outletCode || 'Tanpa kode'}
                              </span>
                            </div>
                            <small>{outlet.address || 'Alamat belum tercatat'}</small>
                            {hasGap && (
                              <small className="cluster-outlet-flag">
                                {outlet.hasOperationalPoint === false
                                  ? 'Titik GPS belum tersedia'
                                  : 'Perlu pemeriksaan kualitas data'}
                              </small>
                            )}
                          </div>
                          {canInspectOutlets && (
                            <button
                              type="button"
                              className="admin-button cluster-outlet-open-btn"
                              onClick={() => openOutletDetail(outlet.id)}
                            >
                              Buka outlet
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="app-empty">Belum ada outlet yang tergabung di cluster ini.</p>
                )}
              </div>
            </>
          ) : (
            <p className="app-empty">Pilih wilayah untuk melihat rincian dan penugasannya.</p>
          )}
        </section>
      </div>
    </section>
  );
}
