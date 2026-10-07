import React from 'react';
import { LuStore, LuRefreshCw, LuSearch } from 'react-icons/lu';
export function PackingOutletSection({
  doc,
  outlet,
  outlets,
  search,
  searchingOutlets,
  setOutlet,
  setOutlets,
  setSearch,
  sourceOrderId
}) {
  return <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <LuStore className="text-primary text-sm" />
            <span>Toko / Outlet Tujuan</span>
          </label>

          {outlet ? <div className="p-3.5 rounded-xl bg-surface-container/60 border border-border-glass flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <strong className="text-sm text-on-surface font-black">{outlet.name}</strong>
                  {outlet.outletCode && <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface border border-border-glass font-bold">
                      {outlet.outletCode}
                    </span>}
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-1">
                  {outlet.address || 'Alamat tidak tersedia'}
                </p>
              </div>

              {!sourceOrderId && !doc && <button type="button" onClick={() => setOutlet(null)} className="px-3 py-1.5 rounded-lg border border-border-glass hover:bg-surface text-xs font-bold text-primary transition-all shrink-0">
                  Ganti Toko
                </button>}
            </div> : <div className="space-y-2 relative">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ketik minimal 2 huruf nama atau kode toko..." className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-container/40 border border-border-glass text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all" />
                {searchingOutlets && <LuRefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xs animate-spin" />}
              </div>

              {outlets.length > 0 && <div className="max-h-56 overflow-y-auto rounded-xl border border-border-glass bg-surface shadow-lg divide-y divide-border-glass">
                  {outlets.map(o => <button key={o.id} type="button" onClick={() => {
          setOutlet(o);
          setSearch('');
          setOutlets([]);
        }} className="w-full p-2.5 text-left hover:bg-surface-container flex flex-col gap-0.5 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">{o.name}</span>
                        <span className="text-[10px] font-mono text-on-surface-variant">{o.outletCode}</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant truncate">{o.address}</span>
                    </button>)}
                </div>}
            </div>}
        </div>;
}
