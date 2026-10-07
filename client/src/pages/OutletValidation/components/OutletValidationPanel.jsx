import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { outletsApi, outletValidationApi, collectPages } from '../../../services/api';
import { OutletMiniMapPreview } from './OutletMiniMapPreview';
import { OutletValidationDetail } from './OutletValidationDetail';
import {
  LuSearch,
  LuRefreshCw,
  LuSlidersHorizontal,
  LuStore,
  LuMapPin,
  LuPhone,
  LuUser,
  LuCompass,
  LuCreditCard,
  LuRoute,
  LuBuilding,
  LuCircleCheck,
  LuTriangleAlert,
  LuCircleAlert,
  LuCircleHelp,
  LuExternalLink,
  LuLock,
  LuCalendar,
  LuLayers,
} from 'react-icons/lu';

const STATUS_META = {
  VALID: {
    label: 'Sesuai peta',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: LuCircleCheck,
  },
  LIKELY_VALID: {
    label: 'Cenderung sesuai',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    icon: LuCircleCheck,
  },
  WARNING: {
    label: 'Perlu tinjauan',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    icon: LuTriangleAlert,
  },
  SUSPECT: {
    label: 'Perlu koreksi',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    icon: LuCircleAlert,
  },
  INCOMPLETE: {
    label: 'Data belum lengkap',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    icon: LuTriangleAlert,
  },
  UNVALIDATED: {
    label: 'Belum diperiksa',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: LuCircleHelp,
  },
};

const SUBCHANNEL_LABELS = {
  TOKO_RETAIL: 'Toko / Retail',
  GROSIR: 'Grosir',
  KOPERASI: 'Koperasi',
  BIDAN: 'Bidan',
  OUTLET_MOTORIS: 'Outlet Motoris',
  APOTIK: 'Apotik',
  BABY_SHOP: 'Baby Shop / Toko Susu',
  CHAIN_MINIMARKET: 'Chain Minimarket',
  LOKAL_MINIMARKET: 'Lokal Minimarket',
  NAT_SUPERMARKET: 'Nat. Supermarket',
  LOKAL_SUPERMARKET: 'Lokal Supermarket',
  HYPERMARKET: 'Hypermarket',
  DRUGSTORE: 'Drugstore',
  PERKULAKAN: 'Perkulakan',
};

