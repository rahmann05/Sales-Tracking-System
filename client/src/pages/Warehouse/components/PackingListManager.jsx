import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { deliveryApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { PackingOrderReference } from './PackingOrderReference';
import { PackingDraftForm } from './PackingDraftForm';
import { PackingListPrintModal } from './PackingListPrintModal';
import {
  LuPackage,
  LuPlus,
  LuSend,
  LuRotateCcw,
  LuTrash2,
  LuPencil,
  LuPrinter,
  LuRefreshCw,
  LuSearch,
  LuTriangleAlert,
  LuCircleCheck,
  LuCircleAlert,
  LuStore,
  LuFileText,
  LuTruck,
  LuClock,
  LuChevronDown,
  LuChevronUp,
  LuInfo,
  LuCheck,
  LuX,
} from 'react-icons/lu';

export const PackingListManager = () => {
  const { user, settings } = useApp();
  const admin = user?.role === 'ADMIN';

  const [result, setResult] = useState({ items: [], total: 0 });
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
  const [loading, setLoading] = useState(false);

  // Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm, type: 'danger' | 'primary' }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await deliveryApi.getPackingLists({ page, limit: 20, search, status });
      setResult(r.data || { items: [], total: 0 });
    } catch (e) {
      setError(e.message || 'Gagal memuat daftar packing list');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(refresh, 250);
    return () => clearTimeout(timer);
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

      if (totalCartons === 0 || !pl.items?.length || !pl.invoices?.length) {
        setError(`Dokumen ${pl.code} belum lengkap. Harap isi rincian produk, karton fisik (> 0), dan faktur terlebih dahulu sebelum dikirim ke gudang.`);
        return;
      }

      if (invoiceCartons !== totalCartons) {
        setError(`Total karton faktur (${invoiceCartons}) tidak sama dengan total karton packing list (${totalCartons}). Harap edit draft untuk menyamakan karton.`);
        return;
      }
    }

    const actionText = actionType === 'RELEASE' ? 'Kirim ke Gudang' : 'Tarik untuk Revisi';

    setConfirmDialog({
      title: `${actionText}: ${pl.code}`,
      message:
        actionType === 'RELEASE'
          ? `Dokumen muatan ${pl.code} (${pl.totalCartons} karton) akan diserahkan kepada Kepala Gudang untuk alokasi rute pengiriman. Lanjutkan?`
          : `Dokumen ${pl.code} akan ditarik kembali menjadi draft admin untuk direvisi. Lanjutkan?`,
      type: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        setBusyAction(`${pl.id}_${actionType}`);
        setError('');
        try {
          await deliveryApi.changePackingStatus(pl.id, actionType);
          setSuccess(
            actionType === 'RELEASE'
              ? `Dokumen ${pl.code} berhasil dikirim ke Kepala Gudang!`
              : `Dokumen ${pl.code} berhasil ditarik kembali ke draft revisi.`
          );
          await refresh();
        } catch (e) {
          setError(e.message || `Gagal memproses aksi ${actionText}`);
        } finally {
          setBusyAction(null);
        }
      },
    });
  };

  // Action: DELETE draft
  const handleDeleteDraft = (pl) => {
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
      },
    });
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const items = result.items || [];
    let draftCount = 0;
    let releasedCount = 0;
    let incompleteCount = 0;

    items.forEach((pl) => {
      if (pl.status === 'DRAFT') {
        draftCount++;
        if (pl.totalCartons === 0 || !pl.invoices?.length) {
          incompleteCount++;
        }
      } else if (pl.status === 'RELEASED') {
        releasedCount++;
      }
    });

    return { total: result.total, draftCount, releasedCount, incompleteCount };
  }, [result]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24 text-on-surface">
      {/* ── Page Header ── */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-glass pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <LuTruck className="text-xl" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-on-surface">
              {admin ? 'Manajemen Packing List Pengiriman' : 'Antrean Packing List Gudang'}
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {admin
              ? 'Susun dokumen muatan, rincian karton & faktur, lalu kirim ke Kepala Gudang untuk pengalokasian armada.'
              : 'Daftar dokumen muatan yang telah dilepas admin dan siap dibagikan ke rute pengiriman.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={refresh}
            className="px-3.5 py-2 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Muat ulang data"
          >
            <LuRefreshCw className={`text-xs ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          {admin && settings?.PACKING_SOURCE_MODE !== 'ORDER' && (
            <button
              type="button"
              onClick={() => {
                setForm({});
                setTimeout(() => window.scrollTo({ top: 120, behavior: 'smooth' }), 50);
              }}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <LuPlus className="text-sm" />
              <span>Buat Draft Manual</span>
            </button>
          )}
        </div>
      </header>

      {/* ── System Policy Info Banner ── */}
      {admin && (
        <div className="p-3.5 rounded-xl bg-surface-container/60 border border-border-glass text-xs text-on-surface-variant flex items-start gap-2.5">
          <LuInfo className="text-primary text-sm shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p>
              Mode Sumber: <strong className="text-on-surface font-bold">{settings?.PACKING_SOURCE_MODE || 'MANUAL'}</strong>.
              {settings?.PACKING_AUTO_RELEASE
                ? ' Dokumen lengkap otomatis dilepas ke gudang saat disimpan.'
                : ' Dokumen baru disimpan sebagai draft dan perlu dikirim ke gudang dengan menekan tombol Kirim ke Gudang.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Metrics Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-border-glass shadow-xs">
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1.5">
            <LuPackage className="text-primary text-xs" /> Total Dokumen
          </span>
          <span className="text-2xl font-black text-on-surface mt-1 block">{metrics.total}</span>
        </div>

        <div
          onClick={() => { setStatus(status === 'DRAFT' ? '' : 'DRAFT'); setPage(1); }}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            status === 'DRAFT'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-surface border-border-glass hover:border-amber-500/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>Draft Admin</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </span>
          <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 block">
            {metrics.draftCount}
          </span>
        </div>

        <div
          onClick={() => { setStatus(status === 'RELEASED' ? '' : 'RELEASED'); setPage(1); }}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            status === 'RELEASED'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-surface border-border-glass hover:border-emerald-500/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <span>Dikirim ke Gudang</span>
            <LuCircleCheck className="text-xs" />
          </span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
            {metrics.releasedCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-border-glass shadow-xs">
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-between">
            <span>Perlu Dilengkapi</span>
            <LuTriangleAlert className="text-xs" />
          </span>
          <span className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 block">
            {metrics.incompleteCount}
          </span>
        </div>
      </div>

      {/* ── Active Notifications & Feedback ── */}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <LuCircleCheck className="text-emerald-600 text-base shrink-0" />
            <span>{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess('')}
            className="p-1 hover:bg-emerald-100 rounded-lg transition-all"
          >
            <LuX className="text-sm" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <LuCircleAlert className="text-rose-600 text-base shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="p-1 hover:bg-rose-100 rounded-lg transition-all"
          >
            <LuX className="text-sm" />
          </button>
        </div>
      )}

      {/* ── Order Reference Selector (Admin) ── */}
      {admin && !form && (
        <PackingOrderReference
          allowPending={settings?.PACKING_ALLOW_PENDING_ORDER}
          onSelect={(order) => {
            setForm({ order });
            setSuccess(`Memuat order toko ${order.pjpStop?.outlet?.name} ke draft packing list.`);
          }}
        />
      )}

      {/* ── Packing Draft Form (Edit or New) ── */}
      {form && admin && (
        <PackingDraftForm
          key={form.document?.id || form.order?.id || 'manual'}
          {...form}
          onSaved={(msg) => {
            setForm(null);
            setSuccess(msg || 'Draft packing list berhasil disimpan!');
            refresh();
          }}
          onCancel={() => setForm(null)}
        />
      )}

      {/* ── Filters & Search Toolbar ── */}
      <div className="p-4 rounded-2xl bg-surface border border-border-glass shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          {admin && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container/60 border border-border-glass">
              <button
                type="button"
                onClick={() => { setStatus(''); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  status === ''
                    ? 'bg-surface text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua Status ({result.total})
              </button>
              <button
                type="button"
                onClick={() => { setStatus('DRAFT'); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  status === 'DRAFT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                <span>Draft Admin</span>
              </button>
              <button
                type="button"
                onClick={() => { setStatus('RELEASED'); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  status === 'RELEASED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                <span>Dikirim ke Gudang</span>
              </button>
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari kode dokumen atau nama toko..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container/50 border border-border-glass text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Main Packing Lists Grid ── */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border-glass space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-on-surface">Memuat daftar packing list…</p>
        </div>
      ) : result.items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border-glass space-y-2">
          <LuPackage className="text-3xl text-on-surface-variant/40 mx-auto" />
          <p className="text-sm font-bold text-on-surface">Tidak ada packing list ditemukan</p>
          <p className="text-xs text-on-surface-variant">
            Coba sesuaikan kata kunci pencarian atau buat draft packing list baru.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {result.items.map((pl) => {
            const isDraft = pl.status === 'DRAFT';
            const isReleased = pl.status === 'RELEASED';
            const isAllocated = pl.deliveryStops && pl.deliveryStops.length > 0;
            const needsCompletion = isDraft && (pl.totalCartons === 0 || !pl.invoices?.length);
            const isExpanded = expandedId === pl.id;

            const isReleaseBusy = busyAction === `${pl.id}_RELEASE`;
            const isRecallBusy = busyAction === `${pl.id}_RECALL`;
            const isDeleteBusy = busyAction === `${pl.id}_DELETE`;

            return (
              <article
                key={pl.id}
                className={`bg-surface border rounded-2xl p-4 md:p-5 space-y-4 transition-all shadow-xs ${
                  needsCompletion
                    ? 'border-amber-300/80 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-border-glass hover:border-primary/20'
                }`}
              >
                {/* 1. Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono font-black text-base text-on-surface">
                        {pl.code}
                      </h2>
                      <span className="text-on-surface-variant text-sm font-semibold">·</span>
                      <strong className="text-sm font-bold text-on-surface flex items-center gap-1">
                        <LuStore className="text-xs text-primary" />
                        <span>{pl.outlet?.name || 'Toko Belum Ditugaskan'}</span>
                      </strong>

                      {/* Status Badges */}
                      {isDraft && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                          Draft Admin
                        </span>
                      )}

                      {isReleased && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <LuCircleCheck className="text-[10px]" /> Dikirim ke Gudang
                        </span>
                      )}

                      {needsCompletion && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                          <LuTriangleAlert className="text-[10px]" /> Perlu Dilengkapi
                        </span>
                      )}

                      {isAllocated && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                          <LuTruck className="text-[10px]" /> Masuk Rute
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                      <span>Sumber: <strong className="text-on-surface">{pl.source}</strong></span>
                      <span>•</span>
                      <span>Revisi: <strong className="text-on-surface">{pl.revision || 1}</strong></span>
                      {pl.createdAt && (
                        <>
                          <span>•</span>
                          <span>Dibuat: {new Date(pl.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Cartons Summary Metric */}
                  <div className="text-right p-2.5 rounded-xl bg-surface-container/50 border border-border-glass text-xs space-y-0.5">
                    <div>
                      Total Muatan: <strong className="text-on-surface font-black text-sm">{pl.totalCartons || 0}</strong> Karton
                    </div>
                    <div className="text-[11px] text-on-surface-variant flex items-center justify-end gap-2">
                      <span>Dialokasikan: <strong>{pl.allocatedCartons || 0}</strong></span>
                      <span>·</span>
                      <span>Sisa: <strong className="text-emerald-600 dark:text-emerald-400">{pl.remainingCartons ?? (pl.totalCartons || 0)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 2. Expandable Details Trigger */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(pl.id)}
                    className="w-full py-2 px-3 rounded-xl bg-surface-container/30 hover:bg-surface-container/60 border border-border-glass text-xs font-bold text-on-surface flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <LuFileText className="text-xs text-primary" />
                      <span>Rincian Barang ({pl.items?.length || 0}), Faktur ({pl.invoices?.length || 0}), & Catatan</span>
                    </span>
                    {isExpanded ? <LuChevronUp className="text-sm" /> : <LuChevronDown className="text-sm" />}
                  </button>

                  {/* Expanded Accordion Content */}
                  {isExpanded && (
                    <div className="mt-3 p-4 rounded-xl bg-surface-container/20 border border-border-glass space-y-4 animate-fade-in text-xs">
                      {/* Items Table */}
                      <div className="space-y-1.5">
                        <span className="font-black uppercase tracking-wider text-[10px] text-on-surface-variant block">
                          Daftar Barang Produk:
                        </span>
                        <div className="border border-border-glass rounded-xl overflow-hidden">
                          <table className="w-full text-left divide-y divide-border-glass">
                            <thead className="bg-surface-container/60 text-[11px] font-bold text-on-surface-variant">
                              <tr>
                                <th className="p-2">SKU</th>
                                <th className="p-2">Nama Barang</th>
                                <th className="p-2 text-right">Jumlah</th>
                                <th className="p-2">Satuan</th>
                                <th className="p-2 text-right">Sisa Muatan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-glass bg-surface">
                              {(pl.remainingItems || pl.items || []).map((item, idx) => (
                                <tr key={item.lineId || idx} className="hover:bg-surface-container/30">
                                  <td className="p-2 font-mono font-bold text-on-surface-variant">{item.sku || '-'}</td>
                                  <td className="p-2 font-bold text-on-surface">{item.name}</td>
                                  <td className="p-2 text-right font-mono font-bold text-on-surface">{item.quantity}</td>
                                  <td className="p-2 text-on-surface-variant">{item.unit || 'unit'}</td>
                                  <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    {item.remaining ?? item.quantity}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Invoices List */}
                      {pl.invoices && pl.invoices.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-black uppercase tracking-wider text-[10px] text-on-surface-variant block">
                            Faktur Terlampir:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {pl.invoices.map((inv) => (
                              <div
                                key={inv.id}
                                className="px-3 py-1.5 rounded-lg border border-border-glass bg-surface font-mono text-[11px]"
                              >
                                Faktur: <strong className="text-on-surface">{inv.invoiceNumber}</strong> · {inv.totalCartons} Karton
                                {inv.totalAmount ? ` · Rp ${Number(inv.totalAmount).toLocaleString('id-ID')}` : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes & Override Reason */}
                      {(pl.notes || pl.overrideReason) && (
                        <div className="p-3 rounded-lg bg-surface border border-border-glass space-y-1">
                          {pl.notes && (
                            <p className="text-on-surface-variant">
                              <strong className="text-on-surface">Catatan:</strong> {pl.notes}
                            </p>
                          )}
                          {pl.overrideReason && (
                            <p className="text-amber-800 dark:text-amber-300">
                              <strong className="text-on-surface">Alasan Override:</strong> {pl.overrideReason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Audit History Log */}
                      {pl.history && pl.history.length > 0 && (
                        <div className="space-y-1">
                          <span className="font-black uppercase tracking-wider text-[10px] text-on-surface-variant block flex items-center gap-1">
                            <LuClock className="text-xs" />
                            <span>Riwayat Perubahan Dokumen:</span>
                          </span>
                          <div className="space-y-1 pl-2 border-l-2 border-border-glass">
                            {pl.history.map((h, i) => (
                              <div key={i} className="text-[11px] text-on-surface-variant">
                                <strong>{h.action}</strong> oleh {h.userId || 'User'} pada{' '}
                                {h.at ? new Date(h.at).toLocaleString('id-ID') : '-'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Action Buttons Row (Interactive with clear feedback) */}
                <div className="pt-2 border-t border-border-glass flex flex-wrap items-center justify-between gap-2">
                  {/* Left: View / Print Document */}
                  <button
                    type="button"
                    onClick={() => setPrintDoc(pl)}
                    className="px-3 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <LuPrinter className="text-xs text-primary" />
                    <span>Cetak / Lihat Dokumen</span>
                  </button>

                  {/* Right: Administrative actions */}
                  {admin && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* DRAFT Actions */}
                      {isDraft && (
                        <>
                          <button
                            type="button"
                            disabled={Boolean(busyAction)}
                            onClick={() => {
                              setForm({ document: pl });
                              setTimeout(() => window.scrollTo({ top: 120, behavior: 'smooth' }), 50);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <LuPencil className="text-xs text-primary" />
                            <span>Edit Draft</span>
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(busyAction)}
                            onClick={() => handleDeleteDraft(pl)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-600 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            title="Hapus draft packing list ini"
                          >
                            <LuTrash2 className={`text-xs ${isDeleteBusy ? 'animate-spin' : ''}`} />
                            <span>{isDeleteBusy ? 'Menghapus…' : 'Hapus'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(busyAction)}
                            onClick={() => handleTransitionAction(pl, 'RELEASE')}
                            className="px-4 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <LuSend className={`text-xs ${isReleaseBusy ? 'animate-spin' : ''}`} />
                            <span>{isReleaseBusy ? 'Mengirim…' : 'Kirim ke Gudang'}</span>
                          </button>
                        </>
                      )}

                      {/* RELEASED Actions */}
                      {isReleased && !isAllocated && settings?.PACKING_ALLOW_REVISION && (
                        <button
                          type="button"
                          disabled={Boolean(busyAction)}
                          onClick={() => handleTransitionAction(pl, 'RECALL')}
                          className="px-3 py-1.5 rounded-xl border border-amber-300 hover:bg-amber-50 text-xs font-bold text-amber-800 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <LuRotateCcw className={`text-xs ${isRecallBusy ? 'animate-spin' : ''}`} />
                          <span>{isRecallBusy ? 'Menarik…' : 'Tarik untuk Revisi'}</span>
                        </button>
                      )}

                      {isReleased && isAllocated && (
                        <span className="text-[11px] text-on-surface-variant font-medium italic">
                          Sudah dialokasikan ke rute pengiriman
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Pagination Controls ── */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border-glass shadow-xs">
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer"
        >
          Sebelumnya
        </button>

        <span className="text-xs font-bold text-on-surface-variant">
          Halaman <strong className="text-on-surface">{page}</strong> dari {Math.max(1, Math.ceil(result.total / 20))} · Total <strong>{result.total}</strong> dokumen
        </span>

        <button
          type="button"
          disabled={page * 20 >= result.total || loading}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer"
        >
          Berikutnya
        </button>
      </div>

      {/* ── Action Confirmation Dialog Modal ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface border border-border-glass max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 text-on-surface animate-scale-in">
            <h3 className="text-base font-black tracking-tight">{confirmDialog.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-on-primary'
                }`}
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Printable Packing List Modal ── */}
      <PackingListPrintModal
        document={printDoc}
        onClose={() => setPrintDoc(null)}
      />
    </div>
  );
};
