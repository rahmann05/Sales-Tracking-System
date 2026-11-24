import { workspaceChoice } from '../../../../../shared/workspace-presentation.mjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import { useApp } from '../../../context/AppContext';
import { clustersApi, outletValidationApi } from '../../../services/api';
import { confirmWorkspaceNavigation } from '../../../shared/utils/confirmWorkspaceNavigation';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useWorkspaceState } from '../../../shared/hooks/useWorkspaceState';
import {
  OUTLET_RESULT_LABELS,
  OUTLET_STAGE_LABELS,
  OUTLET_ISSUE_LABELS,
  outletIssues,
} from '../../../../../shared/outlet-validation.mjs';
import { stamp } from '../../OutletManagement/outletPresentation';
import { OutletFieldTaskMonitor } from './OutletFieldTaskMonitor';
import { OutletValidationDetail } from './OutletValidationDetail';
import { ValidationOutletPicker } from './ValidationOutletPicker';
import { OutletValidationJobs } from './OutletValidationJobs';
export function OutletValidationPanel() {
  const feature = useFeaturePolicy('OUTLET_REVIEW'),
    { user, settings, clusters: appClusters } = useApp();
  const [stage, setStage] = useWorkspaceState(
      'outletReviewStage',
      workspaceChoice('OUTLET_REVIEW_DEFAULT_STAGE', settings.OUTLET_REVIEW_DEFAULT_STAGE)
    ),
    [search, setSearch] = useWorkspaceState('outletReviewSearch', ''),
    [selected, setSelected] = useWorkspaceState('outletReview', ''),
    [issue, setIssue] = useWorkspaceState('outletReviewIssue', 'ALL'),
    [clusterFilter, setClusterFilter] = useWorkspaceState('outletReviewCluster', 'ALL'),
    [workspaceTab, setWorkspaceTab] = useWorkspaceState('outletValidationTab', 'QUEUE');
  const [page, setPage] = useState(1),
    [rows, setRows] = useState([]),
    [pagination, setPagination] = useState({ total: 0, totalPages: 1 }),
    [summary, setSummary] = useState(null),
    [fallbackClusters, setFallbackClusters] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [detail, setDetail] = useState(null),
    [picker, setPicker] = useState(false);
  const clusters =
    Array.isArray(appClusters) && appClusters.length > 0 ? appClusters : fallbackClusters;
  const debounced = useDebounce(search, 250),
    version = useRef(0);
  const load = useCallback(async () => {
    const v = ++version.current;
    setLoading(true);
    setError('');
    try {
      if (selected) {
        const r = await outletValidationApi.review(selected);
        if (v === version.current) setDetail(r.data);
      } else {
        const [r, s] = await Promise.all([
          outletValidationApi.reviews({
            status: 'ALL',
            stage,
            search: debounced,
            page,
            issue,
            clusterId: clusterFilter !== 'ALL' ? clusterFilter : undefined,
            limit: settings.WORKSPACE_PAGE_SIZE || 25,
          }),
          outletValidationApi.getSummary().catch(() => ({ data: null })),
        ]);
        if (v === version.current) {
          setRows(r.data);
          setPagination(r.pagination);
          if (s?.data) setSummary(s.data);
        }
      }
    } catch (e) {
      if (v === version.current) setError(e.message);
    } finally {
      if (v === version.current) setLoading(false);
    }
  }, [selected, stage, debounced, page, issue, clusterFilter, settings.WORKSPACE_PAGE_SIZE]);
  useEffect(() => {
    load();
    const onChanged = () => load();
    if (typeof window !== 'undefined')
      window.addEventListener('operational-data-changed', onChanged);
    return () => {
      version.current++;
      if (typeof window !== 'undefined')
        window.removeEventListener('operational-data-changed', onChanged);
    };
  }, [load]);
  useEffect(() => {
    if (Array.isArray(appClusters) && appClusters.length > 0) return;
    let live = true;
    clustersApi
      .getAll()
      .then((r) => {
        if (live) setFallbackClusters(r.data || []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [appClusters]);
  const select = (id) => {
    if (confirmWorkspaceNavigation()) {
      setDetail(null);
      setSelected(id);
    }
  };
  const filter = (setter, value) => {
    setter(value);
    setPage(1);
  };
  return (
    <div className="ov-workspace">
      {error && (
        <div role="alert" className="app-error">
          {error}{' '}
          <button type="button" className="app-button" onClick={load}>
            Coba lagi
          </button>
          {selected && (
            <button type="button" className="app-button" onClick={() => select('')}>
              Kembali ke antrean
            </button>
          )}
        </div>
      )}
      {selected ? (
        <>
          {loading && !detail ? (
            <p role="status" className="ov-notice">
              Memuat bukti kasus…
            </p>
          ) : (
            detail && (
              <OutletValidationDetail
                key={detail.id}
                review={detail}
                onRefresh={load}
                onClose={() => select('')}
              />
            )
          )}
        </>
      ) : (
        <>
          <div className="ov-toolbar">
            <nav className="ov-workspace-tabs" aria-label="Area validasi outlet">
              <button
                type="button"
                className={workspaceTab === 'QUEUE' ? 'is-active' : ''}
                aria-pressed={workspaceTab === 'QUEUE'}
                onClick={() => setWorkspaceTab('QUEUE')}
              >
                Antrean validasi
              </button>
              <button
                type="button"
                className={workspaceTab === 'FIELD' ? 'is-active' : ''}
                aria-pressed={workspaceTab === 'FIELD'}
                onClick={() => setWorkspaceTab('FIELD')}
              >
                Tugas lapangan
              </button>
              {user?.permissions?.can_run_outlet_review && (
                <button
                  type="button"
                  className={workspaceTab === 'JOBS' ? 'is-active' : ''}
                  aria-pressed={workspaceTab === 'JOBS'}
                  onClick={() => setWorkspaceTab('JOBS')}
                >
                  Riwayat batch
                </button>
              )}
            </nav>
            <button
              type="button"
              className="app-button app-button-primary"
              disabled={!feature.canStart}
              title={feature.reason}
              onClick={() => setPicker(true)}
            >
              + Pilih outlet untuk divalidasi
            </button>
          </div>
          {workspaceTab === 'QUEUE' && (
            <>
              {summary && (
                <div className="ov-summary-strip" role="region" aria-label="Ringkasan status kasus">
                  <button
                    type="button"
                    aria-pressed={stage === 'OPEN'}
                    onClick={() => filter(setStage, 'OPEN')}
                  >
                    <span>Belum diperiksa</span>
                    <strong>{summary.OPEN ?? 0}</strong>
                  </button>
                  <button
                    type="button"
                    aria-pressed={stage === 'WAITING_FIELD'}
                    onClick={() => filter(setStage, 'WAITING_FIELD')}
                  >
                    <span>Tugas lapangan aktif</span>
                    <strong>{summary.WAITING_FIELD ?? 0}</strong>
                  </button>
                  <button
                    type="button"
                    aria-pressed={stage === 'COMPLETED'}
                    onClick={() => filter(setStage, 'COMPLETED')}
                  >
                    <span>Selesai diverifikasi</span>
                    <strong>{summary.COMPLETED ?? 0}</strong>
                  </button>
                </div>
              )}
              <nav className="ov-stage-tabs" aria-label="Tahap pemeriksaan">
                {[
                  'ALL',
                  'OPEN',
                  'REVIEW',
                  'WAITING_FIELD',
                  'SUBMITTED',
                  'COMPLETED',
                  'CANCELLED',
                ].map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={stage === s ? 'is-active' : ''}
                    aria-pressed={stage === s}
                    onClick={() => filter(setStage, s)}
                  >
                    {s === 'ALL' ? 'Semua kasus' : OUTLET_STAGE_LABELS[s]}
                  </button>
                ))}
              </nav>
              <section className="ov-section">
                <div className="ov-filters">
                  <label className="app-field">
                    Cari outlet
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value, { replace: true });
                        setPage(1);
                      }}
                      placeholder="Nama, kode, atau alamat"
                    />
                  </label>
                  <label className="app-field">
                    Wilayah cluster
                    <select
                      value={clusterFilter}
                      onChange={(e) => filter(setClusterFilter, e.target.value)}
                    >
                      <option value="ALL">Semua wilayah</option>
                      {clusters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="app-field">
                    Masalah data
                    <select value={issue} onChange={(e) => filter(setIssue, e.target.value)}>
                      <option value="ALL">Semua masalah</option>
                      {Object.entries(OUTLET_ISSUE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="app-button" disabled={loading} onClick={load}>
                    Perbarui
                  </button>
                </div>
                <div
                  className="ov-table-wrap"
                  tabIndex={0}
                  role="region"
                  aria-label="Daftar kasus validasi outlet"
                >
                  <table className="ov-table ov-queue">
                    <caption role="status" aria-atomic="true">
                      {loading ? 'Memuat antrean…' : `${pagination.total} kasus sesuai filter`}
                    </caption>
                    <thead>
                      <tr>
                        <th>Outlet &amp; wilayah</th>
                        <th>Masalah data</th>
                        <th>Hasil Google</th>
                        <th>Tindakan berikutnya</th>
                        <th>Penanggung jawab / tenggat</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td data-label="Outlet &amp; wilayah">
                            <strong>{r.outlet.name}</strong>
                            <small>
                              {r.outlet.outletCode || 'Tanpa kode'} · {r.outlet.cluster?.name}
                              {r.outlet.cluster?.assignedSales?.name
                                ? ` · ${r.outlet.cluster.assignedSales.name}`
                                : ''}
                            </small>
                            <small>{r.outlet.address}</small>
                          </td>
                          <td data-label="Masalah data">
                            {outletIssues(r.outlet).map((k) => (
                              <span className="admin-status ov-issue-tag" key={k}>
                                {OUTLET_ISSUE_LABELS[k]}
                              </span>
                            ))}
                            {!outletIssues(r.outlet).length && 'Tinjauan opsional'}
                          </td>
                          <td data-label="Hasil Google">
                            {OUTLET_RESULT_LABELS[r.workflow?.resultCode] || 'Hasil metode lama'}
                            {r.workflow?.technical && r.workflow.technical !== 'READY' && (
                              <small className="app-error">
                                {r.workflow.technical === 'PARTIAL'
                                  ? 'Sebagian layanan gagal'
                                  : 'Pemeriksaan belum berhasil'}
                              </small>
                            )}
                          </td>
                          <td data-label="Tindakan berikutnya">
                            {OUTLET_STAGE_LABELS[r.workflow?.stage || r.status]}
                            <small>{stamp(r.updatedAt)}</small>
                          </td>
                          <td data-label="Penanggung jawab / tenggat">
                            {r.assignment?.ownerName || 'Antrean tim'}
                            <small>{r.dueAt ? stamp(r.dueAt) : 'Tanpa tenggat kasus'}</small>
                          </td>
                          <td data-label="">
                            <button
                              type="button"
                              className="app-button app-button-primary"
                              onClick={() => select(r.id)}
                            >
                              Tinjau →
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!loading && !rows.length && (
                        <tr>
                          <td colSpan={6}>
                            <div className="ov-empty">
                              <strong>Tidak ada kasus sesuai filter</strong>
                              <p>
                                Pilih outlet untuk memulai pemeriksaan atau ubah filter antrean.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="outlet-pagination">
                  <button
                    type="button"
                    className="app-button"
                    disabled={loading || page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Sebelumnya
                  </button>
                  <span>
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="app-button"
                    disabled={loading || page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Berikutnya
                  </button>
                </div>
              </section>
            </>
          )}
          {workspaceTab === 'FIELD' && <OutletFieldTaskMonitor onOpenReview={select} />}
          {workspaceTab === 'JOBS' && user?.permissions?.can_run_outlet_review && (
            <OutletValidationJobs onOpen={select} />
          )}
        </>
      )}
      {picker && (
        <ValidationOutletPicker
          onClose={() => setPicker(false)}
          onSaved={async (reviews) => {
            setPicker(false);
            if (reviews[0]) select(reviews[0].id);
            else setWorkspaceTab('JOBS');
            await load();
          }}
        />
      )}
    </div>
  );
}
