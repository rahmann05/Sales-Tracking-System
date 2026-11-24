import { WarehouseOperationsView } from './WarehouseOperationsView';
import { useWorkspaceState } from '../../../shared/hooks/useWorkspaceState';
import { setWorkspaceValues } from '../../../shared/utils/workspaceNavigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { deliveryApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { TAB_IDS } from '../../../constants/navigation';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import { routeLocation } from '../../../../../shared/delivery-operations.mjs';
import { OperationalIssues } from './OperationalIssues';
import { OrderFulfillmentPanel } from './OrderFulfillmentPanel';
import { InvoiceReconciliationPanel } from './InvoiceReconciliationPanel';
import { AttentionPanel } from '../../../shared/components/common/AttentionPanel';
import { TripMonitorWorkspace } from './TripMonitorWorkspace';
const stamp = (v) =>
  v ? new Date(v).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Belum tercatat';
export function OperationsWorkspace({ section = 'routes' } = {}) {
  const { setActiveTab, user } = useApp();
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [tab, setTab] = useState('routes');
  const [date, setDate] = useWorkspaceState('deliveryHistoryDate', wibDateKey()),
    [filter, setFilter] = useWorkspaceState('deliveryScope', 'OPEN');
  const flight = useRef(0),
    hasLoaded = useRef(false);
  const refresh = useCallback(
    async (trigger = false) => {
      const id = ++flight.current;
      const showSpinner = !hasLoaded.current || trigger === true || Boolean(trigger?.target);
      if (showSpinner) setLoading(true);
      try {
        const r = await deliveryApi.getOperations({ date });
        if (id === flight.current) {
          setData(r.data);
          setError('');
          hasLoaded.current = true;
        }
      } catch (e) {
        if (id === flight.current) setError(e.message);
      } finally {
        if (id === flight.current) setLoading(false);
      }
    },
    [date]
  );
  useEffect(() => {
    refresh(true);
    const timer = setInterval(() => refresh(false), 30000);
    const onChanged = () => refresh(false);
    window.addEventListener('operational-data-changed', onChanged);
    window.addEventListener('delivery:changed', onChanged);
    return () => {
      clearInterval(timer);
      window.removeEventListener('operational-data-changed', onChanged);
      window.removeEventListener('delivery:changed', onChanged);
      flight.current++;
    };
  }, [refresh]);
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const routes = React.useMemo(
      () =>
        (data?.routes || []).map((r) => ({
          ...r,
          location: routeLocation(r, clock, r.locationPolicy || { enabled: false }),
        })),
      [data, clock]
    ),
    open = routes.filter((r) => !r.closedAt && !r.cancelledAt),
    issues = data?.issues || [];
  const show =
    filter === 'OPEN'
      ? open
      : filter === 'ATTENTION'
        ? open.filter((r) => r.alerts.length || issues.some((i) => i.routeId === r.id))
        : routes;
  const canManage = user.permissions?.can_manage_delivery_routes !== false;
  if (user.role === 'KEPALA_GUDANG')
    return (
      <WarehouseOperationsView
        {...{
          section,
          data,
          error,
          loading,
          refresh,
          filter,
          setFilter,
          date,
          setDate,
          routes,
          open,
          issues,
          canManage,
          setActiveTab,
        }}
      />
    );
  return (
    <div className="workspace-page delivery-operations-workspace space-y-5">
      <header className="admin-page-heading">
        <div>
          <h1>Pantau pengiriman</h1>
          <p>
            Pantau tujuan, posisi armada, dan hasil pengiriman. Kepala gudang menyiapkan perjalanan;
            supir menjalankannya.
          </p>
        </div>
        <button type="button" className="admin-button" disabled={loading} onClick={refresh}>
          {loading ? 'Memperbarui…' : 'Perbarui data'}
        </button>
      </header>
      <p role="status" className="text-sm">
        {error
          ? 'Data gagal diperbarui — tampilan terakhir mungkin sudah lama.'
          : data
            ? 'Pembaruan otomatis setiap 30 detik.'
            : 'Memuat antrean…'}{' '}
        Terakhir berhasil: {stamp(data?.generatedAt)} WIB
      </p>
      {error && (
        <p role="alert" className="p-3 border border-red-500 rounded-xl text-red-600">
          {error}
        </p>
      )}
      <nav className="logistics-flow-strip" aria-label="Alur pengiriman menyeluruh">
        {user.permissions?.can_approve_order !== false && (
          <button
            type="button"
            className="logistics-flow-step"
            onClick={() => setActiveTab(TAB_IDS.ADMIN_APPROVAL)}
          >
            <span className="logistics-flow-num">1</span>
            <span className="logistics-flow-step-text">
              <span>Order &amp; persetujuan</span>
              <small>{data?.orders.length || 0} order terbuka</small>
            </span>
          </button>
        )}
        {user.permissions?.can_manage_packing_list !== false && (
          <button
            type="button"
            className="logistics-flow-step"
            onClick={() => setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST)}
          >
            <span className="logistics-flow-num">2</span>
            <span className="logistics-flow-step-text">
              <span>Packing &amp; faktur</span>
              <small>{data?.packings.length || 0} belum dialokasikan</small>
            </span>
          </button>
        )}
        {canManage && (
          <button
            type="button"
            className="logistics-flow-step"
            onClick={() => setActiveTab(TAB_IDS.DELIVERY_ROUTES)}
          >
            <span className="logistics-flow-num">3</span>
            <span className="logistics-flow-step-text">
              <span>Rute pengiriman</span>
              <small>Rakit &amp; tugaskan armada</small>
            </span>
          </button>
        )}
        <button
          type="button"
          className="logistics-flow-step"
          aria-current="step"
          onClick={() => setTab('routes')}
        >
          <span className="logistics-flow-num">4</span>
          <span className="logistics-flow-step-text">
            <span>Monitor &amp; retur</span>
            <small>{open.length} trip berjalan</small>
          </span>
        </button>
      </nav>
      <div className="logistics-kpi-strip" role="group" aria-label="Ringkasan antrean operasional">
        {[
          ['orders', 'Order terbuka', data?.orders.length || 0],
          ['packing', 'Packing belum selesai / draft', data?.packings.length || 0],
          ['routes', 'Trip belum ditutup', open.length],
          [
            'issues',
            'Masalah lewat tenggat',
            issues.filter((i) => i.dueAt && new Date(i.dueAt) < new Date()).length,
          ],
        ].map(([targetTab, label, value]) => (
          <button
            key={targetTab}
            type="button"
            className="logistics-kpi-card"
            aria-pressed={tab === targetTab}
            onClick={() => {
              if (
                window.dispatchEvent(new CustomEvent('app:before-navigate', { cancelable: true }))
              )
                setTab(targetTab);
            }}
          >
            <span>{label}</span>
            <strong>{value}</strong>
          </button>
        ))}
      </div>
      {user.role !== 'ADMIN' && <AttentionPanel />}
      <nav aria-label="Pemantauan gudang" className="admin-panel p-3 flex flex-wrap gap-2">
        {[
          ['routes', `Perjalanan & lokasi (${open.length})`],
          ['packing', `Antrean packing (${data?.packings?.length || 0})`],
          ['orders', `Pemenuhan order (${data?.orders?.length || 0})`],
          ['issues', `Masalah & keluhan (${issues.length})`],
          ['commercial', `Rekonsiliasi faktur (${data?.commercialQueue?.length || 0})`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            className={`min-h-11 px-4 rounded-xl border ${tab === id ? 'bg-primary text-on-primary border-primary font-semibold' : ''}`}
            onClick={() => {
              if (
                window.dispatchEvent(new CustomEvent('app:before-navigate', { cancelable: true }))
              )
                setTab(id);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === 'routes' && (
        <>
          <div className="admin-toolbar admin-trip-filters">
            <label className="admin-select-label">
              Lingkup
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="OPEN">Semua trip terbuka lintas tanggal</option>
                <option value="ATTENTION">Perlu tindakan</option>
                <option value="ALL">Terbuka + riwayat tanggal pilihan</option>
              </select>
            </label>
            <label className="admin-select-label">
              Riwayat tanggal
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
              />
            </label>
            {canManage && (
              <button
                type="button"
                className="admin-button"
                onClick={() => setActiveTab(TAB_IDS.DELIVERY_ROUTES)}
              >
                Buat / kelola rute
              </button>
            )}
          </div>
          <TripMonitorWorkspace
            routes={show}
            people={data?.people || []}
            issues={issues}
            canManage={canManage && !error}
            disabled={!!error}
            onChanged={refresh}
          />
        </>
      )}
      {tab === 'packing' && (
        <section className="space-y-3">
          <p>
            Antrean mencakup seluruh tanggal. Draft masih menjadi tanggung jawab Admin; dokumen
            dilepas menjadi antrean gudang.
          </p>
          <button
            type="button"
            className="min-h-11 border rounded-xl px-4"
            onClick={() => setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST)}
          >
            Buka dokumen packing
          </button>
          {data?.packings.map((p) => (
            <details
              key={p.id}
              className="border border-border-glass bg-surface rounded-xl p-4 space-y-3"
            >
              <summary className="cursor-pointer min-h-11">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>
                    {p.code} ·{' '}
                    {p.loadPlanVersion === 2
                      ? `${p.destinations?.length || 0} tujuan`
                      : p.outlet?.name || 'Outlet'}
                  </strong>
                  <span className={`admin-status admin-status-${p.status?.toLowerCase()}`}>
                    {p.status === 'DRAFT' ? 'Draft Admin' : 'Dilepas ke gudang'}
                  </span>
                </div>
                <span className="block text-xs text-on-surface-variant mt-1">
                  Sisa {p.remainingCartons} karton · Menunggu sejak{' '}
                  {stamp(p.releasedAt || p.createdAt)} WIB
                </span>
              </summary>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => {
                    setWorkspaceValues(
                      { packingDetail: p.id },
                      { tab: TAB_IDS.DELIVERY_PACKING_LIST }
                    );
                    setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST);
                  }}
                >
                  Buka dokumen packing
                </button>
                {p.status === 'RELEASED' && p.remainingCartons > 0 && canManage && (
                  <button
                    type="button"
                    className="admin-button primary"
                    onClick={() => {
                      setWorkspaceValues(
                        { routePacking: p.id, deliveryPlan: '1', deliveryRoute: '' },
                        { tab: TAB_IDS.DELIVERY_ROUTES }
                      );
                      setActiveTab(TAB_IDS.DELIVERY_ROUTES);
                    }}
                  >
                    Susun perjalanan
                  </button>
                )}
              </div>
              <OperationalIssues
                issues={issues.filter((i) => i.packingListId === p.id && !i.routeId)}
                people={data.people}
                reference={{ packingListId: p.id }}
                onChanged={refresh}
              />
            </details>
          ))}
        </section>
      )}
      {tab === 'orders' && data && (
        <OrderFulfillmentPanel
          orders={data.orders}
          onChanged={refresh}
          renderActions={(o) => (
            <OperationalIssues
              issues={issues.filter((i) => i.orderId === o.id)}
              people={data.people}
              reference={{ orderId: o.id }}
              onChanged={refresh}
            />
          )}
        />
      )}
      {tab === 'issues' && data && (
        <OperationalIssues issues={issues} people={data.people} onChanged={refresh} />
      )}
      {tab === 'commercial' && data && (
        <section className="space-y-3">
          <h2 className="font-bold">
            Faktur yang perlu diperiksa ({data.commercialQueue?.length || 0})
          </h2>
          <p>
            Antrean lintas tanggal mencakup dokumen yang belum terverifikasi atau memiliki selisih.
            Data lama tetap ditampilkan untuk ditinjau.
          </p>
          {data.commercialQueue?.map((p) => (
            <details className="border rounded-xl p-4" key={p.id}>
              <summary className="min-h-11 cursor-pointer">
                {p.code} ·{' '}
                {p.loadPlanVersion === 2
                  ? `${p.destinations?.length || 0} tujuan`
                  : p.outlet?.name || 'Outlet'}
              </summary>
              <InvoiceReconciliationPanel
                packing={p}
                admin={user.role === 'ADMIN'}
                onChanged={refresh}
              />
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
