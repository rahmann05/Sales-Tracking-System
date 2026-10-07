import React from 'react';
import { LuMapPin, LuPhone, LuUser, LuCompass, LuCreditCard, LuRoute, LuBuilding } from 'react-icons/lu';
export function ValidationSearchPanel({
  isGt,
  latNum,
  lngNum,
  outlet,
  subChannelLabel
}) {
  return <div className="p-3.5 rounded-2xl bg-surface-container/40 border border-border-glass space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-glass">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-surface text-[10px] font-bold border border-border-glass text-on-surface flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isGt ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                <span>{isGt ? 'GT (General Trade)' : 'MT (Modern Trade)'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface text-on-surface border border-border-glass">
                {subChannelLabel}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface text-on-surface border border-border-glass">
              {outlet.outletCode || 'TANPA KODE'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <LuUser className="text-xs text-primary" /> Pemilik:
                </span>
                <span className="font-bold text-on-surface">{outlet.ownerName || 'Belum diisi'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <LuPhone className="text-xs text-primary" /> Kontak / Telp:
                </span>
                <span className="font-mono font-bold text-on-surface">{outlet.phone || 'Belum diisi'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <LuBuilding className="text-xs text-primary" /> Klaster:
                </span>
                <span className="font-bold text-on-surface">{outlet.cluster?.name || 'Tanpa klaster'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <LuCreditCard className="text-xs text-primary" /> Pembayaran:
                </span>
                <span className="font-bold text-on-surface">
                  {outlet.paymentType === 'TOP' ? `TOP ${outlet.termOfPaymentDays || 0} Hari` : outlet.paymentType || 'CASH'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <LuRoute className="text-xs text-primary" /> Rute / Itinerary:
                </span>
                <span className="font-bold text-on-surface">{outlet.itineraryCode || '-'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <LuCompass className="text-xs text-primary" /> Titik GPS:
                </span>
                <span className="font-mono font-bold text-on-surface">
                  {latNum.toFixed(5)}, {lngNum.toFixed(5)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border-glass space-y-1">
            <span className="text-on-surface-variant font-medium flex items-center gap-1">
              <LuMapPin className="text-xs text-primary shrink-0" /> Alamat Fisik Toko:
            </span>
            <p className="font-bold text-on-surface leading-relaxed">
              {outlet.address || 'Alamat fisik belum diisi'}
            </p>
          </div>
        </div>;
}
