import { useEffect } from 'react';
import { deliveryApi } from '../../../services/api';
import { useWorkspaceState } from '../../../shared/hooks/useWorkspaceState';
import { setWorkspaceValues } from '../../../shared/utils/workspaceNavigation';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import { WarehouseRouteSummary } from '../../Warehouse/components/WarehouseRouteSummary';
import React, { useState } from 'react';
import { LuPlus, LuArrowLeft, LuSearch, LuRefreshCw } from 'react-icons/lu';
import { CreateRouteForm } from '../../Warehouse/components/CreateRouteForm';
import { RouteOperationsActions } from '../../Warehouse/components/RouteOperationsActions';
import { useApp } from '../../../context/AppContext';
import { TAB_IDS } from '../../../constants/navigation';
import { deliveryRouteLabel } from '../../Warehouse/deliveryLabels';
import { orderedStops, stopDestinationOutlet } from '../../../../../shared/driver-workspace.mjs';
import { outletOperationalPoint } from '../../../../../shared/outlet-location.mjs';

const hasStopPoint = (stop) => {
  const raw = stopDestinationOutlet(stop);
  const op = outletOperationalPoint(raw);
  const lat = op?.latitude ?? raw?.latitude;
  const lng = op?.longitude ?? raw?.longitude;
  return lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
};

