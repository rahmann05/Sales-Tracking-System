import React, { useEffect, useState } from 'react';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { outletValidationApi } from '../../../services/api';
import { OutletMiniMapPreview } from './OutletMiniMapPreview';
import {
  LuStore,
  LuMapPin,
  LuPhone,
  LuUser,
  LuCompass,
  LuCreditCard,
  LuRoute,
  LuBuilding,
  LuExternalLink,
  LuCrosshair,
  LuHistory,
  LuTriangleAlert,
  LuRefreshCw,
  LuInfo,
} from 'react-icons/lu';

const SIGNALS = {
  reverseGeocode: 'Alamat di Titik GPS',
  forwardGeocode: 'Titik Berdasarkan Alamat',
  findPlace: 'Profil & Identitas Toko',
  nearbySearch: 'Tempat di Sekitar Titik GPS',
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

export function OutletValidationDetail({ outlet, onClose, onSaved }) {
  const [form, setForm] = useState({ latitude: '', longitude: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (outlet) {
      setForm({
        latitude: String(outlet.latitude ?? ''),
        longitude: String(outlet.longitude ?? ''),
        reason: '',
      });
      setError('');
    }
  }, [outlet]);

  const save = async (e) => {
    e.preventDefault();
    if (!outlet) return;

    setBusy(true);
    setError('');
    try {
      await outletValidationApi.correctCoordinates(outlet.id, {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        reason: form.reason.trim(),
        updatedAt: outlet.updatedAt,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan koreksi GPS');
    } finally {
      setBusy(false);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setError('GPS tidak didukung oleh browser pada perangkat ini.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude.toFixed(6)),
          longitude: String(pos.coords.longitude.toFixed(6)),
        }));
        setLocating(false);
      },
      (err) => {
        setError(err.message || 'Gagal membaca koordinat GPS perangkat.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (!outlet) return null;

  const ch = outlet.channel || outlet.type || 'GENERAL_TRADE';
  const isGt = ch === 'GENERAL_TRADE';
  const subChannelLabel = SUBCHANNEL_LABELS[outlet.subChannel] || outlet.subChannel || 'Retail';
  const latNum = Number(outlet.latitude) || 0;
  const lngNum = Number(outlet.longitude) || 0;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`;
  const history = outlet.validationDetails?.coordinateHistory || [];
  const signals = outlet.validationDetails?.signals || {};
  const warnings = outlet.validationDetails?.warnings || [];

  return (
    <NativeDialog
      open={Boolean(outlet)}
      title={`Detail & Validasi: ${outlet.name}`}
      busy={busy}
      onClose={onClose}
    >
      <div className="space-y-5 text-on-surface text-xs">
        {/* ── 1. Map Preview Section ── */}
        <div className="space-y-1.5">
          <OutletMiniMapPreview
            latitude={outlet.latitude}
            longitude={outlet.longitude}
            name={outlet.name}
            radiusMeters={outlet.radiusMeters || 50}
            channel={ch}
          />
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Geofence Radius Presensi: <strong>{outlet.radiusMeters || 50} meter</strong>
            </span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Buka di Google Maps</span>
              <LuExternalLink className="text-[10px]" />
            </a>
          </div>
        </div>

        {/* ── 2. Comprehensive Store Information Grid ── */}
        <div className="p-3.5 rounded-2xl bg-surface-container/40 border border-border-glass space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-glass">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                  isGt
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                }`}
              >
                {isGt ? 'GT (General Trade)' : 'MT (Modern Trade)'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface border border-border-glass">
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
                  {outlet.paymentType === 'TOP' ? `TOP ${outlet.termOfPaymentDays || 0} Hari` : (outlet.paymentType || 'CASH')}
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
        </div>

        {/* ── 3. Geocoding Validation Signals & Analysis ── */}
        {outlet.validationDetails?.note && (
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/50 flex items-start gap-2.5">
            <LuInfo className="text-blue-600 dark:text-blue-400 text-sm shrink-0 mt-0.5" />
            <p className="text-blue-900 dark:text-blue-200 font-medium">
              {outlet.validationDetails.note}
            </p>
          </div>
        )}

        {Object.keys(signals).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-black text-on-surface text-xs uppercase tracking-wider">
              Sinyal Verifikasi Geocoding
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(signals).map(([key, s]) => (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-surface border border-border-glass shadow-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface">{SIGNALS[key] || key}</span>
                    <span
                      className={`font-mono font-black text-[11px] px-1.5 py-0.5 rounded ${
                        s.skipped
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : s.score >= 70
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : s.score >= 40
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {s.skipped ? 'Dilewati' : `Skor: ${s.score ?? 0}%`}
                    </span>
                  </div>
                  {s.formattedAddress && (
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {s.formattedAddress}
                    </p>
                  )}
                  {s.distanceMeters != null && (
                    <p className="text-[11px] text-on-surface-variant font-medium">
                      Selisih titik: <strong>{Math.round(s.distanceMeters)} m</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-1.5">
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-start gap-2 text-[11px]"
              >
                <LuTriangleAlert className="text-amber-600 shrink-0 text-sm mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── 4. GPS Coordinate Correction Form ── */}
        <form onSubmit={save} className="p-4 rounded-2xl bg-surface-container/60 border border-border-glass space-y-3.5">
          <div className="space-y-1">
            <h4 className="font-black text-on-surface text-sm flex items-center gap-1.5">
              <LuCrosshair className="text-primary text-base" />
              <span>Koreksi Titik Koordinat GPS</span>
            </h4>
            <p className="text-[11px] text-on-surface-variant">
              Pastikan Anda sedang berada di lokasi outlet fisik atau memiliki data titik koordinat yang telah diverifikasi langsung.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-2">
              <LuTriangleAlert className="text-sm shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Action Helpers */}
          <div className="flex flex-wrap items-center gap-2">
            {outlet.googleSuggestedLat != null && outlet.googleSuggestedLng != null && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    latitude: String(outlet.googleSuggestedLat),
                    longitude: String(outlet.googleSuggestedLng),
                  }))
                }
                className="px-3 py-1.5 rounded-xl bg-surface border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs"
              >
                <LuCompass className="text-xs text-primary" />
                <span>Pakai Rekomendasi Titik Google</span>
              </button>
            )}

            <button
              type="button"
              disabled={busy || locating}
              onClick={locate}
              className="px-3 py-1.5 rounded-xl bg-surface border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            >
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
              <input
                type="number"
                step="any"
                min={-90}
                max={90}
                required
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                placeholder="-6.837000"
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass font-mono text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Garis Bujur (Longitude)
              </label>
              <input
                type="number"
                step="any"
                min={-180}
                max={180}
                required
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                placeholder="107.563000"
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass font-mono text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Reason / Proof Notes */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
              Alasan Koreksi & Bukti Verifikasi Lapangan (min. 10 karakter)
            </label>
            <textarea
              required
              minLength={10}
              maxLength={1000}
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Contoh: Titik lama bergeser 80m dari toko fisik. Telah diverifikasi langsung di depan toko oleh SPV."
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy || !form.latitude || !form.longitude || form.reason.trim().length < 10}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            >
              <LuRefreshCw className={`text-xs ${busy ? 'animate-spin' : ''}`} />
              <span>{busy ? 'Menyimpan…' : 'Simpan Koreksi Koordinat'}</span>
            </button>
          </div>
        </form>

        {/* ── 5. Coordinate Correction Audit History ── */}
        {history.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border-glass">
            <h4 className="font-black text-on-surface text-xs uppercase tracking-wider flex items-center gap-1.5">
              <LuHistory className="text-primary text-sm" />
              <span>Riwayat Perubahan Koordinat GPS ({history.length})</span>
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-surface border border-border-glass shadow-xs text-[11px] flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-on-surface block">{h.reason}</span>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      Titik: {h.latitude}, {h.longitude}
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                    {h.at ? new Date(h.at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </NativeDialog>
  );
}
