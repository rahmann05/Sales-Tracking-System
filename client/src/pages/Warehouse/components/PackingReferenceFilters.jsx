import React from 'react';
import { LuSearch, LuUser, LuCalendar } from 'react-icons/lu';
export function PackingReferenceFilters({
  availableDates,
  availableSales,
  dateFilter,
  filteredOrders,
  result,
  salesFilter,
  search,
  setDateFilter,
  setSalesFilter,
  setSearch,
  todayStr
}) {
  return <div className="p-3.5 rounded-xl bg-surface-container/40 border border-border-glass space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* 1. Filter Hari / Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 flex items-center gap-1">
              <LuCalendar className="text-xs text-primary" />
              <span>Segmentasi Tanggal:</span>
            </label>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer">
              <option value="ALL">Semua Tanggal Transaksi</option>
              {availableDates.map(d => <option key={d} value={d}>
                  {new Date(d).toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}{' '}
                  {d === todayStr ? '(Hari Ini)' : ''}
                </option>)}
            </select>
          </div>

          {/* 2. Filter Sales Person */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 flex items-center gap-1">
              <LuUser className="text-xs text-primary" />
              <span>Segmentasi Sales:</span>
            </label>
            <select value={salesFilter} onChange={e => setSalesFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer">
              <option value="ALL">Semua Sales Person</option>
              {availableSales.map(s => <option key={s.id} value={s.id}>
                  {s.name}
                </option>)}
            </select>
          </div>

          {/* 3. Search Box */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 flex items-center gap-1">
              <LuSearch className="text-xs text-primary" />
              <span>Pencarian Toko / SKU Produk:</span>
            </label>
            <div className="relative">
              <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ketik nama outlet, kode, atau produk..." className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
              <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Date Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-glass/40 text-xs">
          <span className="text-[11px] text-on-surface-variant font-medium">Pintas Cepat:</span>
          <button type="button" onClick={() => setDateFilter('ALL')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${dateFilter === 'ALL' ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container text-on-surface border border-border-glass'}`}>
            Semua Hari ({result.data?.length || 0})
          </button>
          {availableDates.includes(todayStr) && <button type="button" onClick={() => setDateFilter(todayStr)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${dateFilter === todayStr ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container text-on-surface border border-border-glass'}`}>
              Hari Ini
            </button>}
          <span className="text-[11px] text-on-surface-variant ml-auto font-bold">
            Menampilkan: <strong className="text-on-surface">{filteredOrders.length}</strong> pesanan
          </span>
        </div>
      </div>;
}