export function OutletValidationPanel() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  
  // Filter States
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL'); // 'ALL' | 'GENERAL_TRADE' | 'MODERN_TRADE'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clusterFilter, setClusterFilter] = useState('ALL');
  
  // Selection & Pagination
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await collectPages(outletsApi.getAll);
      setOutlets(res.data || []);
    } catch (e) {
      setError(e.message || 'Gagal memuat daftar outlet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Extract clusters for filter dropdown
  const clusterOptions = useMemo(() => {
    const map = new Map();
    outlets.forEach((o) => {
      if (o.cluster?.id) {
        map.set(o.cluster.id, o.cluster.name || 'Klaster');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [outlets]);

  // High-level metrics counters
  const metrics = useMemo(() => {
    const total = outlets.length;
    let gt = 0;
    let mt = 0;
    let valid = 0;
    let warning = 0;
    let unvalidated = 0;

    outlets.forEach((o) => {
      const ch = o.channel || o.type || 'GENERAL_TRADE';
      if (ch === 'GENERAL_TRADE') gt++;
      else if (ch === 'MODERN_TRADE') mt++;

      const st = o.validationStatus || 'UNVALIDATED';
      if (st === 'VALID' || st === 'LIKELY_VALID') valid++;
      else if (st === 'WARNING' || st === 'SUSPECT') warning++;
      else unvalidated++;
    });

    return { total, gt, mt, valid, warning, unvalidated };
  }, [outlets]);

  // Filtered outlets
  const filtered = useMemo(() => {
    return outlets.filter((o) => {
      // 1. Channel filter
      const ch = o.channel || o.type || 'GENERAL_TRADE';
      if (channelFilter !== 'ALL' && ch !== channelFilter) {
        return false;
      }

      // 2. Status filter
      const st = o.validationStatus || 'UNVALIDATED';
      if (statusFilter !== 'ALL' && st !== statusFilter) {
        return false;
      }

      // 3. Cluster filter
      if (clusterFilter !== 'ALL' && o.clusterId !== clusterFilter) {
        return false;
      }

      // 4. Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const searchableText = `${o.name || ''} ${o.outletCode || ''} ${o.address || ''} ${o.ownerName || ''} ${o.phone || ''} ${o.cluster?.name || ''}`.toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [outlets, channelFilter, statusFilter, clusterFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedOutlets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const validate = async (id) => {
    setBusy(id);
    setError('');
    try {
      await outletValidationApi.validateSingle(id);
      await load();
    } catch (e) {
      setError(e.message || 'Gagal memeriksa validasi peta');
    } finally {
      setBusy('');
    }
  };

  const selectedOutlet = selected ? outlets.find((o) => o.id === selected) : null;

  return (
    <div className="space-y-6">
      {/* ── Guidance Banner ── */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex items-start gap-3">
        <LuCompass className="text-blue-600 dark:text-blue-400 text-xl shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
          <p className="font-bold">Panduan Validasi & Geocoding Titik Toko:</p>
          <p>
            Perbandingan peta membantu menemukan ketidaksesuaian nama toko, alamat tertulis, dan koordinat GPS.
            Gunakan filter <strong>GT</strong> dan <strong>MT</strong> untuk meninjau masing-masing jalur distribusi.
            Koreksi koordinat harus selalu didukung dengan pengecekan lokasi fisik di lapangan.
          </p>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-border-glass shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1.5">
            <LuStore className="text-primary text-xs" /> Total Outlet
          </span>
          <span className="text-2xl font-black text-on-surface mt-1">{metrics.total}</span>
        </div>

        <div
          onClick={() => { setChannelFilter(channelFilter === 'GENERAL_TRADE' ? 'ALL' : 'GENERAL_TRADE'); setPage(1); }}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${
            channelFilter === 'GENERAL_TRADE'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-surface border-border-glass hover:border-emerald-500/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <span>General Trade (GT)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{metrics.gt}</span>
        </div>

        <div
          onClick={() => { setChannelFilter(channelFilter === 'MODERN_TRADE' ? 'ALL' : 'MODERN_TRADE'); setPage(1); }}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${
            channelFilter === 'MODERN_TRADE'
              ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20'
              : 'bg-surface border-border-glass hover:border-blue-500/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 flex items-center justify-between">
            <span>Modern Trade (MT)</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </span>
          <span className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{metrics.mt}</span>
        </div>

        <div
          onClick={() => { setStatusFilter(statusFilter === 'VALID' ? 'ALL' : 'VALID'); setPage(1); }}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${
            statusFilter === 'VALID'
              ? 'bg-teal-500/10 border-teal-500 ring-2 ring-teal-500/20'
              : 'bg-surface border-border-glass hover:border-teal-500/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 flex items-center justify-between">
            <span>Sesuai Peta</span>
            <LuCircleCheck className="text-teal-600 dark:text-teal-400 text-xs" />
          </span>
          <span className="text-2xl font-black text-teal-700 dark:text-teal-300 mt-1">{metrics.valid}</span>
        </div>

        <div
          onClick={() => { setStatusFilter(statusFilter === 'WARNING' ? 'ALL' : 'WARNING'); setPage(1); }}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${
            statusFilter === 'WARNING'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-surface border-border-glass hover:border-amber-500/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>Perlu Tinjauan</span>
            <LuTriangleAlert className="text-amber-600 dark:text-amber-400 text-xs" />
          </span>
          <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{metrics.warning}</span>
        </div>

        <div
          onClick={() => { setStatusFilter(statusFilter === 'UNVALIDATED' ? 'ALL' : 'UNVALIDATED'); setPage(1); }}
          className={`p-3.5 rounded-xl border shadow-xs cursor-pointer transition-all flex flex-col justify-between ${
            statusFilter === 'UNVALIDATED'
              ? 'bg-slate-500/10 border-slate-500 ring-2 ring-slate-500/20'
              : 'bg-surface border-border-glass hover:border-slate-500/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 flex items-center justify-between">
            <span>Belum Diperiksa</span>
            <LuCircleHelp className="text-slate-600 dark:text-slate-400 text-xs" />
          </span>
          <span className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{metrics.unvalidated}</span>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="p-4 rounded-2xl bg-surface border border-border-glass shadow-xs space-y-3.5">
        {/* Channel Segmented Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-glass">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 border border-border-glass">
            <button
              type="button"
              onClick={() => { setChannelFilter('ALL'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                channelFilter === 'ALL'
                  ? 'bg-surface text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semua Channel ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => { setChannelFilter('GENERAL_TRADE'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                channelFilter === 'GENERAL_TRADE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
              <span>General Trade (GT) ({metrics.gt})</span>
            </button>
            <button
              type="button"
              onClick={() => { setChannelFilter('MODERN_TRADE'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                channelFilter === 'MODERN_TRADE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-300"></span>
              <span>Modern Trade (MT) ({metrics.mt})</span>
            </button>
          </div>

          <button
            type="button"
            disabled={loading || Boolean(busy)}
            onClick={load}
            className="px-3.5 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            <LuRefreshCw className={`text-xs ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Input & Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama, kode, alamat, pemilik..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/50 border border-border-glass text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Validation Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              aria-label="Filter status pemeriksaan"
              className="w-full px-3 py-2 rounded-xl bg-surface-container/50 border border-border-glass text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Status Pemeriksaan</option>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          {/* Klaster Filter */}
          <div>
            <select
              value={clusterFilter}
              onChange={(e) => { setClusterFilter(e.target.value); setPage(1); }}
              aria-label="Filter klaster wilayah"
              className="w-full px-3 py-2 rounded-xl bg-surface-container/50 border border-border-glass text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Klaster Wilayah</option>
              {clusterOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Result Counter Info */}
          <div className="flex items-center justify-end text-xs font-bold text-on-surface-variant px-1">
            <span>Ditemukan: <strong className="text-on-surface">{filtered.length}</strong> dari {outlets.length} outlet</span>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2">
          <LuCircleAlert className="text-sm shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Content Area: Cards Grid ── */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border-glass space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-on-surface">Memuat data validasi outlet…</p>
        </div>
      ) : paginatedOutlets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border-glass space-y-2">
          <LuStore className="text-3xl text-on-surface-variant/50 mx-auto" />
          <p className="text-sm font-bold text-on-surface">Tidak ada outlet yang cocok</p>
          <p className="text-xs text-on-surface-variant">Coba ubah kata kunci pencarian, filter status, atau filter jalur channel GT/MT.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedOutlets.map((o) => {
            const ch = o.channel || o.type || 'GENERAL_TRADE';
            const isGt = ch === 'GENERAL_TRADE';
            const statusKey = o.validationStatus || 'UNVALIDATED';
            const statusMeta = STATUS_META[statusKey] || STATUS_META.UNVALIDATED;
            const StatusIcon = statusMeta.icon;
            const subChannelLabel = SUBCHANNEL_LABELS[o.subChannel] || o.subChannel || 'Retail';
            const lat = Number(o.latitude) || 0;
            const lng = Number(o.longitude) || 0;
            const confidenceScore = o.validationConfidence;

            return (
              <article
                key={o.id}
                className="rounded-2xl bg-surface border border-border-glass shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 group"
              >
                {/* 1. Titik Map Preview */}
                <div className="p-3 pb-0">
                  <OutletMiniMapPreview
                    latitude={o.latitude}
                    longitude={o.longitude}
                    name={o.name}
                    radiusMeters={o.radiusMeters || 50}
                    channel={ch}
                  />
                </div>

                {/* 2. Detailed Store Content */}
                <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Header: Title & Code */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black text-on-surface leading-snug group-hover:text-primary transition-colors">
                          {o.name}
                        </h3>
                        {o.lockStatus === 'LOCKED' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200 flex items-center gap-1 shrink-0">
                            <LuLock className="text-[10px]" /> Terkunci
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface-container text-on-surface border border-border-glass">
                          {o.outletCode || 'TANPA KODE'}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium">
                          Klaster: <strong className="text-on-surface">{o.cluster?.name || 'Belum ada'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Channel & Status Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border-glass">
                      {/* GT / MT Channel Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider flex items-center gap-1 ${
                          isGt
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isGt ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        <span>{isGt ? 'GT (General Trade)' : 'MT (Modern Trade)'}</span>
                      </span>

                      {/* Sub-channel badge */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-on-surface border border-border-glass">
                        {subChannelLabel}
                      </span>

                      {/* Validation Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${statusMeta.badgeClass}`}
                      >
                        <StatusIcon className="text-[10px]" />
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>

                    {/* Comprehensive Store Metadata Grid */}
                    <div className="p-3 rounded-xl bg-surface-container/40 border border-border-glass/70 space-y-2 text-xs">
                      {/* Pemilik & Kontak */}
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                          <LuUser className="text-xs text-primary" /> Pemilik:
                        </span>
                        <span className="font-bold text-on-surface text-right truncate max-w-[160px]">
                          {o.ownerName || 'Belum diisi'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                          <LuPhone className="text-xs text-primary" /> Kontak / Telp:
                        </span>
                        <span className="font-mono font-bold text-on-surface text-right">
                          {o.phone || 'Belum diisi'}
                        </span>
                      </div>

                      {/* Alamat Fisik */}
                      <div className="pt-1 border-t border-border-glass/40 space-y-0.5">
                        <span className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
                          <LuMapPin className="text-xs text-primary shrink-0" /> Alamat Fisik:
                        </span>
                        <p className="text-[11px] text-on-surface font-semibold line-clamp-2 leading-relaxed">
                          {o.address || 'Alamat fisik belum diisi'}
                        </p>
                      </div>

                      {/* Koordinat GPS & Geofence Radius */}
                      <div className="pt-1 border-t border-border-glass/40 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-on-surface-variant block">Koordinat GPS:</span>
                          <span className="font-mono font-bold text-on-surface">
                            {lat !== 0 ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Belum diset'}
                          </span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block">Geofence Radius:</span>
                          <span className="font-bold text-on-surface flex items-center gap-1">
                            <LuCompass className="text-xs text-primary" /> {o.radiusMeters || 50} meter
                          </span>
                        </div>
                      </div>

                      {/* Komersial & Pembayaran */}
                      <div className="pt-1 border-t border-border-glass/40 flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <LuCreditCard className="text-xs text-primary" /> Pembayaran:
                        </span>
                        <span className="font-bold text-on-surface">
                          {o.paymentType === 'TOP' ? `TOP ${o.termOfPaymentDays || 0} Hari` : (o.paymentType || 'CASH')}
                        </span>
                      </div>
                    </div>

                    {/* Geocoding Confidence & Validation Score */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-on-surface-variant text-[11px]">Skor Akurasi Peta:</span>
                        <span
                          className={`font-mono text-xs ${
                            confidenceScore == null
                              ? 'text-on-surface-variant'
                              : confidenceScore >= 70
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : confidenceScore >= 40
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {confidenceScore != null ? `${confidenceScore}%` : 'Belum dievaluasi'}
                        </span>
                      </div>

                      {confidenceScore != null && (
                        <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              confidenceScore >= 70
                                ? 'bg-emerald-500'
                                : confidenceScore >= 40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, confidenceScore))}%` }}
                          />
                        </div>
                      )}

                      {/* Catatan hasil validasi jika ada */}
                      {o.validationDetails?.note && (
                        <p className="text-[10px] text-on-surface-variant italic line-clamp-1">
                          {o.validationDetails.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. Action Buttons */}
                  <div className="pt-3 border-t border-border-glass flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(o.id)}
                      className="flex-1 py-2 px-3 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Detail & Koreksi</span>
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => validate(o.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                    >
                      <LuRefreshCw className={`text-xs ${busy === o.id ? 'animate-spin' : ''}`} />
                      <span>{busy === o.id ? 'Memeriksa…' : o.validatedAt ? 'Periksa Ulang' : 'Periksa Peta'}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Pagination Controls ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border-glass shadow-xs">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all"
          >
            Sebelumnya
          </button>

          <span className="text-xs font-bold text-on-surface-variant">
            Halaman <strong className="text-on-surface">{currentPage}</strong> dari {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all"
          >
            Berikutnya
          </button>
        </div>
      )}

      {/* ── Detail & Correction Modal ── */}
      <OutletValidationDetail
        outlet={selectedOutlet}
        onClose={() => setSelected(null)}
        onSaved={load}
      />
    </div>
  );
}
