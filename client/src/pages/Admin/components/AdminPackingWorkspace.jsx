import { ordersApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { TAB_IDS } from '../../../constants/navigation';
import { useWorkspaceState } from '../../../shared/hooks/useWorkspaceState';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import React, { useState, useEffect } from 'react';
import { shipmentReady } from '../../../../../shared/shipment-document.mjs';
import { LuPlus, LuRefreshCw, LuSearch, LuArrowLeft } from 'react-icons/lu';
import { PackingDraftForm } from '../../Warehouse/components/PackingDraftForm';
import { PackingListCard } from '../../Warehouse/components/PackingListCard';
import { PackingListPrintModal } from '../../Warehouse/components/PackingListPrintModal';
import { PackingLoadOrderPicker as AdminPackingOrderPicker } from './PackingLoadOrderPicker';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { AdminPackingTable } from './AdminPackingTable';
export function AdminPackingWorkspace(props) {
  const { user, setActiveTab } = useApp();
  const featurePolicy = useFeaturePolicy('PACKING');
  const {
    busyAction,
    confirmDialog,
    error,
    expandedId,
    form,
    loading,
    metrics,
    page,
    printDoc,
    refresh,
    result,
    search,
    setConfirmDialog,
    setForm,
    setPage,
    setPrintDoc,
    setSearch,
    setStatus,
    setSuccess,
    settings,
    status,
    success,
    toggleExpand,
  } = props;
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceOrderId, setSourceOrderId] = useWorkspaceState('packingOrder', '');
  const [sourceError, setSourceError] = useState('');
  useEffect(() => {
    if (!sourceOrderId) return;
    let active = true;
    setSourceError('');
    ordersApi
      .getById(sourceOrderId)
      .then((response) => {
        if (active) setForm({ order: response.data });
      })
      .catch((error) => {
        if (active) setSourceError(error.message);
      });
    return () => {
      active = false;
    };
  }, [sourceOrderId]);
  const selected =
    result.items.find((item) => item.id === expandedId) ||
    (result.selected?.id === expandedId ? result.selected : null);

  const heading = (
    <header className="admin-page-heading">
      <div>
        <p className="admin-eyebrow">Packing & pengiriman / Dokumen</p>
        <h1>
          {form
            ? form.document
              ? 'Revisi packing list'
              : 'Buat packing list'
            : selected
              ? selected.code
              : 'Packing list'}
        </h1>
        <p>
          {form
            ? 'Periksa jumlah barang yang dibawa dan isi jumlah karton fisik per toko. Faktur terbentuk otomatis dari order.'
            : selected
              ? 'Periksa rincian, kelengkapan, dan riwayat dokumen.'
              : 'Siapkan dokumen muatan sebelum diserahkan ke kepala gudang.'}
        </p>
      </div>
      {form && (
        <button
          type="button"
          className="admin-button"
          onClick={() => {
            if (!window.dispatchEvent(new CustomEvent('app:before-navigate', { cancelable: true })))
              return;
            setSourceOrderId('', { replace: true });
            setForm(null);
          }}
        >
          <LuArrowLeft aria-hidden="true" />
          Daftar packing
        </button>
      )}
      {!form && !selected && (
        <div className="admin-heading-actions">
          <button type="button" className="admin-button" disabled={loading} onClick={refresh}>
            <LuRefreshCw />
            Perbarui
          </button>
          <button
            type="button"
            className="admin-button primary"
            disabled={!featurePolicy.canStart}
            title={featurePolicy.reason}
            onClick={() => setSourceOpen(true)}
          >
            <LuPlus />
            Buat packing list
          </button>
        </div>
      )}
      {selected && !form && (
        <button type="button" className="admin-button" onClick={() => toggleExpand(selected.id)}>
          <LuArrowLeft />
          Daftar packing
        </button>
      )}
    </header>
  );
  if (form)
    return (
      <div className="workspace-page admin-packing-editor">
        {heading}
        <PackingDraftForm
          key={form.document?.id || form.order?.id || 'manual'}
          {...form}
          onSaved={(message, saved) => {
            setSourceOrderId('', { replace: true });
            setForm(null);
            setSuccess(message);
            if (saved?.id && saved.id !== expandedId) toggleExpand(saved.id);
            refresh();
          }}
          onCancel={() => {
            setSourceOrderId('', { replace: true });
            setForm(null);
          }}
        />
      </div>
    );
  return (
    <div className="workspace-page admin-packing-workspace">
      {heading}
      {sourceError && (
        <p role="alert" className="admin-feedback error">
          {sourceError}
        </p>
      )}
      {error && (
        <p className="admin-feedback error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="admin-feedback success" role="status">
          {success}
        </p>
      )}
      {selected ? (
        <div className="admin-packing-document">
          <PackingListCard
            {...props}
            pl={selected}
            inDetailView
            onChanged={refresh}
            isDraft={selected.status === 'DRAFT'}
            isReleased={selected.status === 'RELEASED'}
            isAllocated={Boolean(selected.deliveryStops?.length)}
            needsCompletion={selected.status === 'DRAFT' && !shipmentReady(selected)}
            isExpanded
            isReleaseBusy={busyAction === `${selected.id}_RELEASE`}
            isRecallBusy={busyAction === `${selected.id}_RECALL`}
            isDeleteBusy={busyAction === `${selected.id}_DELETE`}
          />
        </div>
      ) : (
        <>
          <nav className="logistics-flow-strip" aria-label="Alur packing hingga pengiriman">
            {user?.permissions?.can_approve_order !== false && (
              <button
                type="button"
                className="logistics-flow-step"
                onClick={() => setActiveTab(TAB_IDS.ADMIN_APPROVAL)}
              >
                <span className="logistics-flow-num">1</span>
                <span className="logistics-flow-step-text">
                  <span>Order &amp; persetujuan</span>
                  <small>Cek order masuk</small>
                </span>
              </button>
            )}
            <button
              type="button"
              className="logistics-flow-step"
              aria-current="step"
              onClick={() => setStatus('')}
            >
              <span className="logistics-flow-num">2</span>
              <span className="logistics-flow-step-text">
                <span>Packing &amp; faktur</span>
                <small>
                  {metrics.draftCount} draft · {metrics.releasedCount} dilepas
                </small>
              </span>
            </button>
            {user?.permissions?.can_manage_delivery_routes !== false && (
              <button
                type="button"
                className="logistics-flow-step"
                onClick={() => setActiveTab(TAB_IDS.DELIVERY_ROUTES)}
              >
                <span className="logistics-flow-num">3</span>
                <span className="logistics-flow-step-text">
                  <span>Rute pengiriman</span>
                  <small>Jadwalkan armada</small>
                </span>
              </button>
            )}
            {user?.permissions?.can_monitor_delivery !== false && (
              <button
                type="button"
                className="logistics-flow-step"
                onClick={() => setActiveTab(TAB_IDS.DELIVERY_MONITOR)}
              >
                <span className="logistics-flow-num">4</span>
                <span className="logistics-flow-step-text">
                  <span>Monitor &amp; retur</span>
                  <small>Pantau trip aktif</small>
                </span>
              </button>
            )}
          </nav>
          <div className="logistics-kpi-strip" role="group" aria-label="Ringkasan packing list">
            {[
              ['', 'Semua dokumen', metrics.total, status === ''],
              ['DRAFT', 'Draft admin', metrics.draftCount, status === 'DRAFT'],
              ['RELEASED', 'Dikirim ke gudang', metrics.releasedCount, status === 'RELEASED'],
            ].map(([nextStatus, label, count, pressed]) => (
              <button
                key={label}
                type="button"
                className="logistics-kpi-card"
                aria-pressed={pressed}
                onClick={() => {
                  setStatus(nextStatus);
                  setPage(1);
                }}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
            <button
              type="button"
              className="logistics-kpi-card"
              onClick={() => {
                setStatus('DRAFT');
                setPage(1);
              }}
            >
              <span>Perlu dilengkapi</span>
              <strong>{metrics.incompleteCount}</strong>
            </button>
          </div>
          <div className="admin-toolbar">
            <label className="admin-search">
              <LuSearch aria-hidden="true" />
              <input
                type="search"
                aria-label="Cari packing list"
                placeholder="Cari kode atau nama outlet…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="admin-select-label">
              Status
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua status</option>
                <option value="DRAFT">Draft admin</option>
                <option value="RELEASED">Dikirim ke gudang</option>
              </select>
            </label>
          </div>
          <section className="admin-panel">
            <AdminPackingTable items={result.items} loading={loading} onSelect={toggleExpand} />
            <footer className="admin-pagination">
              <span>
                {result.total} dokumen · Halaman {page} /{' '}
                {Math.max(1, Math.ceil(result.total / 20))}
              </span>
              <div>
                <button
                  type="button"
                  disabled={page === 1 || loading}
                  onClick={() => setPage(page - 1)}
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page * 20 >= result.total || loading}
                  onClick={() => setPage(page + 1)}
                >
                  Berikutnya
                </button>
              </div>
            </footer>
          </section>
          <p className="admin-footnote">
            {settings?.PACKING_AUTO_RELEASE
              ? 'Dokumen lengkap otomatis dikirim ke gudang setelah disimpan.'
              : 'Pilih Serahkan ke gudang untuk dokumen lengkap, atau Simpan draft jika belum selesai.'}
          </p>
        </>
      )}
      <NativeDialog
        open={sourceOpen}
        title="Siapkan dokumen muatan"
        onClose={() => setSourceOpen(false)}
        className="admin-source-dialog"
      >
        <AdminPackingOrderPicker
          allowPending={settings?.PACKING_ALLOW_PENDING_ORDER}
          onSelectMany={(orders) => {
            setSourceOpen(false);
            setSourceOrderId('');
            setForm({ order: orders[0], orders });
          }}
        />
        {settings?.PACKING_SOURCE_MODE !== 'ORDER' && (
          <details className="packing-disclosure mt-4">
            <summary>Dokumen tanpa referensi order</summary>
            <div className="packing-disclosure-body">
              <p className="text-xs text-on-surface-variant">
                Gunakan untuk kebutuhan khusus. Dokumen ini tidak memenuhi jumlah order Sales.
              </p>
              <button
                type="button"
                className="admin-button"
                onClick={() => {
                  setSourceOpen(false);
                  setSourceOrderId('');
                  setForm({});
                }}
              >
                Buat draft manual
              </button>
            </div>
          </details>
        )}
      </NativeDialog>
      <NativeDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title || 'Konfirmasi tindakan'}
        onClose={() => setConfirmDialog(null)}
        busy={Boolean(busyAction)}
      >
        <p>{confirmDialog?.message}</p>
        <div className="admin-dialog-actions">
          <button type="button" onClick={() => setConfirmDialog(null)}>
            Batal
          </button>
          <button
            type="button"
            className="admin-primary-button"
            onClick={confirmDialog?.onConfirm}
            disabled={Boolean(busyAction)}
          >
            Lanjutkan
          </button>
        </div>
      </NativeDialog>
      <PackingListPrintModal document={printDoc} onClose={() => setPrintDoc(null)} />
    </div>
  );
}
