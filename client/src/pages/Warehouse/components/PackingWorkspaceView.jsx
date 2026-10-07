import { PackingListCard } from './PackingListCard';
import React from 'react';
import { PackingOrderReference } from './PackingOrderReference';
import { PackingDraftForm } from './PackingDraftForm';
import { PackingListPrintModal } from './PackingListPrintModal';
import { LuPackage, LuPlus, LuRefreshCw, LuSearch, LuTriangleAlert, LuCircleCheck, LuCircleAlert, LuTruck, LuInfo, LuX } from 'react-icons/lu';
export function PackingWorkspaceView({
  admin,
  busyAction,
  confirmDialog,
  error,
  expandedId,
  form,
  handleDeleteDraft,
  handleTransitionAction,
  loading,
  metrics,
  page,
  printDoc,
  refresh,
  result,
  search,
  setConfirmDialog,
  setError,
  setForm,
  setPage,
  setPrintDoc,
  setSearch,
  setStatus,
  setSuccess,
  settings,
  status,
  success,
  toggleExpand
}) {
  return <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24 text-on-surface">
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
            {admin ? 'Susun dokumen muatan, rincian karton & faktur, lalu kirim ke Kepala Gudang untuk pengalokasian armada.' : 'Daftar dokumen muatan yang telah dilepas admin dan siap dibagikan ke rute pengiriman.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" disabled={loading} onClick={refresh} className="px-3.5 py-2 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs cursor-pointer" title="Muat ulang data">
            <LuRefreshCw className={`text-xs ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          {admin && settings?.PACKING_SOURCE_MODE !== 'ORDER' && <button type="button" onClick={() => {
          setForm({});
          setTimeout(() => window.scrollTo({
            top: 120,
            behavior: 'smooth'
          }), 50);
        }} className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
              <LuPlus className="text-sm" />
              <span>Buat Draft Manual</span>
            </button>}
        </div>
      </header>

      {/* ── System Policy Info Banner ── */}
      {admin && <div className="p-3.5 rounded-xl bg-surface-container/60 border border-border-glass text-xs text-on-surface-variant flex items-start gap-2.5">
          <LuInfo className="text-primary text-sm shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p>
              Mode Sumber: <strong className="text-on-surface font-bold">{settings?.PACKING_SOURCE_MODE || 'MANUAL'}</strong>.
              {settings?.PACKING_AUTO_RELEASE ? ' Dokumen lengkap otomatis dilepas ke gudang saat disimpan.' : ' Dokumen baru disimpan sebagai draft dan perlu dikirim ke gudang dengan menekan tombol Kirim ke Gudang.'}
            </p>
          </div>
        </div>}

      {/* ── Metrics Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-border-glass shadow-xs">
          <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1.5">
            <LuPackage className="text-primary text-xs" /> Total Dokumen
          </span>
          <span className="text-2xl font-black text-on-surface mt-1 block">{metrics.total}</span>
        </div>

        <div onClick={() => {
        setStatus(status === 'DRAFT' ? '' : 'DRAFT');
        setPage(1);
      }} className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${status === 'DRAFT' ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20' : 'bg-surface border-border-glass hover:border-amber-500/50'}`}>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>Draft Admin</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </span>
          <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 block">
            {metrics.draftCount}
          </span>
        </div>

        <div onClick={() => {
        setStatus(status === 'RELEASED' ? '' : 'RELEASED');
        setPage(1);
      }} className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all ${status === 'RELEASED' ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-surface border-border-glass hover:border-emerald-500/50'}`}>
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
      {success && <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <LuCircleCheck className="text-emerald-600 text-base shrink-0" />
            <span>{success}</span>
          </div>
          <button type="button" onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-100 rounded-lg transition-all">
            <LuX className="text-sm" />
          </button>
        </div>}

      {error && <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <LuCircleAlert className="text-rose-600 text-base shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg transition-all">
            <LuX className="text-sm" />
          </button>
        </div>}

      {/* ── Order Reference Selector (Admin) ── */}
      {admin && !form && <PackingOrderReference allowPending={settings?.PACKING_ALLOW_PENDING_ORDER} onSelect={order => {
      setForm({
        order
      });
      setSuccess(`Memuat order toko ${order.pjpStop?.outlet?.name} ke draft packing list.`);
    }} />}

      {/* ── Packing Draft Form (Edit or New) ── */}
      {form && admin && <PackingDraftForm key={form.document?.id || form.order?.id || 'manual'} {...form} onSaved={msg => {
      setForm(null);
      setSuccess(msg || 'Draft packing list berhasil disimpan!');
      refresh();
    }} onCancel={() => setForm(null)} />}

      {/* ── Filters & Search Toolbar ── */}
      <div className="p-4 rounded-2xl bg-surface border border-border-glass shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          {admin && <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container/60 border border-border-glass">
              <button type="button" onClick={() => {
            setStatus('');
            setPage(1);
          }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${status === '' ? 'bg-surface text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
                Semua Status ({result.total})
              </button>
              <button type="button" onClick={() => {
            setStatus('DRAFT');
            setPage(1);
          }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${status === 'DRAFT' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'}`}>
                <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                <span>Draft Admin</span>
              </button>
              <button type="button" onClick={() => {
            setStatus('RELEASED');
            setPage(1);
          }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${status === 'RELEASED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                <span>Dikirim ke Gudang</span>
              </button>
            </div>}

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs pointer-events-none" />
            <input type="search" value={search} onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }} placeholder="Cari kode dokumen atau nama toko..." className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container/50 border border-border-glass text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
        </div>
      </div>

      {/* ── Main Packing Lists Grid ── */}
      {loading ? <div className="p-12 text-center rounded-2xl bg-surface border border-border-glass space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-on-surface">Memuat daftar packing list…</p>
        </div> : result.items.length === 0 ? <div className="p-12 text-center rounded-2xl bg-surface border border-border-glass space-y-2">
          <LuPackage className="text-3xl text-on-surface-variant/40 mx-auto" />
          <p className="text-sm font-bold text-on-surface">Tidak ada packing list ditemukan</p>
          <p className="text-xs text-on-surface-variant">
            Coba sesuaikan kata kunci pencarian atau buat draft packing list baru.
          </p>
        </div> : <div className="space-y-3.5">
          {result.items.map(pl => {
        const isDraft = pl.status === 'DRAFT';
        const isReleased = pl.status === 'RELEASED';
        const isAllocated = pl.deliveryStops && pl.deliveryStops.length > 0;
        const needsCompletion = isDraft && (pl.totalCartons === 0 || !pl.invoices?.length);
        const isExpanded = expandedId === pl.id;
        const isReleaseBusy = busyAction === `${pl.id}_RELEASE`;
        const isRecallBusy = busyAction === `${pl.id}_RECALL`;
        const isDeleteBusy = busyAction === `${pl.id}_DELETE`;
        return <PackingListCard admin={admin} busyAction={busyAction} handleDeleteDraft={handleDeleteDraft} handleTransitionAction={handleTransitionAction} isAllocated={isAllocated} isDeleteBusy={isDeleteBusy} isDraft={isDraft} isExpanded={isExpanded} isRecallBusy={isRecallBusy} isReleaseBusy={isReleaseBusy} isReleased={isReleased} needsCompletion={needsCompletion} pl={pl} setForm={setForm} setPrintDoc={setPrintDoc} settings={settings} toggleExpand={toggleExpand} />;
      })}
        </div>}

      {/* ── Pagination Controls ── */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border-glass shadow-xs">
        <button type="button" disabled={page === 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer">
          Sebelumnya
        </button>

        <span className="text-xs font-bold text-on-surface-variant">
          Halaman <strong className="text-on-surface">{page}</strong> dari {Math.max(1, Math.ceil(result.total / 20))} · Total <strong>{result.total}</strong> dokumen
        </span>

        <button type="button" disabled={page * 20 >= result.total || loading} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer">
          Berikutnya
        </button>
      </div>

      {/* ── Action Confirmation Dialog Modal ── */}
      {confirmDialog && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface border border-border-glass max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 text-on-surface animate-scale-in">
            <h3 className="text-base font-black tracking-tight">{confirmDialog.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setConfirmDialog(null)} className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container transition-all">
                Batal
              </button>
              <button type="button" onClick={confirmDialog.onConfirm} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${confirmDialog.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-primary hover:bg-primary/90 text-on-primary'}`}>
                Lanjutkan
              </button>
            </div>
          </div>
        </div>}

      {/* ── Printable Packing List Modal ── */}
      <PackingListPrintModal document={printDoc} onClose={() => setPrintDoc(null)} />
    </div>;
}
