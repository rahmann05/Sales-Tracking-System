import { DataTable } from '../../shared/components/common/DataTable';
import React from 'react';
import { LuSearch, LuFilter, LuTrash2, LuMapPin, LuExternalLink } from "react-icons/lu";
import { FiEdit } from "react-icons/fi";
import { Card } from '../../shared/components/common/Card';
import { googlePlacesService } from '../../services/googlePlacesService';
export function OutletDirectory({
  clusters,
  filteredOutlets,
  handleDelete,
  loading,
  openEditModal,
  outlets,
  searchQuery,
  selectedCluster,
  setSearchQuery,
  setSelectedCluster
}) {
  return <Card className="!p-0 rounded-3xl border border-border-glass overflow-hidden shadow-sm">
        {/* Workspace Toolbar: Search & Filter */}
        <div className="p-4 border-b border-border-glass bg-surface-container/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 workspace-toolbar-mobile">
          <div className="relative flex-1">
            <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari toko berdasarkan nama, kode, atau alamat..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LuFilter className="text-on-surface-variant text-sm shrink-0" />
            <select value={selectedCluster} onChange={e => setSelectedCluster(e.target.value)} className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-surface border border-border-glass text-xs text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs">
              <option value="ALL">Semua Klaster ({outlets.length})</option>
              {clusters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-surface border-b border-border-glass flex items-center justify-between">
          <span className="text-[11px] font-semibold text-on-surface-variant">
            Menampilkan <strong className="text-on-surface">{filteredOutlets.length}</strong> dari total {outlets.length} outlet
          </span>
        </div>

        {loading ? <div className="p-12 text-center text-xs text-on-surface-variant">Memuat data master outlet dari PostgreSQL...</div> : filteredOutlets.length === 0 ? <div className="p-12 text-center text-xs text-on-surface-variant">Tidak ada outlet yang sesuai dengan pencarian.</div> : <div className="overflow-x-auto md:max-h-[600px] md:overflow-y-auto mobile-card-table-wrapper">
            <DataTable className="w-full text-left text-xs border-collapse mobile-card-table">
              <thead className="bg-surface-variant/30 text-on-surface-variant font-bold border-b border-border-glass sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="">Kode & Nama Toko</th>
                  <th className="">Alamat</th>
                  <th className="">Klaster</th>
                  <th className="">Koordinat GPS</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-glass">
                {filteredOutlets.slice(0, 50).map(outlet => <tr key={outlet.id} className="hover:bg-surface-variant/10 transition-colors">
                    <td data-label="Nama Toko" className="">
                      <button type="button" onClick={() => googlePlacesService.openInGoogleMaps(outlet, outlets)} className="font-bold text-on-surface hover:text-primary hover:underline flex items-center gap-1 cursor-pointer text-left bg-transparent border-none p-0" title="Buka titik koordinat di Google Maps">
                        <span>{outlet.name}</span>
                        <LuExternalLink className="text-xs text-primary/70 shrink-0" />
                      </button>
                      <div className="text-[10px] text-on-surface-variant font-mono">{outlet.outletCode || 'Belum memiliki kode'}</div>
                    </td>
                    <td data-label="Alamat" className="text-on-surface-variant md:max-w-[220px] md:min-w-0 whitespace-normal break-words" title={outlet.address}>
                      {outlet.address || '-'}
                    </td>
                    <td data-label="Klaster" className="">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {outlet.cluster?.name || 'Klaster Belfoods'}
                      </span>
                    </td>
                    <td data-label="GPS" className="font-mono text-[11px] text-on-surface-variant">
                      <button type="button" onClick={() => googlePlacesService.openInGoogleMaps(outlet, outlets)} className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0" title="Buka titik koordinat di Google Maps">
                        <LuMapPin className="text-xs shrink-0" />
                        <span>{outlet.latitude != null ? Number(outlet.latitude).toFixed(4) : '-'}, {outlet.longitude != null ? Number(outlet.longitude).toFixed(4) : '-'}</span>
                      </button>
                    </td>
                    <td className="text-center mobile-full-width">
                      <div className="flex items-center justify-center gap-2 w-full">
                        <button type="button" onClick={() => openEditModal(outlet)} className="flex-1 md:flex-initial py-2 md:py-1.5 px-3 rounded-lg bg-surface-variant/40 hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-all cursor-pointer flex items-center justify-center gap-1 font-bold text-xs" title="Edit Outlet">
                          <FiEdit className="text-sm" /> Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(outlet)} className="flex-1 md:flex-initial py-2 md:py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-all cursor-pointer flex items-center justify-center gap-1 font-bold text-xs" title="Hapus Outlet">
                          <LuTrash2 className="text-sm" /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </DataTable>
          </div>}
      </Card>;
}
