import React, { useEffect, useState, useMemo } from 'react';
import { ordersApi } from '../../../services/api';
import {
  LuBan,
  LuInfo,
  LuSearch,
  LuPackage,
  LuUser,
  LuStore,
  LuCheck,
  LuArrowRight,
  LuCalendar,
  LuLayers,
  LuFilter,
  LuLayoutGrid,
  LuList,
  LuClock,
} from 'react-icons/lu';

export function PackingOrderReference({ onSelect, allowPending }) {
  const [status, setStatus] = useState('APPROVED');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: {} });
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
    ordersApi
      .getAllOrders({ status, page, limit: 50 })
      .then((r) => {
        if (active) setResult(r.data || { data: [], pagination: {} });
      })
      .catch((e) => {
        if (active) setError(e.message || 'Gagal memuat daftar order');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status, page]);

  const TAB_INFO = {
    APPROVED: {
      label: 'Disetujui Supervisor',
      hint: 'Order penjualan yang telah disetujui resmi. Direkomendasikan untuk langsung diproses ke draft packing list.',
    },
    PENDING_APPROVAL: {
      label: 'Menunggu Persetujuan',
      hint: allowPending
        ? 'Order pending diizinkan masuk packing list dengan catatan wajib mengisi alasan override admin.'
        : 'Order pending berstatus informatif. Aktifkan izin override di pengaturan admin untuk menggunakannya.',
    },
    REJECTED: {
      label: 'Ditolak',
      hint: 'Order yang ditolak supervisor tidak dapat dijadikan referensi pengiriman muatan.',
    },
  };

  const currentTab = TAB_INFO[status];

  // Extract available dates for filter dropdown
  const availableDates = useMemo(() => {
    const set = new Set();
    (result.data || []).forEach((o) => {
      if (o.createdAt) {
        set.add(o.createdAt.slice(0, 10));
      }
    });
    return Array.from(set).sort().reverse();
  }, [result.data]);

  // Extract available sales reps for filter dropdown
  const availableSales = useMemo(() => {
    const map = new Map();
    (result.data || []).forEach((o) => {
      if (o.createdByUser?.id) {
        map.set(o.createdByUser.id, o.createdByUser.name || 'Sales');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [result.data]);

  // Filtered orders based on date, sales, and search
  const filteredOrders = useMemo(() => {
    let list = result.data || [];

    if (dateFilter !== 'ALL') {
      list = list.filter((o) => o.createdAt && o.createdAt.startsWith(dateFilter));
    }

    if (salesFilter !== 'ALL') {
      list = list.filter((o) => o.createdByUser?.id === salesFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => {
        const outletName = o.pjpStop?.outlet?.name || '';
        const salesName = o.createdByUser?.name || '';
        const itemMatch = (o.items || []).some(
          (i) =>
            (i.product?.name || '').toLowerCase().includes(q) ||
            (i.product?.sku || '').toLowerCase().includes(q)
        );
        return outletName.toLowerCase().includes(q) || salesName.toLowerCase().includes(q) || itemMatch;
      });
    }

    return list;
  }, [result.data, dateFilter, salesFilter, search]);

  // Group filtered orders by Date -> then by Sales Rep
  const segmentedData = useMemo(() => {
    const dateMap = new Map();

    filteredOrders.forEach((order) => {
      const rawDate = order.createdAt ? order.createdAt.slice(0, 10) : 'Tanpa Tanggal';
      const formattedDate = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : 'Tanggal Tidak Diketahui';

      if (!dateMap.has(rawDate)) {
        dateMap.set(rawDate, {
          rawDate,
          formattedDate,
          salesMap: new Map(),
          totalDayValue: 0,
          totalDayOrders: 0,
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
          totalSalesValue: 0,
        });
      }

      const salesGroup = dayGroup.salesMap.get(salesId);
      salesGroup.orders.push(order);
      salesGroup.totalSalesValue += Number(order.totalValue) || 0;
    });

    // Convert to sorted array
    return Array.from(dateMap.values())
      .sort((a, b) => b.rawDate.localeCompare(a.rawDate))
      .map((day) => ({
        ...day,
        salesGroups: Array.from(day.salesMap.values()),
      }));
  }, [filteredOrders]);

  const handleSelectOrder = (order) => {
    setSelectedOrderId(order.id);
    onSelect(order);
    // Smooth scroll to draft form
    setTimeout(() => {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }, 80);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <section className="rounded-2xl border border-border-glass bg-surface p-4 md:p-6 space-y-5 shadow-xs">
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
          <button
            type="button"
            onClick={() => setViewMode('SEGMENTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'SEGMENTED'
                ? 'bg-surface text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LuLayoutGrid className="text-xs text-primary" />
            <span>Disegmen per Hari & Sales</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('TABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'TABLE'
                ? 'bg-surface text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LuList className="text-xs text-primary" />
            <span>Tabel Rata</span>
          </button>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex flex-wrap gap-2" aria-label="Status order">
        {Object.entries(TAB_INFO).map(([key, info]) => {
          const isActive = status === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setStatus(key);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container/50 text-on-surface-variant hover:text-on-surface border border-border-glass'
              }`}
            >
              <span>{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Segment Filters Toolbar ── */}
      <div className="p-3.5 rounded-xl bg-surface-container/40 border border-border-glass space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* 1. Filter Hari / Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 flex items-center gap-1">
              <LuCalendar className="text-xs text-primary" />
              <span>Segmentasi Tanggal:</span>
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="ALL">Semua Tanggal Transaksi</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  {d === todayStr ? '(Hari Ini)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Sales Person */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 flex items-center gap-1">
              <LuUser className="text-xs text-primary" />
              <span>Segmentasi Sales:</span>
            </label>
            <select
              value={salesFilter}
              onChange={(e) => setSalesFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="ALL">Semua Sales Person</option>
              {availableSales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Search Box */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 flex items-center gap-1">
              <LuSearch className="text-xs text-primary" />
              <span>Pencarian Toko / SKU Produk:</span>
            </label>
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik nama outlet, kode, atau produk..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
              <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Date Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-glass/40 text-xs">
          <span className="text-[11px] text-on-surface-variant font-medium">Pintas Cepat:</span>
          <button
            type="button"
            onClick={() => setDateFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              dateFilter === 'ALL'
                ? 'bg-primary text-on-primary'
                : 'bg-surface hover:bg-surface-container text-on-surface border border-border-glass'
            }`}
          >
            Semua Hari ({result.data?.length || 0})
          </button>
          {availableDates.includes(todayStr) && (
            <button
              type="button"
              onClick={() => setDateFilter(todayStr)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                dateFilter === todayStr
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface hover:bg-surface-container text-on-surface border border-border-glass'
              }`}
            >
              Hari Ini
            </button>
          )}
          <span className="text-[11px] text-on-surface-variant ml-auto font-bold">
            Menampilkan: <strong className="text-on-surface">{filteredOrders.length}</strong> pesanan
          </span>
        </div>
      </div>

      {/* Tab Hint Banner */}
      {currentTab.hint && (
        <div
          className={`flex items-start gap-2 text-xs rounded-xl p-3 border ${
            status === 'REJECTED'
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
              : 'bg-surface-container/60 text-on-surface-variant border-border-glass'
          }`}
        >
          {status === 'REJECTED' ? (
            <LuBan className="text-rose-600 shrink-0 text-sm mt-0.5" />
          ) : (
            <LuInfo className="text-primary shrink-0 text-sm mt-0.5" />
          )}
          <span>{currentTab.hint}</span>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          {error}
        </p>
      )}

      {/* ── Main Orders Content ── */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-on-surface-variant space-y-2">
          <div className="w-6 h-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p>Memuat dan mengelompokkan referensi pesanan…</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-12 text-center text-xs text-on-surface-variant rounded-xl border border-dashed border-border-glass space-y-1">
          <LuStore className="text-2xl mx-auto text-on-surface-variant/40" />
          <p className="font-bold text-on-surface">Tidak ada pesanan pada filter ini</p>
          <p>Coba pilih tanggal lain, semua sales, atau hapus kata kunci pencarian.</p>
        </div>
      ) : viewMode === 'SEGMENTED' ? (
        /* ═══════════════════════════════════════════════════════════════
           VIEW 1: SEGMENTED PER HARI & PER SALES (PEMBEDA JELAS)
           ═══════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {segmentedData.map((dayGroup) => (
            <div
              key={dayGroup.rawDate}
              className="rounded-2xl border-2 border-primary/20 bg-surface shadow-xs overflow-hidden"
            >
              {/* Level 1: Header Tanggal / Hari */}
              <div className="bg-primary text-on-primary px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-white/10 text-white">
                    <LuCalendar className="text-base" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm tracking-tight text-white capitalize">
                      {dayGroup.formattedDate}
                    </h3>
                    <span className="text-[11px] text-white/80 font-mono">
                      {dayGroup.rawDate} {dayGroup.rawDate === todayStr ? '• HARI INI' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                    {dayGroup.salesGroups.length} Sales Bertugas
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                    {dayGroup.totalDayOrders} Pesanan
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black">
                    Total: Rp {dayGroup.totalDayValue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Level 2: Segmentasi Per Sales di Hari Ini */}
              <div className="p-4 space-y-4 bg-surface-container/20">
                {dayGroup.salesGroups.map((salesGroup) => (
                  <div
                    key={salesGroup.salesId}
                    className="rounded-xl border border-border-glass bg-surface shadow-xs overflow-hidden"
                  >
                    {/* Header Sales Person */}
                    <div className="px-4 py-2.5 bg-surface-container/60 border-b border-border-glass flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          <LuUser className="text-sm" />
                        </div>
                        <div>
                          <strong className="text-xs font-black text-on-surface block">
                            Sales: {salesGroup.salesName}
                          </strong>
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            Penanggung Jawab Kunjungan & Order
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-surface text-on-surface font-semibold border border-border-glass text-[11px]">
                          {salesGroup.orders.length} Toko Memesan
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-surface text-on-surface font-mono font-bold border border-border-glass text-[11px]">
                          Subtotal: Rp {salesGroup.totalSalesValue.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Level 3: Rincian Order Toko dari Sales Tersebut */}
                    <div className="divide-y divide-border-glass">
                      {salesGroup.orders.map((o) => {
                        const canUse = status === 'APPROVED' || (status === 'PENDING_APPROVAL' && allowPending);
                        const isSelected = selectedOrderId === o.id;

                        return (
                          <div
                            key={o.id}
                            className={`p-3.5 flex flex-wrap items-start justify-between gap-3 hover:bg-surface-container/30 transition-all ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            {/* Info Toko & Barang */}
                            <div className="space-y-1.5 flex-1 min-w-[260px]">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded bg-surface-container text-primary">
                                  <LuStore className="text-xs" />
                                </span>
                                <strong className="text-xs font-black text-on-surface">
                                  {o.pjpStop?.outlet?.name || 'Toko'}
                                </strong>
                                {o.pjpStop?.outlet?.outletCode && (
                                  <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[10px] text-on-surface-variant">
                                    {o.pjpStop.outlet.outletCode}
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-on-surface-variant pl-6 line-clamp-1">
                                {o.pjpStop?.outlet?.address || 'Alamat toko belum terdata'}
                              </p>

                              {/* Products Preview */}
                              <div className="pl-6 pt-1 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[10px] font-bold text-on-surface-variant">
                                  {o.items?.length || 0} Produk:
                                </span>
                                {(o.items || []).map((item) => (
                                  <span
                                    key={item.id}
                                    className="px-2 py-0.5 rounded-md bg-surface-container/80 text-[10px] font-mono text-on-surface border border-border-glass/60"
                                  >
                                    {item.product?.name || item.product?.sku}: <strong>{item.quantity} unit</strong>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Nilai Order & Tombol Aksi */}
                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <span className="text-xs font-mono font-black text-on-surface block">
                                  Rp {Number(o.totalValue || 0).toLocaleString('id-ID')}
                                </span>
                                <span className="text-[10px] text-on-surface-variant font-medium">
                                  {o.paymentType || 'CASH'}
                                </span>
                              </div>

                              <div>
                                {canUse ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectOrder(o)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/20'
                                        : 'bg-primary text-on-primary hover:bg-primary/90'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <>
                                        <LuCheck className="text-xs" />
                                        <span>Dipilih</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>Gunakan Referensi</span>
                                        <LuArrowRight className="text-xs" />
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-semibold italic">
                                    <LuBan className="text-xs" /> Tidak dapat digunakan
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           VIEW 2: TABEL FLAT STANDAR DENGAN KOLOM PER TANGGAL & SALES
           ═══════════════════════════════════════════════════════════════ */
        <div className="overflow-x-auto rounded-xl border border-border-glass">
          <table className="w-full text-xs text-left divide-y divide-border-glass">
            <thead className="bg-surface-container/60 text-on-surface-variant font-bold">
              <tr>
                <th className="p-3 w-40">Tanggal & Hari</th>
                <th className="p-3 w-44">Sales Person</th>
                <th className="p-3">Toko / Produk Pesanan</th>
                <th className="p-3 w-32 text-right">Nilai Order</th>
                <th className="p-3 w-36 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass bg-surface">
              {filteredOrders.map((o) => {
                const canUse = status === 'APPROVED' || (status === 'PENDING_APPROVAL' && allowPending);
                const isSelected = selectedOrderId === o.id;

                return (
                  <tr
                    key={o.id}
                    className={`hover:bg-surface-container/30 transition-colors ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="p-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-on-surface">
                        <LuCalendar className="text-xs text-primary" />
                        <span>
                          {new Date(o.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(o.createdAt).toLocaleDateString('id-ID', { weekday: 'long' })}
                      </span>
                    </td>

                    <td className="p-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-on-surface">
                        <LuUser className="text-xs text-primary" />
                        <span>{o.createdByUser?.name || 'Sales'}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">Tim Penjualan</span>
                    </td>

                    <td className="p-3 align-top space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <LuStore className="text-xs text-primary shrink-0" />
                        <strong className="text-on-surface text-xs font-bold">
                          {o.pjpStop?.outlet?.name || 'Outlet'}
                        </strong>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(o.items || []).slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-mono font-medium text-on-surface"
                          >
                            {item.product?.name || item.product?.sku}: {item.quantity} unit
                          </span>
                        ))}
                        {(o.items?.length || 0) > 3 && (
                          <span className="text-[10px] text-on-surface-variant font-bold self-center">
                            +{o.items.length - 3} lagi
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 align-top text-right">
                      <span className="font-mono font-black text-on-surface block">
                        Rp {Number(o.totalValue || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium">
                        {o.paymentType || 'CASH'}
                      </span>
                    </td>

                    <td className="p-3 align-top text-center">
                      {canUse ? (
                        <button
                          type="button"
                          onClick={() => handleSelectOrder(o)}
                          className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'border border-border-glass bg-surface hover:bg-surface-container text-primary'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <LuCheck className="text-xs" />
                              <span>Dipilih</span>
                            </>
                          ) : (
                            <>
                              <span>Gunakan</span>
                              <LuArrowRight className="text-xs" />
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-semibold italic">
                          <LuBan className="text-xs" /> Ditolak
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination Controls ── */}
      <div className="flex items-center justify-between pt-2 border-t border-border-glass">
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer"
        >
          Sebelumnya
        </button>

        <span className="text-xs font-bold text-on-surface-variant">
          Halaman {page} · Menampilkan {filteredOrders.length} order
        </span>

        <button
          type="button"
          disabled={!result.pagination?.hasNextPage || loading}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer"
        >
          Berikutnya
        </button>
      </div>
    </section>
  );
}
