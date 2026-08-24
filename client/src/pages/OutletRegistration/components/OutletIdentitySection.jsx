import React, { useEffect, useRef, useState } from 'react';
import {
  LuStore,
  LuSparkles,
  LuMapPin,
  LuStar,
  LuCheck,
  LuRefreshCw,
  LuClock,
} from 'react-icons/lu';

const LOCATION_TYPES = [
  { id: 'DALAM_PASAR', label: 'Dalam Pasar' },
  { id: 'PINGGIR_JALAN', label: 'Pinggir Jalan' },
  { id: 'DALAM_GANG', label: 'Dalam Gang' },
  { id: 'KOMPLEK_PERUMAHAN', label: 'Komplek / Perumahan' },
];

/**
 * OutletIdentitySection Component
 * Single Responsibility: Manage outlet identity with 4-second debounce search to Google Places API
 * and clear loading state indications.
 */
export const OutletIdentitySection = ({
  name,
  ownerName,
  address,
  area,
  subAreaKecamatan,
  kelurahan,
  phone,
  locationType,
  isSearchingPlace = false,
  placeSearchResults = [],
  verifiedPlace = null,
  onSearchGooglePlaces,
  onSelectGooglePlace,
  onUnlockGooglePlace,
  onChange,
}) => {
  const debounceTimerRef = useRef(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    onChange('name', val);
    setHasSearched(false);

    // Cancel existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsDebouncing(true);
      // Wait 3 seconds (3000ms) after typing stops before sending request
      debounceTimerRef.current = setTimeout(async () => {
        setIsDebouncing(false);
        if (onSearchGooglePlaces) {
          await onSearchGooglePlaces(val.trim());
          setHasSearched(true);
        }
      }, 3000);
    } else {
      setIsDebouncing(false);
      setHasSearched(false);
    }
  };

  return (
    <div className="outlet-reg-section-card">
      <div className="outlet-reg-section-title flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LuStore className="text-primary" />
          <span>2. Identitas Toko / Outlet</span>
        </div>
        {verifiedPlace && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <LuCheck /> Google Place Terkunci
          </span>
        )}
      </div>
      <div className="space-y-4">
        {/* Single Outlet Name Input with 3-Second Automatic Debounced Search (No Button) */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="outlet-reg-label m-0">
              NAMA OUTLET <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-on-surface-variant italic">
              Pencarian otomatis Google Places aktif (jeda 3 detik)
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              className="outlet-reg-input font-bold text-base pr-10 w-full"
              placeholder="Contoh: Toko Berkah Abadi / Havana Batujajar"
            />
            {/* Clean spinning loading icon inside input while debouncing or searching */}
            {(isDebouncing || isSearchingPlace) && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary flex items-center pointer-events-none">
                <LuRefreshCw className="animate-spin text-base" />
              </div>
            )}
          </div>

          {/* Locked Google Place Info Chip */}
          {verifiedPlace && (
            <div className="mt-2 p-2 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold line-clamp-1">
                <LuCheck className="text-sm shrink-0" />
                <span>Terkunci ke data Google Place: <u>{verifiedPlace.name}</u></span>
              </div>
              {onUnlockGooglePlace && (
                <button
                  type="button"
                  onClick={onUnlockGooglePlace}
                  className="text-[10px] text-red-600 hover:text-red-700 font-bold underline shrink-0 cursor-pointer"
                >
                  Lepas Kunci
                </button>
              )}
            </div>
          )}

          {/* Dropdown Hasil Pencarian Google Place (Radius <= 100m) */}
          {placeSearchResults.length > 0 && !isSearchingPlace && !isDebouncing && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface rounded-xl border border-border-glass shadow-2xl max-h-60 overflow-y-auto divide-y divide-border-glass">
              <div className="p-2 bg-surface-container-low text-[10px] font-bold text-on-surface-variant flex items-center justify-between">
                <span>Tempat Ditemukan (Radius &le; 100m):</span>
                <span className="text-primary font-mono font-bold">{placeSearchResults.length} toko</span>
              </div>
              {placeSearchResults.map((place, idx) => (
                <div
                  key={place.placeId || idx}
                  onClick={() => {
                    if (onSelectGooglePlace) {
                      onSelectGooglePlace(place);
                      setHasSearched(false);
                    }
                  }}
                  className="p-3 hover:bg-primary/10 cursor-pointer transition-colors text-xs space-y-1"
                >
                  <div className="font-extrabold text-on-surface flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <LuMapPin className="text-primary text-xs shrink-0" /> {place.name}
                    </span>
                    {place.rating && (
                      <span className="text-[11px] text-amber-600 font-extrabold flex items-center gap-0.5 shrink-0">
                        <LuStar className="fill-amber-500 text-amber-500 text-[10px]" /> {place.rating} ({place.userRatingsTotal || 1})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-on-surface-variant line-clamp-1">
                    {place.address}
                  </div>
                  <div className="text-[10px] text-primary font-mono flex items-center justify-between gap-2 pt-0.5">
                    <span>Jarak: {place.distanceMeters || '< 100'} meter</span>
                    <span className="px-1.5 py-0.5 bg-surface-container rounded text-[9px] font-sans font-bold text-on-surface">
                      {place.area}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Keterangan Toko Tidak Ditemukan di Google Places API */}
          {hasSearched && placeSearchResults.length === 0 && !isSearchingPlace && !isDebouncing && name?.trim()?.length >= 2 && !verifiedPlace && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 p-3 bg-surface rounded-xl border border-amber-500/30 shadow-xl flex items-start gap-2.5 text-xs text-on-surface">
              <LuClock className="text-amber-500 text-base shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-600 dark:text-amber-400">
                  Toko &quot;{name}&quot; Tidak Ditemukan di Google Places API
                </div>
                <p className="text-[11px] text-on-surface-variant m-0 mt-0.5">
                  Tidak ada toko terdaftar dalam radius 100m dari koordinat GPS Anda. Sistem akan menggunakan data manual & titik koordinat GPS aktual perangkat Anda.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="outlet-reg-label">NAMA PEMILIK / PENANGGUNG JAWAB</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => onChange('ownerName', e.target.value)}
              className="outlet-reg-input text-xs"
              placeholder="Nama pemilik toko"
            />
          </div>
          <div>
            <label className="outlet-reg-label">NO. TELEPON / HP</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => onChange('phone', e.target.value)}
              className="outlet-reg-input font-mono text-xs"
              placeholder="081234567890"
            />
          </div>
        </div>

        <div>
          <label className="outlet-reg-label">
            ALAMAT LENGKAP OUTLET <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={address}
            onChange={(e) => onChange('address', e.target.value)}
            className="outlet-reg-input text-xs"
            placeholder="Jl. Raya Amir Machmud No. 12, RT 02/05..."
          />
        </div>

        {/* Area Wilayah, Kecamatan, Kelurahan (Auto-filled by GPS & Google Places) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low rounded-xl border border-border-glass">
          <div>
            <label className="outlet-reg-label text-[11px]">AREA WILAYAH</label>
            <select
              value={area || 'CIMAHI'}
              onChange={(e) => onChange('area', e.target.value)}
              className="outlet-reg-input font-bold text-xs"
            >
              <option value="CIMAHI">Cimahi</option>
              <option value="KAB_BANDUNG_BARAT">Kab. Bandung Barat</option>
              <option value="KAB_BANDUNG">Kab. Bandung</option>
              <option value="KOTA_BANDUNG">Kota Bandung</option>
            </select>
          </div>
          <div>
            <label className="outlet-reg-label text-[11px]">SUB AREA / KECAMATAN</label>
            <input
              type="text"
              value={subAreaKecamatan || ''}
              onChange={(e) => onChange('subAreaKecamatan', e.target.value)}
              className="outlet-reg-input text-xs"
              placeholder="Contoh: Padalarang"
            />
          </div>
          <div>
            <label className="outlet-reg-label text-[11px]">KELURAHAN</label>
            <input
              type="text"
              value={kelurahan || ''}
              onChange={(e) => onChange('kelurahan', e.target.value)}
              className="outlet-reg-input text-xs"
              placeholder="Contoh: Laksanamekar"
            />
          </div>
        </div>

        <div>
          <label className="outlet-reg-label">LOKASI TOKO FISIK</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LOCATION_TYPES.map((item) => (
              <div
                key={item.id}
                onClick={() => onChange('locationType', item.id)}
                className={`outlet-reg-radio-card text-center justify-center p-2.5 text-xs font-bold ${
                  locationType === item.id ? 'active' : ''
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
