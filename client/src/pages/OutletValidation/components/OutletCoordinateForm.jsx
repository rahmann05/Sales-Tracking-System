import React from 'react';
import { LuCompass, LuCrosshair, LuTriangleAlert, LuRefreshCw } from 'react-icons/lu';
export function OutletCoordinateForm({
  busy,
  error,
  form,
  locate,
  locating,
  onClose,
  outlet,
  save,
  setForm
}) {
  return <form onSubmit={save} className="p-4 rounded-2xl bg-surface-container/60 border border-border-glass space-y-3.5">
          <div className="space-y-1">
            <h4 className="font-black text-on-surface text-sm flex items-center gap-1.5">
              <LuCrosshair className="text-primary text-base" />
              <span>Koreksi Titik Koordinat GPS</span>
            </h4>
            <p className="text-[11px] text-on-surface-variant">
              Pastikan Anda sedang berada di lokasi outlet fisik atau memiliki data titik koordinat yang telah diverifikasi langsung.
            </p>
          </div>

          {error && <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-2">
              <LuTriangleAlert className="text-sm shrink-0" />
              <span>{error}</span>
            </div>}

          {/* Quick Action Helpers */}
          <div className="flex flex-wrap items-center gap-2">
            {outlet.googleSuggestedLat != null && outlet.googleSuggestedLng != null && <button type="button" disabled={busy} onClick={() => setForm(f => ({
        ...f,
        latitude: String(outlet.googleSuggestedLat),
        longitude: String(outlet.googleSuggestedLng)
      }))} className="px-3 py-1.5 rounded-xl bg-surface border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs">
                <LuCompass className="text-xs text-primary" />
                <span>Pakai Rekomendasi Titik Google</span>
              </button>}

            <button type="button" disabled={busy || locating} onClick={locate} className="px-3 py-1.5 rounded-xl bg-surface border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50">
              <LuCrosshair className={`text-xs text-primary ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Mendeteksi GPS…' : 'Ambil Lokasi Perangkat Saya'}</span>
            </button>
          </div>

          {/* Lat / Lng inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Garis Lintang (Latitude)
              </label>
              <input type="number" step="any" min={-90} max={90} required value={form.latitude} onChange={e => setForm(f => ({
          ...f,
          latitude: e.target.value
        }))} placeholder="-6.837000" className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass font-mono text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Garis Bujur (Longitude)
              </label>
              <input type="number" step="any" min={-180} max={180} required value={form.longitude} onChange={e => setForm(f => ({
          ...f,
          longitude: e.target.value
        }))} placeholder="107.563000" className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass font-mono text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>

          {/* Reason / Proof Notes */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
              Alasan Koreksi & Bukti Verifikasi Lapangan (min. 10 karakter)
            </label>
            <textarea required minLength={10} maxLength={1000} rows={3} value={form.reason} onChange={e => setForm(f => ({
        ...f,
        reason: e.target.value
      }))} placeholder="Contoh: Titik lama bergeser 80m dari toko fisik. Telah diverifikasi langsung di depan toko oleh SPV." className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container transition-all">
              Batal
            </button>
            <button type="submit" disabled={busy || !form.latitude || !form.longitude || form.reason.trim().length < 10} className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50">
              <LuRefreshCw className={`text-xs ${busy ? 'animate-spin' : ''}`} />
              <span>{busy ? 'Menyimpan…' : 'Simpan Koreksi Koordinat'}</span>
            </button>
          </div>
        </form>;
}
