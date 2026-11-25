import { ordersApi } from '../../../services/api';
import { mapServerOrder } from '../../../utils/orderMapper';
import { OperationalIssues } from '../../Warehouse/components/OperationalIssues';
import { TAB_IDS } from '../../../constants/navigation';
import { setWorkspaceValues } from '../../../shared/utils/workspaceNavigation';
import { useWorkspaceState } from '../../../shared/hooks/useWorkspaceState';
import React, { useState, useEffect, useRef } from 'react';
import { LuSearch, LuRefreshCw, LuX } from 'react-icons/lu';
import { PendingOrderCard } from './PendingOrderCard';
import { UnlockRequestCard } from './UnlockRequestCard';
import { ManualSalesReview } from '../../../shared/components/common/ManualSalesReview';
import { AdminOrderTable } from './AdminOrderTable';
import { AdminCreateOrderDialog } from './AdminCreateOrderDialog';
import { useApp } from '../../../context/AppContext';
export function AdminOrderWorkspace({
  orders,
  filteredOrders,
  pendingOrders,
  approvedOrders,
  orderFilter,
  setOrderFilter,
  selectedSales,
  setSelectedSales,
  salesOptions,
  loading,
  loadApprovalData,
  handleDecision,
  pendingUnlockCount,
  manualPendingCount,
  unlockRequests,
  handleApproveUnlock,
  handleRejectUnlock,
  loadError,
  ordersOnly = false,
  hideHeading = false,
}) {
  const { user, setActiveTab } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [section, setSection] = useWorkspaceState('orderSection', 'orders');
  const [search, setSearch] = useWorkspaceState('orderSearch', ''),
    [selectedId, setSelectedId] = useWorkspaceState('orderDetail', '');
  const [page, setPage] = useState(1);
  const query = search.trim().toLocaleLowerCase('id-ID');
  const visible = filteredOrders.filter((order) =>
    `${order.code || ''} ${order.outletName} ${order.salesName}`
      .toLocaleLowerCase('id-ID')
      .includes(query)
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(visible.length / 15)));
  const [deepOrder, setDeepOrder] = useState(null),
    [detailError, setDetailError] = useState('');
  useEffect(() => {
    setDeepOrder(null);
    setDetailError('');
    if (!selectedId || orders.some((order) => order.id === selectedId)) return;
    let active = true;
    ordersApi
      .getById(selectedId)
      .then((response) => {
        if (active) setDeepOrder(mapServerOrder(response.data));
      })
      .catch((error) => {
        if (active) setDetailError(error.message);
      });
    return () => {
      active = false;
    };
  }, [selectedId, orders]);
  const selected = orders.find((order) => order.id === selectedId) || deepOrder;
  const detailRef = useRef(null);
  useEffect(() => {
    if (selected?.id) {
      detailRef.current?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width:1199px)').matches)
        detailRef.current?.scrollIntoView({ block: 'start' });
      else detailRef.current?.closest('main')?.scrollTo({ top: 0 });
    }
  }, [selected?.id]);
  const changeFilter = (value) => {
    setOrderFilter(value);
    setPage(1);
  };
  return (
    <div className="workspace-page admin-order-workspace">
      {!hideHeading && (
        <header className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">Order / Pemeriksaan</p>
            <h1>Order & persetujuan</h1>
            <p>Periksa pesanan dan tetapkan keputusan sebelum diproses ke packing.</p>
          </div>
          <div className="app-actions">
            {user?.role === 'ADMIN' && (
              <button
                className="admin-button primary"
                type="button"
                onClick={() => setCreateOpen(true)}
              >
                Buat order Admin
              </button>
            )}
            {user?.role === 'ADMIN' && user.permissions?.can_manage_packing_list !== false && (
              <button
                className="admin-button"
                type="button"
                onClick={() => setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST)}
              >
                Buka Packing List
              </button>
            )}
            <button
              className="admin-button"
              type="button"
              disabled={loading}
              onClick={loadApprovalData}
            >
              <LuRefreshCw />
              {loading ? 'Memuat…' : 'Perbarui'}
            </button>
          </div>
        </header>
      )}
      {!ordersOnly && user?.role === 'ADMIN' && (
        <nav className="logistics-flow-strip" aria-label="Alur order hingga retur">
          <button
            type="button"
            className="logistics-flow-step"
            aria-current="step"
            onClick={() => setSection('orders')}
          >
            <span className="logistics-flow-num">1</span>
            <span className="logistics-flow-step-text">
              <span>Order &amp; persetujuan</span>
              <small>{pendingOrders.length} menunggu</small>
            </span>
          </button>
          {user.permissions?.can_manage_packing_list !== false && (
            <button
              type="button"
              className="logistics-flow-step"
              onClick={() => setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST)}
            >
              <span className="logistics-flow-num">2</span>
              <span className="logistics-flow-step-text">
                <span>Packing &amp; faktur</span>
                <small>{approvedOrders.length} siap dipacking</small>
              </span>
            </button>
          )}
          {user.permissions?.can_manage_delivery_routes !== false && (
            <button
              type="button"
              className="logistics-flow-step"
              onClick={() => setActiveTab(TAB_IDS.DELIVERY_ROUTES)}
            >
              <span className="logistics-flow-num">3</span>
              <span className="logistics-flow-step-text">
                <span>Rute pengiriman</span>
                <small>Alokasi armada</small>
              </span>
            </button>
          )}
          {user.permissions?.can_monitor_delivery !== false && (
            <button
              type="button"
              className="logistics-flow-step"
              onClick={() => setActiveTab(TAB_IDS.DELIVERY_MONITOR)}
            >
              <span className="logistics-flow-num">4</span>
              <span className="logistics-flow-step-text">
                <span>Monitor &amp; retur</span>
                <small>Lacak &amp; terima retur</small>
              </span>
            </button>
          )}
        </nav>
      )}
      {detailError && (
        <p role="alert" className="admin-feedback error">
          {detailError}
        </p>
      )}
      {loadError && (
        <p className="admin-feedback error" role="alert">
          {loadError} Data terakhir tetap ditampilkan.
        </p>
      )}
      {!ordersOnly && (
        <nav className="admin-local-tabs" aria-label="Jenis pemeriksaan">
          {[
            ['orders', 'Order', pendingOrders.length],
            ['unlock', 'Izin presensi outlet', pendingUnlockCount],
            ['manual', 'Hasil manual', manualPendingCount],
          ].map(([id, label, count]) => (
            <button
              type="button"
              key={id}
              aria-pressed={section === id}
              onClick={() => setSection(id)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </nav>
      )}
      {section === 'orders' && (
        <>
          <div className="logistics-kpi-strip" role="group" aria-label="Filter status order">
            {[
              ['ALL', 'Total order', orders.length],
              ['PENDING', 'Menunggu keputusan', pendingOrders.length],
              ['APPROVED', 'Disetujui', approvedOrders.length],
              ['REJECTED', 'Ditolak', orders.filter((o) => o.status === 'REJECTED').length],
            ].map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                className="logistics-kpi-card"
                aria-pressed={orderFilter === key}
                onClick={() => {
                  setOrderFilter(key);
                  setPage(1);
                }}
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
                aria-label="Cari order"
                placeholder="Cari nomor, outlet, atau sales…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value, { replace: true });
                  setPage(1);
                }}
              />
            </label>
            <label className="admin-select-label">
              Sales
              <select
                aria-label="Filter sales"
                value={selectedSales}
                onChange={(event) => {
                  setSelectedSales(event.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">Semua sales</option>
                {salesOptions.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="admin-select-label">
              Status
              <select
                aria-label="Filter status order"
                value={orderFilter}
                onChange={(event) => changeFilter(event.target.value)}
              >
                <option value="ALL">Semua status</option>
                <option value="PENDING">Menunggu</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </label>
          </div>
          <div className={`admin-order-layout ${selected ? 'has-selection' : ''}`}>
            <section className="admin-panel admin-order-list" aria-label="Daftar order">
              <AdminOrderTable
                orders={visible.slice((currentPage - 1) * 15, currentPage * 15)}
                selectedId={selectedId}
                onSelect={setSelectedId}
                loading={loading}
              />
              <footer className="admin-pagination">
                <span>
                  {visible.length} order · Halaman {currentPage} /{' '}
                  {Math.max(1, Math.ceil(visible.length / 15))}
                </span>
                <div>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={currentPage * 15 >= visible.length}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Berikutnya
                  </button>
                </div>
              </footer>
            </section>
            {selected && (
              <aside className="admin-panel admin-order-detail" aria-label="Detail order">
                <div className="admin-panel-heading">
                  <h2 ref={detailRef} tabIndex={-1}>
                    Detail order
                  </h2>
                  <button
                    type="button"
                    aria-label="Tutup detail order"
                    onClick={() => setSelectedId('')}
                  >
                    <LuX />
                  </button>
                </div>
                {user.role === 'ADMIN' &&
                  selected.status === 'APPROVED' &&
                  (selected.fulfillmentStatus === 'FULFILLED' ? (
                    <div className="work-step-intro flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong>Order telah terpenuhi seluruhnya</strong>
                        <span className="text-xs text-on-surface-variant">
                          Pantau riwayat pengiriman atau faktur pada monitor logistik.
                        </span>
                      </div>
                      <button
                        type="button"
                        className="admin-button"
                        onClick={() => setActiveTab(TAB_IDS.DELIVERY_MONITOR)}
                      >
                        Monitor pengiriman
                      </button>
                    </div>
                  ) : (
                    user.permissions?.can_manage_packing_list !== false && (
                      <div className="work-step-intro flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <strong>Langkah berikutnya: siapkan dokumen muatan</strong>
                          <span className="text-xs text-on-surface-variant">
                            {(selected.fulfillmentLines || []).some((l) => l.unpacked > 0)
                              ? 'Masih ada barang yang belum dibuatkan packing list.'
                              : 'Tinjau packing list atau lanjutkan pengiriman.'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="admin-button primary"
                          onClick={() => {
                            setWorkspaceValues(
                              { packingOrder: selected.id },
                              { tab: TAB_IDS.DELIVERY_PACKING_LIST }
                            );
                            setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST);
                          }}
                        >
                          Siapkan pengiriman
                        </button>
                      </div>
                    )
                  ))}
                {user.role === 'ADMIN' && selected.outletId && (
                  <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
                    {user.permissions?.can_manage_outlets !== false && (
                      <button
                        type="button"
                        className="admin-button"
                        onClick={() => {
                          setWorkspaceValues(
                            { outletId: selected.outletId },
                            { tab: TAB_IDS.OUTLET_MANAGEMENT }
                          );
                          setActiveTab(TAB_IDS.OUTLET_MANAGEMENT);
                        }}
                      >
                        Profil master outlet
                      </button>
                    )}
                    {!selected.deliveryPoint?.latitude &&
                      user.permissions?.can_validate_outlet !== false && (
                        <button
                          type="button"
                          className="admin-button"
                          onClick={() => {
                            setWorkspaceValues(
                              { validationTab: 'cases', validationPick: selected.outletId },
                              { tab: TAB_IDS.OUTLET_VALIDATION }
                            );
                            setActiveTab(TAB_IDS.OUTLET_VALIDATION);
                          }}
                        >
                          Validasi titik outlet
                        </button>
                      )}
                  </div>
                )}
                <PendingOrderCard key={selected.id} order={selected} onDecision={handleDecision} />
                <details className="app-disclosure">
                  <summary>Masalah / keluhan order</summary>
                  <OperationalIssues reference={{ orderId: selected.id }} />
                </details>
              </aside>
            )}
          </div>
        </>
      )}
      {section === 'unlock' && (
        <section className="admin-review-queue">
          <div>
            <h2>Izin presensi outlet</h2>
            <p>Pengecualian untuk sales yang belum menuntaskan presensi sebelumnya.</p>
          </div>
          {unlockRequests.length ? (
            unlockRequests.map((request) => (
              <UnlockRequestCard
                key={request.id}
                request={request}
                onApprove={handleApproveUnlock}
                onReject={handleRejectUnlock}
              />
            ))
          ) : (
            <p className="admin-empty">Tidak ada permintaan izin presensi.</p>
          )}
        </section>
      )}
      {section === 'manual' && (
        <section className="admin-panel admin-manual-review">
          <h2>Pemeriksaan hasil penjualan manual</h2>
          <ManualSalesReview />
        </section>
      )}
      {createOpen && (
        <AdminCreateOrderDialog onClose={() => setCreateOpen(false)} onSaved={loadApprovalData} />
      )}
    </div>
  );
}
