import React from 'react';
import { LuSearch, LuDownload, LuCheck, LuStore } from "react-icons/lu";
import { FiAlertCircle } from 'react-icons/fi';
/**
 * NikManagementModal Component
 * Single Responsibility: Manage NIK input, 16-digit verification, and export to official IMPORT NIK.xls
 */
export function NikRegistryList({
  customerList,
  filterNikStatus,
  filteredList,
  handleExportFiltered,
  handleSelectOutlet,
  search,
  selectedOutlet,
  setFilterNikStatus,
  setSearch,
  validNikCount
}) {
  return <div className="md:col-span-7 border-r border-border-glass p-4 flex flex-col gap-3 overflow-hidden bg-surface-container/20">
            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setFilterNikStatus('ALL')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterNikStatus === 'ALL' ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'}`}>
                  Semua ({customerList.length})
                </button>
                <button type="button" onClick={() => setFilterNikStatus('HAS_NIK')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterNikStatus === 'HAS_NIK' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface-container text-emerald-700 hover:bg-emerald-500/10'}`}>
                  NIK Lengkap ({validNikCount})
                </button>
                <button type="button" onClick={() => setFilterNikStatus('NO_NIK')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterNikStatus === 'NO_NIK' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-container text-amber-700 hover:bg-emerald-500/10'}`}>
                  Belum Ada NIK ({customerList.length - validNikCount})
                </button>
              </div>

              {filteredList.length !== customerList.length && <button type="button" onClick={handleExportFiltered} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer">
                  <LuDownload className="text-xs" /> Unduh ({filteredList.length})
                </button>}
            </div>

            {/* Search Box */}
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs" />
              <input type="text" placeholder="Cari kode toko, nama outlet, atau NIK..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none" />
            </div>

            {/* Outlet Table List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[420px]">
              {filteredList.map(item => {
        const code = item.customerCode || item.outletCode || '-';
        const name = item.name || item.customerName || '-';
        const rawNik = String(item.taxNumber || item.nik || '').replace(/[^0-9]/g, '');
        const hasValidNik = rawNik.length === 16;
        const isSelected = selectedOutlet?.id === item.id;
        return <div key={item.id} onClick={() => handleSelectOutlet(item)} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected ? 'bg-primary/10 border-primary shadow-xs' : 'bg-surface hover:bg-surface-container border-border-glass'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${hasValidNik ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'}`}>
                        <LuStore />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10">
                            {code}
                          </span>
                          <h4 className="text-xs font-black text-on-surface min-w-0 whitespace-normal break-words m-0">
                            {name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-mono mt-0.5">
                          {hasValidNik ? <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <LuCheck className="text-xs" /> NIK: {rawNik}
                            </span> : <span className="text-amber-700 font-bold flex items-center gap-1">
                              <FiAlertCircle className="text-xs" /> NIK Belum 16 Digit ({rawNik.length} digit)
                            </span>}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs text-primary font-black shrink-0">
                      {isSelected ? 'Aktif' : 'Pilih \u2192'}
                    </span>
                  </div>;
      })}

              {filteredList.length === 0 && <div className="py-12 text-center text-xs text-on-surface-variant">
                  Tidak ada data outlet yang sesuai dengan pencarian.
                </div>}
            </div>
          </div>;
}
