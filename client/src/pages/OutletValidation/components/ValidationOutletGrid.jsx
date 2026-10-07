import React from 'react';
import { OutletMiniMapPreview } from './OutletMiniMapPreview';
import { LuRefreshCw, LuMapPin, LuPhone, LuUser, LuCompass, LuCreditCard, LuLock } from 'react-icons/lu';
export function ValidationOutletGrid({
  STATUS_META,
  SUBCHANNEL_LABELS,
  busy,
  paginatedOutlets,
  setSelected,
  validate
}) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedOutlets.map(o => {
      const ch = o.channel || o.type || 'GENERAL_TRADE';
      const isGt = ch === 'GENERAL_TRADE';
      const statusKey = o.validationStatus || 'UNVALIDATED';
      const statusMeta = STATUS_META[statusKey] || STATUS_META.UNVALIDATED;
      const StatusIcon = statusMeta.icon;
      const subChannelLabel = SUBCHANNEL_LABELS[o.subChannel] || o.subChannel || 'Retail';
      const lat = Number(o.latitude) || 0;
      const lng = Number(o.longitude) || 0;
      const confidenceScore = o.validationConfidence;
      return <article key={o.id} className="rounded-2xl bg-surface border border-border-glass shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 group">
                {/* 1. Titik Map Preview */}
                <div className="p-3 pb-0">
                  <OutletMiniMapPreview latitude={o.latitude} longitude={o.longitude} name={o.name} radiusMeters={o.radiusMeters || 50} channel={ch} />
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
                        {o.lockStatus === 'LOCKED' && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200 flex items-center gap-1 shrink-0">
                            <LuLock className="text-[10px]" /> Terkunci
                          </span>}
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
                      <span className="px-2 py-0.5 rounded-md bg-surface-container text-[10px] font-bold border border-border-glass text-on-surface flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isGt ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        <span>{isGt ? 'GT (General Trade)' : 'MT (Modern Trade)'}</span>
                      </span>

                      {/* Sub-channel badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container/60 text-on-surface border border-border-glass">
                        {subChannelLabel}
                      </span>

                      {/* Validation Status Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${statusMeta.badgeClass}`}>
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
                          {o.paymentType === 'TOP' ? `TOP ${o.termOfPaymentDays || 0} Hari` : o.paymentType || 'CASH'}
                        </span>
                      </div>
                    </div>

                    {/* Geocoding Confidence & Validation Score */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-on-surface-variant text-[11px]">Skor Akurasi Peta:</span>
                        <span className={`font-mono text-xs ${confidenceScore == null ? 'text-on-surface-variant' : confidenceScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : confidenceScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {confidenceScore != null ? `${confidenceScore}%` : 'Belum dievaluasi'}
                        </span>
                      </div>

                      {confidenceScore != null && <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${confidenceScore >= 70 ? 'bg-emerald-500' : confidenceScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{
                  width: `${Math.min(100, Math.max(5, confidenceScore))}%`
                }} />
                        </div>}

                      {/* Catatan hasil validasi jika ada */}
                      {o.validationDetails?.note && <p className="text-[10px] text-on-surface-variant italic line-clamp-1">
                          {o.validationDetails.note}
                        </p>}
                    </div>
                  </div>

                  {/* 3. Action Buttons */}
                  <div className="pt-3 border-t border-border-glass flex items-center gap-2">
                    <button type="button" onClick={() => setSelected(o.id)} className="flex-1 py-2 px-3 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition-all shadow-xs">
                      <span>Detail & Koreksi</span>
                    </button>

                    <button type="button" disabled={Boolean(busy)} onClick={() => validate(o.id)} className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50">
                      <LuRefreshCw className={`text-xs ${busy === o.id ? 'animate-spin' : ''}`} />
                      <span>{busy === o.id ? 'Memeriksa…' : o.validatedAt ? 'Periksa Ulang' : 'Periksa Peta'}</span>
                    </button>
                  </div>
                </div>
              </article>;
    })}
        </div>;
}
