import React from 'react';
import { LuSearch, LuRefreshCw } from 'react-icons/lu';
export function ValidationFilters({
  STATUS_META,
  busy,
  channelFilter,
  clusterFilter,
  clusterOptions,
  filtered,
  load,
  loading,
  metrics,
  outlets,
  search,
  setChannelFilter,
  setClusterFilter,
  setPage,
  setSearch,
  setStatusFilter,
  statusFilter
}) {
  return <div className="p-4 rounded-2xl bg-surface border border-border-glass shadow-xs space-y-3.5">
        {/* Channel Segmented Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-glass">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 border border-border-glass">
            <button type="button" onClick={() => {
          setChannelFilter('ALL');
          setPage(1);
        }} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${channelFilter === 'ALL' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
              Semua Channel ({metrics.total})
            </button>
            <button type="button" onClick={() => {
          setChannelFilter('GENERAL_TRADE');
          setPage(1);
        }} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${channelFilter === 'GENERAL_TRADE' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>General Trade (GT) ({metrics.gt})</span>
            </button>
            <button type="button" onClick={() => {
          setChannelFilter('MODERN_TRADE');
          setPage(1);
        }} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${channelFilter === 'MODERN_TRADE' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Modern Trade (MT) ({metrics.mt})</span>
            </button>
          </div>

          <button type="button" disabled={loading || Boolean(busy)} onClick={load} className="px-3.5 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer">
            <LuRefreshCw className={`text-xs ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Input & Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
            <input type="search" value={search} onChange={e => {
          setSearch(e.target.value);
          setPage(1);
        }} placeholder="Cari nama, kode, alamat, pemilik..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/50 border border-border-glass text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          {/* Validation Status Filter */}
          <div>
            <select value={statusFilter} onChange={e => {
          setStatusFilter(e.target.value);
          setPage(1);
        }} aria-label="Filter status pemeriksaan" className="w-full px-3 py-2 rounded-xl bg-surface-container/50 border border-border-glass text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
              <option value="ALL">Semua Status Pemeriksaan</option>
              {Object.entries(STATUS_META).map(([key, meta]) => <option key={key} value={key}>
                  {meta.label}
                </option>)}
            </select>
          </div>

          {/* Klaster Filter */}
          <div>
            <select value={clusterFilter} onChange={e => {
          setClusterFilter(e.target.value);
          setPage(1);
        }} aria-label="Filter klaster wilayah" className="w-full px-3 py-2 rounded-xl bg-surface-container/50 border border-border-glass text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
              <option value="ALL">Semua Klaster Wilayah</option>
              {clusterOptions.map(c => <option key={c.id} value={c.id}>
                  {c.name}
                </option>)}
            </select>
          </div>

          {/* Result Counter Info */}
          <div className="flex items-center justify-end text-xs font-bold text-on-surface-variant px-1">
            <span>Ditemukan: <strong className="text-on-surface">{filtered.length}</strong> dari {outlets.length} outlet</span>
          </div>
        </div>
      </div>;
}