export function AdminRoutesWorkspace({
  role = 'ADMIN',
  routes,
  loading,
  error,
  page,
  total,
  setPage,
  showCreateForm,
  setShowCreateForm,
  fetchRoutes,
  handleDelete,
}) {
  const { user, setActiveTab } = useApp();
  const featurePolicy = useFeaturePolicy('DELIVERY');
  const [selectedId, setSelectedId] = useWorkspaceState('deliveryRoute', ''),
    [search, setSearch] = useState(''),
    [statusFilter, setStatusFilter] = useState('ALL');
  const [packingIds] = useWorkspaceState('routePacking', '');
  const [detail, setDetail] = useState(null),
    [detailError, setDetailError] = useState('');
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let active = true;
    setDetailError('');
    deliveryApi
      .getDeliveryRouteById(selectedId)
      .then((response) => {
        if (active) setDetail(response.data);
      })
      .catch((error) => {
        if (active) setDetailError(error.message);
      });
    return () => {
      active = false;
    };
  }, [selectedId, routes]);
  const selected =
    routes.find((route) => route.id === selectedId) || (detail?.id === selectedId ? detail : null);
  const matchesStatus = (route, filterKey) => {
    if (filterKey === 'ALL') return true;
    if (filterKey === 'RETURN_CLOSE')
      return Boolean(route.returnedAt || route.closedAt || route.cancelledAt);
    return route.status === filterKey && !route.returnedAt && !route.closedAt && !route.cancelledAt;
  };
  const visible = routes.filter(
    (route) =>
      matchesStatus(route, statusFilter) &&
      `${route.code} ${route.vehicle?.code || ''} ${route.driver?.name || ''} ${(route.stops || []).map((s) => s.outlet?.name || '').join(' ')}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
  );
  const stepStage = (route) => {
    if (!route) return 1;
    if (route.returnedAt || route.closedAt || ['COMPLETED', 'PARTIAL'].includes(route.status))
      return 4;
    if (route.departedAt || route.status === 'IN_TRANSIT') return 3;
    if (route.status === 'READY' || route.preparation?.PICK || route.preparation?.CHECK) return 2;
    return 1;
  };
  return (
    <div className="workspace-page admin-routes-workspace">
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">
            {role === 'KEPALA_GUDANG'
              ? 'Gudang / Perjalanan'
              : 'Packing & pengiriman / Perencanaan'}
          </p>
          <h1>
            {showCreateForm
              ? 'Susun perjalanan pengiriman'
              : selected
                ? selected.code
                : role === 'KEPALA_GUDANG'
                  ? 'Perjalanan pengiriman'
                  : 'Perjalanan pengiriman'}
          </h1>
          <p>
            {showCreateForm
              ? 'Pilih muatan, kendaraan, supir, dan urutan toko.'
              : role === 'ADMIN'
                ? 'Kepala gudang menyusun perjalanan. Admin memantau hasil dan dapat membantu sesuai izin.'
                : 'Pilih muatan dari Admin, susun perjalanan, lalu periksa dan serahkan muatan kepada supir.'}
          </p>
        </div>
        {showCreateForm ? (
          <button
            type="button"
            className="admin-button"
            onClick={() => {
              if (
                window.dispatchEvent(new CustomEvent('app:before-navigate', { cancelable: true }))
              )
                setShowCreateForm(false);
            }}
          >
            <LuArrowLeft />
            Daftar perjalanan
          </button>
        ) : selected ? (
          <button
            type="button"
            className="admin-button"
            onClick={() => {
              if (
                window.dispatchEvent(new CustomEvent('app:before-navigate', { cancelable: true }))
              )
                setSelectedId('');
            }}
          >
            <LuArrowLeft />
            Daftar perjalanan
          </button>
        ) : (
          <div className="admin-heading-actions">
            <button className="admin-button" type="button" disabled={loading} onClick={fetchRoutes}>
              <LuRefreshCw />
              Perbarui
            </button>
            <button
              className="admin-button primary"
              type="button"
              disabled={!!error || !featurePolicy.canStart}
              title={featurePolicy.reason}
              onClick={() => setShowCreateForm(true)}
            >
              <LuPlus />
              Susun perjalanan
            </button>
          </div>
        )}
      </header>
      {detailError && (
        <p className="admin-feedback error" role="alert">
          {detailError}
        </p>
      )}
      {error && (
        <p className="admin-feedback error" role="alert">
          {error}
        </p>
      )}
      {showCreateForm ? (
        <CreateRouteForm
          initialPackingIds={packingIds.split(',').filter(Boolean)}
          onCreated={(created) => {
            setWorkspaceValues({ deliveryPlan: '', routePacking: '', deliveryRoute: created.id });
            setDetail(created);
            fetchRoutes();
          }}
          onCancel={() => setWorkspaceValues({ deliveryPlan: '', routePacking: '' })}
        />
      ) : selected ? (
        <section className="admin-route-document space-y-4">
          <div className="logistics-flow-strip" aria-label="Tahapan perjalanan ini">
            {[
              [1, 'Rencana rute', 'Muatan & armada'],
              [2, 'Persiapan gudang', 'PICK / CHECK / LOAD'],
              [3, 'Pengantaran supir', 'Kunjungan toko'],
              [4, 'Kembali & retur', 'Terima retur & tutup'],
            ].map(([num, label, hint]) => (
              <div
                key={num}
                className={`logistics-flow-step ${stepStage(selected) >= num ? 'is-active' : ''}`}
                style={{ cursor: 'default' }}
              >
                <span className="logistics-flow-num">{num}</span>
                <span className="logistics-flow-step-text">
                  <span>{label}</span>
                  <small>{hint}</small>
                </span>
              </div>
            ))}
          </div>
          <fieldset disabled={!!error}>
            <WarehouseRouteSummary route={selected} onDelete={handleDelete} />
            <div className="admin-panel p-5 mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="font-semibold">Tindakan perjalanan</h2>
                <button
                  type="button"
                  className="admin-button primary"
                  onClick={() => {
                    setWorkspaceValues(
                      { deliveryRoute: selected.id },
                      { tab: TAB_IDS.DELIVERY_MONITOR }
                    );
                    setActiveTab(TAB_IDS.DELIVERY_MONITOR);
                  }}
                >
                  Pantau live &amp; pemeriksaan retur
                </button>
              </div>
              <RouteOperationsActions key={selected.id} route={selected} onChanged={fetchRoutes} />
            </div>
          </fieldset>
        </section>
      ) : (
        <>
          <nav className="logistics-flow-strip" aria-label="Alur packing hingga pemantauan">
            {user?.permissions?.can_manage_packing_list !== false && (
              <button
                type="button"
                className="logistics-flow-step"
                onClick={() => setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST)}
              >
                <span className="logistics-flow-num">1</span>
                <span className="logistics-flow-step-text">
                  <span>Muatan / packing list</span>
                  <small>Pilih dokumen siap</small>
                </span>
              </button>
            )}
            <button
              type="button"
              className="logistics-flow-step"
              aria-current="step"
              onClick={() => setStatusFilter('ALL')}
            >
              <span className="logistics-flow-num">2</span>
              <span className="logistics-flow-step-text">
                <span>Rute &amp; persiapan</span>
                <small>{routes.length} rute di halaman ini</small>
              </span>
            </button>
            {user?.permissions?.can_monitor_delivery !== false && (
              <button
                type="button"
                className="logistics-flow-step"
                onClick={() => setActiveTab(TAB_IDS.DELIVERY_MONITOR)}
              >
                <span className="logistics-flow-num">3</span>
                <span className="logistics-flow-step-text">
                  <span>Monitor &amp; retur</span>
                  <small>Lacak posisi &amp; retur</small>
                </span>
              </button>
            )}
          </nav>
          <div className="logistics-kpi-strip" role="group" aria-label="Filter status rute">
            {[
              ['ALL', 'Semua rute', routes.length],
              ['DRAFT', 'Persiapan gudang', routes.filter((r) => matchesStatus(r, 'DRAFT')).length],
              ['READY', 'Siap berangkat', routes.filter((r) => matchesStatus(r, 'READY')).length],
              [
                'IN_TRANSIT',
                'Sedang dikirim',
                routes.filter((r) => matchesStatus(r, 'IN_TRANSIT')).length,
              ],
              [
                'RETURN_CLOSE',
                'Kembali / selesai',
                routes.filter((r) => matchesStatus(r, 'RETURN_CLOSE')).length,
              ],
            ].map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                className="logistics-kpi-card"
                aria-pressed={statusFilter === key}
                onClick={() => setStatusFilter(key)}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>
          <div className="admin-toolbar">
            <label className="admin-search">
              <LuSearch aria-hidden="true" />
              <input
                type="search"
                aria-label="Cari rute di halaman ini"
                placeholder="Cari trip, kendaraan, driver, atau toko…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <span className="admin-footnote">{total} rute terdaftar</span>
          </div>
          <section className="admin-panel">
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <caption className="sr-only">Rute dan alokasi kendaraan</caption>
                <thead>
                  <tr>
                    <th>Rute / tanggal</th>
                    <th>Kendaraan</th>
                    <th>Driver</th>
                    <th>Muatan</th>
                    <th>Tujuan pengiriman</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((route) => (
                    <tr key={route.id}>
                      <td>
                        <button
                          type="button"
                          className="admin-table-link"
                          onClick={() => setSelectedId(route.id)}
                        >
                          <strong>{route.code}</strong>
                          <span>
                            {route.date
                              ? new Date(route.date).toLocaleDateString('id-ID', {
                                  timeZone: 'Asia/Jakarta',
                                })
                              : 'Belum terjadwal'}
                          </span>
                        </button>
                      </td>
                      <td>{route.vehicle?.code || route.vehicle?.name || 'Belum ditetapkan'}</td>
                      <td>{route.driver?.name || 'Belum ditetapkan'}</td>
                      <td>{route.totalCartons || 0} karton</td>
                      <td>
                        <div className="space-y-1">
                          {orderedStops(route).map((s, idx) => (
                            <div key={s.id || idx} className="text-xs">
                              <strong>
                                {idx + 1}. {s.outlet?.name || 'Toko'}
                              </strong>
                              {!hasStopPoint(s) && (
                                <small className="block text-amber-700">
                                  Titik lokasi belum lengkap
                                </small>
                              )}
                            </div>
                          ))}
                          {!route.stops?.length && <span>0 outlet</span>}
                        </div>
                      </td>
                      <td>
                        <span className="admin-status">{deliveryRouteLabel(route)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visible.length && (
                <p className="admin-empty">
                  {loading ? 'Memuat rute…' : 'Tidak ada rute dalam pilihan ini.'}
                </p>
              )}
            </div>
            <footer className="admin-pagination">
              <span>
                Halaman {page} / {Math.max(1, Math.ceil(total / 20))} · {total} rute
              </span>
              <div>
                <button
                  disabled={page === 1 || loading}
                  type="button"
                  onClick={() => setPage(page - 1)}
                >
                  Sebelumnya
                </button>
                <button
                  disabled={page * 20 >= total || loading}
                  type="button"
                  onClick={() => setPage(page + 1)}
                >
                  Berikutnya
                </button>
              </div>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}
