import { ValidationSearchPanel } from './ValidationSearchPanel';
import { OutletCoordinateForm } from './OutletCoordinateForm';
import React, { useEffect, useState } from 'react';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { outletValidationApi } from '../../../services/api';
import { OutletMiniMapPreview } from './OutletMiniMapPreview';
import { LuExternalLink, LuHistory, LuTriangleAlert, LuInfo } from 'react-icons/lu';
const SIGNALS = {
  reverseGeocode: 'Alamat di Titik GPS',
  forwardGeocode: 'Titik Berdasarkan Alamat',
  findPlace: 'Profil & Identitas Toko',
  nearbySearch: 'Tempat di Sekitar Titik GPS'
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
export function OutletValidationDetail({
  outlet,
  onClose,
  onSaved
}) {
  const [form, setForm] = useState({
    latitude: '',
    longitude: '',
    reason: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  useEffect(() => {
    if (outlet) {
      setForm({
        latitude: String(outlet.latitude ?? ''),
        longitude: String(outlet.longitude ?? ''),
        reason: ''
      });
      setError('');
    }
  }, [outlet]);
  const save = async e => {
    e.preventDefault();
    if (!outlet) return;
    setBusy(true);
    setError('');
    try {
      await outletValidationApi.correctCoordinates(outlet.id, {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        reason: form.reason.trim(),
        updatedAt: outlet.updatedAt
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
    navigator.geolocation.getCurrentPosition(pos => {
      setForm(f => ({
        ...f,
        latitude: String(pos.coords.latitude.toFixed(6)),
        longitude: String(pos.coords.longitude.toFixed(6))
      }));
      setLocating(false);
    }, err => {
      setError(err.message || 'Gagal membaca koordinat GPS perangkat.');
      setLocating(false);
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
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
  return <NativeDialog open={Boolean(outlet)} title={`Detail & Validasi: ${outlet.name}`} busy={busy} onClose={onClose}>
      <div className="space-y-5 text-on-surface text-xs">
        {/* ── 1. Map Preview Section ── */}
        <div className="space-y-1.5">
          <OutletMiniMapPreview latitude={outlet.latitude} longitude={outlet.longitude} name={outlet.name} radiusMeters={outlet.radiusMeters || 50} channel={ch} />
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Geofence Radius Presensi: <strong>{outlet.radiusMeters || 50} meter</strong>
            </span>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
              <span>Buka di Google Maps</span>
              <LuExternalLink className="text-[10px]" />
            </a>
          </div>
        </div>

        {/* ── 2. Comprehensive Store Information Grid ── */}
        <ValidationSearchPanel isGt={isGt} latNum={latNum} lngNum={lngNum} outlet={outlet} subChannelLabel={subChannelLabel} />

        {/* ── 3. Geocoding Validation Signals & Analysis ── */}
        {outlet.validationDetails?.note && <div className="p-3 rounded-xl bg-surface-container/60 border border-border-glass flex items-start gap-2.5">
            <LuInfo className="text-primary text-sm shrink-0 mt-0.5" />
            <p className="text-on-surface font-medium">
              {outlet.validationDetails.note}
            </p>
          </div>}

        {Object.keys(signals).length > 0 && <div className="space-y-2">
            <h4 className="font-black text-on-surface text-xs uppercase tracking-wider">
              Sinyal Verifikasi Geocoding
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(signals).map(([key, s]) => <div key={key} className="p-3 rounded-xl bg-surface border border-border-glass shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface">{SIGNALS[key] || key}</span>
                    <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-md border ${s.skipped ? 'bg-surface-container text-on-surface-variant border-border-glass' : s.score >= 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : s.score >= 40 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                      {s.skipped ? 'Dilewati' : `Skor: ${s.score ?? 0}%`}
                    </span>
                  </div>
                  {s.formattedAddress && <p className="text-[11px] text-on-surface-variant truncate">
                      {s.formattedAddress}
                    </p>}
                  {s.distanceMeters != null && <p className="text-[11px] text-on-surface-variant font-medium">
                      Selisih titik: <strong>{Math.round(s.distanceMeters)} m</strong>
                    </p>}
                </div>)}
            </div>
          </div>}

        {warnings.length > 0 && <div className="space-y-1.5">
            {warnings.map((w, idx) => <div key={idx} className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-start gap-2 text-[11px]">
                <LuTriangleAlert className="text-amber-500 shrink-0 text-sm mt-0.5" />
                <span>{w}</span>
              </div>)}
          </div>}

        {/* ── 4. GPS Coordinate Correction Form ── */}
        <OutletCoordinateForm busy={busy} error={error} form={form} locate={locate} locating={locating} onClose={onClose} outlet={outlet} save={save} setForm={setForm} />

        {/* ── 5. Coordinate Correction Audit History ── */}
        {history.length > 0 && <div className="space-y-2 pt-2 border-t border-border-glass">
            <h4 className="font-black text-on-surface text-xs uppercase tracking-wider flex items-center gap-1.5">
              <LuHistory className="text-primary text-sm" />
              <span>Riwayat Perubahan Koordinat GPS ({history.length})</span>
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {history.map((h, i) => <div key={i} className="p-2.5 rounded-xl bg-surface border border-border-glass shadow-xs text-[11px] flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-on-surface block">{h.reason}</span>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      Titik: {h.latitude}, {h.longitude}
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                    {h.at ? new Date(h.at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
                  </span>
                </div>)}
            </div>
          </div>}
      </div>
    </NativeDialog>;
}
