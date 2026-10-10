import {shipmentReady} from '../../../../../shared/shipment-document.mjs';
import { PackingWorkspaceView } from './PackingWorkspaceView';
import React, { useState, useEffect, useCallback, useMemo,useRef } from 'react';
import { deliveryApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
export const PackingListManager = () => {
  const {
    user,
    settings
  } = useApp();
  const admin = user?.role === 'ADMIN';
  const [result, setResult] = useState({
    items: [],
    total: 0
  });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Notifications & State Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyAction, setBusyAction] = useState(null); // { id, type }
  const [loading, setLoading] = useState(true);

  // Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm, type: 'danger' | 'primary' }
  const flight=useRef(0);

  const refresh = useCallback(async () => {
    const requestId=++flight.current;
    setLoading(true);
    setError('');
    try {
      const r = await deliveryApi.getPackingLists({
        page,
        limit: 20,
        search,
        status
      });
      if(requestId===flight.current)setResult(r.data || {
        items: [],
        total: 0
      });
    } catch (e) {
      if(requestId===flight.current)setError(e.message || 'Gagal memuat daftar packing list');
    } finally {
      if(requestId===flight.current)setLoading(false);
    }
  }, [page, search, status]);
  useEffect(() => {
    const timer = setTimeout(refresh, 250);
    return () => {clearTimeout(timer);flight.current++;};
  }, [refresh]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Action: RELEASE or RECALL
  const handleTransitionAction = async (pl, actionType) => {
    if (busyAction) return;

    // Pre-flight check for RELEASE
    if (actionType === 'RELEASE') {
      const totalCartons = pl.totalCartons || 0;
      const invoiceCartons = (pl.invoices || []).reduce((sum, inv) => sum + (Number(inv.totalCartons) || 0), 0);
      if (!shipmentReady(pl)) {
        setError(`Dokumen ${pl.code} belum lengkap. Isi barang, karton fisik (> 0) dan faktur yang diwajibkan aturan dokumen.`);
        return;
      }
      if (pl.invoices?.length&&invoiceCartons !== totalCartons) {
        setError(`Total karton faktur (${invoiceCartons}) tidak sama dengan total karton packing list (${totalCartons}). Harap edit draft untuk menyamakan karton.`);
        return;
      }
    }
    const actionText = actionType === 'RELEASE' ? 'Kirim ke Gudang' : 'Tarik untuk Revisi';
    setConfirmDialog({
      title: `${actionText}: ${pl.code}`,
      message: actionType === 'RELEASE' ? `Dokumen muatan ${pl.code} (${pl.totalCartons} karton) akan diserahkan kepada Kepala Gudang untuk alokasi rute pengiriman. Lanjutkan?` : `Dokumen ${pl.code} akan ditarik kembali menjadi draft admin untuk direvisi. Lanjutkan?`,
      type: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        setBusyAction(`${pl.id}_${actionType}`);
        setError('');
        try {
          await deliveryApi.changePackingStatus(pl.id, actionType);
          setSuccess(actionType === 'RELEASE' ? `Dokumen ${pl.code} berhasil dikirim ke Kepala Gudang!` : `Dokumen ${pl.code} berhasil ditarik kembali ke draft revisi.`);
          await refresh();
        } catch (e) {
          setError(e.message || `Gagal memproses aksi ${actionText}`);
        } finally {
          setBusyAction(null);
        }
      }
    });
  };

  // Action: DELETE draft
  const handleDeleteDraft = pl => {
    if (busyAction) return;
    setConfirmDialog({
      title: `Hapus Draft: ${pl.code}`,
      message: `Apakah Anda yakin ingin menghapus draft packing list ${pl.code} (${pl.outlet?.name})? Tindakan ini tidak dapat dibatalkan.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        setBusyAction(`${pl.id}_DELETE`);
        setError('');
        try {
          await deliveryApi.deletePackingList(pl.id);
          setSuccess(`Draft packing list ${pl.code} berhasil dihapus.`);
          await refresh();
        } catch (e) {
          setError(e.message || 'Gagal menghapus draft packing list');
        } finally {
          setBusyAction(null);
        }
      }
    });
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    if(result.metrics) return result.metrics;
    const items = result.items || [];
    let draftCount = 0;
    let releasedCount = 0;
    let incompleteCount = 0;
    items.forEach(pl => {
      if (pl.status === 'DRAFT') {
        draftCount++;
        if (!shipmentReady(pl)) {
          incompleteCount++;
        }
      } else if (pl.status === 'RELEASED') {
        releasedCount++;
      }
    });
    return {
      total: result.total,
      draftCount,
      releasedCount,
      incompleteCount
    };
  }, [result]);
  const toggleExpand = id => {
    setExpandedId(prev => prev === id ? null : id);
  };
  return <PackingWorkspaceView admin={admin} busyAction={busyAction} confirmDialog={confirmDialog} error={error} expandedId={expandedId} form={form} handleDeleteDraft={handleDeleteDraft} handleTransitionAction={handleTransitionAction} loading={loading} metrics={metrics} page={page} printDoc={printDoc} refresh={refresh} result={result} search={search} setConfirmDialog={setConfirmDialog} setError={setError} setForm={setForm} setPage={setPage} setPrintDoc={setPrintDoc} setSearch={setSearch} setStatus={setStatus} setSuccess={setSuccess} settings={settings} status={status} success={success} toggleExpand={toggleExpand} />;
};
