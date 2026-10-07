import { ValidationSummary } from './ValidationSummary';
import { ValidationFilters } from './ValidationFilters';
import { ValidationOutletGrid } from './ValidationOutletGrid';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { outletsApi, outletValidationApi, collectPages } from '../../../services/api';
import { OutletValidationDetail } from './OutletValidationDetail';
import { LuStore, LuCompass, LuCircleCheck, LuTriangleAlert, LuCircleAlert, LuCircleHelp } from 'react-icons/lu';
const STATUS_META = {
  VALID: {
    label: 'Sesuai peta',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: LuCircleCheck
  },
  LIKELY_VALID: {
    label: 'Cenderung sesuai',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: LuCircleCheck
  },
  WARNING: {
    label: 'Perlu tinjauan',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: LuTriangleAlert
  },
  SUSPECT: {
    label: 'Perlu koreksi',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: LuCircleAlert
  },
  INCOMPLETE: {
    label: 'Data belum lengkap',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: LuTriangleAlert
  },
  UNVALIDATED: {
    label: 'Belum diperiksa',
    badgeClass: 'bg-surface-container text-on-surface-variant border-border-glass',
    icon: LuCircleHelp
  }
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
  PERKULAKAN: 'Perkulakan'
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
    outlets.forEach(o => {
      if (o.cluster?.id) {
        map.set(o.cluster.id, o.cluster.name || 'Klaster');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name
    }));
  }, [outlets]);

  // High-level metrics counters
  const metrics = useMemo(() => {
    const total = outlets.length;
    let gt = 0;
    let mt = 0;
    let valid = 0;
    let warning = 0;
    let unvalidated = 0;
    outlets.forEach(o => {
      const ch = o.channel || o.type || 'GENERAL_TRADE';
      if (ch === 'GENERAL_TRADE') gt++;else if (ch === 'MODERN_TRADE') mt++;
      const st = o.validationStatus || 'UNVALIDATED';
      if (st === 'VALID' || st === 'LIKELY_VALID') valid++;else if (st === 'WARNING' || st === 'SUSPECT') warning++;else unvalidated++;
    });
    return {
      total,
      gt,
      mt,
      valid,
      warning,
      unvalidated
    };
  }, [outlets]);

  // Filtered outlets
  const filtered = useMemo(() => {
    return outlets.filter(o => {
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
  const validate = async id => {
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
  const selectedOutlet = selected ? outlets.find(o => o.id === selected) : null;
  return <div className="space-y-6">
      {/* ── Guidance Banner ── */}
      <div className="p-3.5 rounded-2xl bg-surface-container/60 border border-border-glass flex items-start gap-3">
        <LuCompass className="text-primary text-base shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5 text-on-surface-variant">
          <span className="font-bold text-on-surface">Panduan Validasi & Geocoding Titik Toko: </span>
          <span>
            Perbandingan peta membantu menemukan ketidaksesuaian nama toko, alamat tertulis, dan koordinat GPS.
            Gunakan filter <strong>GT</strong> dan <strong>MT</strong> untuk meninjau masing-masing jalur distribusi.
            Koreksi koordinat harus selalu didukung dengan pengecekan lokasi fisik di lapangan.
          </span>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <ValidationSummary channelFilter={channelFilter} metrics={metrics} setChannelFilter={setChannelFilter} setPage={setPage} setStatusFilter={setStatusFilter} statusFilter={statusFilter} />

      {/* ── Filters & Search Toolbar ── */}
      <ValidationFilters STATUS_META={STATUS_META} busy={busy} channelFilter={channelFilter} clusterFilter={clusterFilter} clusterOptions={clusterOptions} filtered={filtered} load={load} loading={loading} metrics={metrics} outlets={outlets} search={search} setChannelFilter={setChannelFilter} setClusterFilter={setClusterFilter} setPage={setPage} setSearch={setSearch} setStatusFilter={setStatusFilter} statusFilter={statusFilter} />

      {/* ── Error Banner ── */}
      {error && <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2">
          <LuCircleAlert className="text-sm shrink-0" />
          <span>{error}</span>
        </div>}

      {/* ── Main Content Area: Cards Grid ── */}
      {loading ? <div className="p-12 text-center rounded-2xl bg-surface border border-border-glass space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-on-surface">Memuat data validasi outlet…</p>
        </div> : paginatedOutlets.length === 0 ? <div className="p-12 text-center rounded-2xl bg-surface border border-border-glass space-y-2">
          <LuStore className="text-3xl text-on-surface-variant/50 mx-auto" />
          <p className="text-sm font-bold text-on-surface">Tidak ada outlet yang cocok</p>
          <p className="text-xs text-on-surface-variant">Coba ubah kata kunci pencarian, filter status, atau filter jalur channel GT/MT.</p>
        </div> : <ValidationOutletGrid STATUS_META={STATUS_META} SUBCHANNEL_LABELS={SUBCHANNEL_LABELS} busy={busy} paginatedOutlets={paginatedOutlets} setSelected={setSelected} validate={validate} />}

      {/* ── Pagination Controls ── */}
      {totalPages > 1 && <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border-glass shadow-xs">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all">
            Sebelumnya
          </button>

          <span className="text-xs font-bold text-on-surface-variant">
            Halaman <strong className="text-on-surface">{currentPage}</strong> dari {totalPages}
          </span>

          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 transition-all">
            Berikutnya
          </button>
        </div>}

      {/* ── Detail & Correction Modal ── */}
      <OutletValidationDetail outlet={selectedOutlet} onClose={() => setSelected(null)} onSaved={load} />
    </div>;
}
