import { PackingReferenceFilters } from './PackingReferenceFilters';
import { PackingReferenceGroups } from './PackingReferenceGroups';
import { PackingReferenceTable } from './PackingReferenceTable';
import React, { useEffect, useState, useMemo } from 'react';
import { ordersApi } from '../../../services/api';
import { LuBan, LuInfo, LuStore, LuLayers, LuLayoutGrid, LuList } from 'react-icons/lu';
export function PackingOrderReference({
  onSelect,
  allowPending
}) {
  const [status, setStatus] = useState('APPROVED');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({
    data: [],
    pagination: {}
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' or 'YYYY-MM-DD'
  const [salesFilter, setSalesFilter] = useState('ALL'); // 'ALL' or salesId
  const [viewMode, setViewMode] = useState('SEGMENTED'); // 'SEGMENTED' | 'TABLE'

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    // Fetch with limit 50 to allow rich segmentation
    ordersApi.getAllOrders({
      status,
      page,
      limit: 50
    }).then(r => {
      if (active) setResult(r.data || {
        data: [],
        pagination: {}
      });
    }).catch(e => {
      if (active) setError(e.message || 'Gagal memuat daftar order');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [status, page]);
  const TAB_INFO = {
    APPROVED: {
      label: 'Disetujui Supervisor',
      hint: 'Order penjualan yang telah disetujui resmi. Direkomendasikan untuk langsung diproses ke draft packing list.'
    },
    PENDING_APPROVAL: {
      label: 'Menunggu Persetujuan',
      hint: allowPending ? 'Order pending diizinkan masuk packing list dengan catatan wajib mengisi alasan override admin.' : 'Order pending berstatus informatif. Aktifkan izin override di pengaturan admin untuk menggunakannya.'
    },
    REJECTED: {
      label: 'Ditolak',
      hint: 'Order yang ditolak supervisor tidak dapat dijadikan referensi pengiriman muatan.'
    }
  };
  const currentTab = TAB_INFO[status];

  // Extract available dates for filter dropdown
  const availableDates = useMemo(() => {
    const set = new Set();
    (result.data || []).forEach(o => {
      if (o.createdAt) {
        set.add(o.createdAt.slice(0, 10));
      }
    });
    return Array.from(set).sort().reverse();
  }, [result.data]);

  // Extract available sales reps for filter dropdown
  const availableSales = useMemo(() => {
    const map = new Map();
    (result.data || []).forEach(o => {
      if (o.createdByUser?.id) {
        map.set(o.createdByUser.id, o.createdByUser.name || 'Sales');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name
    }));
  }, [result.data]);

  // Filtered orders based on date, sales, and search
  const filteredOrders = useMemo(() => {
    let list = result.data || [];
    if (dateFilter !== 'ALL') {
      list = list.filter(o => o.createdAt && o.createdAt.startsWith(dateFilter));
    }
    if (salesFilter !== 'ALL') {
      list = list.filter(o => o.createdByUser?.id === salesFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => {
        const outletName = o.pjpStop?.outlet?.name || '';
        const salesName = o.createdByUser?.name || '';
        const itemMatch = (o.items || []).some(i => (i.product?.name || '').toLowerCase().includes(q) || (i.product?.sku || '').toLowerCase().includes(q));
        return outletName.toLowerCase().includes(q) || salesName.toLowerCase().includes(q) || itemMatch;
      });
    }
    return list;
  }, [result.data, dateFilter, salesFilter, search]);

  // Group filtered orders by Date -> then by Sales Rep
  const segmentedData = useMemo(() => {
    const dateMap = new Map();
    filteredOrders.forEach(order => {
      const rawDate = order.createdAt ? order.createdAt.slice(0, 10) : 'Tanpa Tanggal';
      const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : 'Tanggal Tidak Diketahui';
      if (!dateMap.has(rawDate)) {
        dateMap.set(rawDate, {
          rawDate,
          formattedDate,
          salesMap: new Map(),
          totalDayValue: 0,
          totalDayOrders: 0
        });
      }
      const dayGroup = dateMap.get(rawDate);
      dayGroup.totalDayValue += Number(order.totalValue) || 0;
      dayGroup.totalDayOrders += 1;
      const salesId = order.createdByUser?.id || 'unknown';
      const salesName = order.createdByUser?.name || 'Sales Tidak Teridentifikasi';
      if (!dayGroup.salesMap.has(salesId)) {
        dayGroup.salesMap.set(salesId, {
          salesId,
          salesName,
          orders: [],
          totalSalesValue: 0
        });
      }
      const salesGroup = dayGroup.salesMap.get(salesId);
      salesGroup.orders.push(order);
      salesGroup.totalSalesValue += Number(order.totalValue) || 0;
    });

    // Convert to sorted array
    return Array.from(dateMap.values()).sort((a, b) => b.rawDate.localeCompare(a.rawDate)).map(day => ({
      ...day,
      salesGroups: Array.from(day.salesMap.values())
    }));
  }, [filteredOrders]);
  const handleSelectOrder = order => {
    setSelectedOrderId(order.id);
    onSelect(order);
    // Smooth scroll to draft form
    setTimeout(() => {
      window.scrollTo({
        top: 380,
        behavior: 'smooth'
      });
    }, 80);
  };
  const todayStr = new Date().toISOString().slice(0, 10);
  return <section className="rounded-2xl border border-border-glass bg-surface p-4 md:p-6 space-y-5 shadow-xs">
      {/* ── Section Title & View Switcher ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-glass pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <LuLayers className="text-lg" />
            </span>
            <h2 className="font-black text-base md:text-lg text-on-surface">
              Referensi Order Penjualan (Disegmen per Hari & Sales)
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Pesanan penjualan dikelompokkan berdasarkan tanggal transaksi dan sales person penanggung jawab rute.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container/60 border border-border-glass">
          <button type="button" onClick={() => setViewMode('SEGMENTED')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'SEGMENTED' ? 'bg-surface text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <LuLayoutGrid className="text-xs text-primary" />
            <span>Disegmen per Hari & Sales</span>
          </button>
          <button type="button" onClick={() => setViewMode('TABLE')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'TABLE' ? 'bg-surface text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <LuList className="text-xs text-primary" />
            <span>Tabel Rata</span>
          </button>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex flex-wrap gap-2" aria-label="Status order">
        {Object.entries(TAB_INFO).map(([key, info]) => {
        const isActive = status === key;
        return <button key={key} type="button" onClick={() => {
          setStatus(key);
          setPage(1);
        }} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isActive ? 'bg-primary text-on-primary shadow-xs' : 'bg-surface-container/50 text-on-surface-variant hover:text-on-surface border border-border-glass'}`}>
              <span>{info.label}</span>
            </button>;
      })}
      </div>

      {/* ── Segment Filters Toolbar ── */}
      <PackingReferenceFilters availableDates={availableDates} availableSales={availableSales} dateFilter={dateFilter} filteredOrders={filteredOrders} result={result} salesFilter={salesFilter} search={search} setDateFilter={setDateFilter} setSalesFilter={setSalesFilter} setSearch={setSearch} todayStr={todayStr} />

      {/* Tab Hint Banner */}
      {currentTab.hint && <div className={`flex items-start gap-2 text-xs rounded-xl p-3 border ${status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800' : 'bg-surface-container/60 text-on-surface-variant border-border-glass'}`}>
          {status === 'REJECTED' ? <LuBan className="text-rose-600 shrink-0 text-sm mt-0.5" /> : <LuInfo className="text-primary shrink-0 text-sm mt-0.5" />}
          <span>{currentTab.hint}</span>
        </div>}

      {error && <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          {error}
        </p>}

      {/* ── Main Orders Content ── */}
      {loading ? <div className="p-12 text-center text-xs font-bold text-on-surface-variant space-y-2">
          <div className="w-6 h-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p>Memuat dan mengelompokkan referensi pesanan…</p>
        </div> : filteredOrders.length === 0 ? <div className="py-12 text-center text-xs text-on-surface-variant rounded-xl border border-dashed border-border-glass space-y-1">
          <LuStore className="text-2xl mx-auto text-on-surface-variant/40" />
          <p className="font-bold text-on-surface">Tidak ada pesanan pada filter ini</p>
          <p>Coba pilih tanggal lain, semua sales, atau hapus kata kunci pencarian.</p>
        </div> : viewMode === 'SEGMENTED' ? (
    /* ═══════════════════════════════════════════════════════════════
       VIEW 1: SEGMENTED PER HARI & PER SALES (PEMBEDA JELAS)
       ═══════════════════════════════════════════════════════════════ */
    <PackingReferenceGroups allowPending={allowPending} handleSelectOrder={handleSelectOrder} segmentedData={segmentedData} selectedOrderId={selectedOrderId} status={status} todayStr={todayStr} />) : (
    /* ═══════════════════════════════════════════════════════════════
       VIEW 2: TABEL FLAT STANDAR DENGAN KOLOM PER TANGGAL & SALES
       ═══════════════════════════════════════════════════════════════ */
    <PackingReferenceTable allowPending={allowPending} filteredOrders={filteredOrders} handleSelectOrder={handleSelectOrder} selectedOrderId={selectedOrderId} status={status} />)}

      {/* ── Pagination Controls ── */}
      <div className="flex items-center justify-between pt-2 border-t border-border-glass">
        <button type="button" disabled={page === 1 || loading} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer">
          Sebelumnya
        </button>

        <span className="text-xs font-bold text-on-surface-variant">
          Halaman {page} · Menampilkan {filteredOrders.length} order
        </span>

        <button type="button" disabled={!result.pagination?.hasNextPage || loading} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer">
          Berikutnya
        </button>
      </div>
    </section>;
}
