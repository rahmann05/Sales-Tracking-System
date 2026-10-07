import React from 'react';
import { LuCheck, LuRefreshCw, LuStar, LuMapPin, LuInfo } from "react-icons/lu";
export function RegistrationIdentitySection({
  LOCATION_OPTIONS,
  formData,
  handleNameChange,
  handleSelectGooglePlace,
  handleUnlockGooglePlace,
  hasSearched,
  isDebouncing,
  isSearchingPlace,
  placeSearchResults,
  setHasSearched,
  settings,
  updateField,
  verifiedPlace
}) {
  return <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        {/* Nama Outlet & Kode Outlet */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700/60 p-2.5 items-center gap-2">
          <div className="md:col-span-2 relative">
            <div className="flex items-center gap-2">
              <span className="w-28 text-xs font-black shrink-0">NAMA OUTLET :</span>
              <div className="relative flex-1">
                <input type="text" required value={formData.name} onChange={handleNameChange} className="w-full px-2.5 py-1.5 text-xs font-bold bg-transparent border-b-2 border-slate-400 focus:border-primary outline-none" placeholder="Ketik nama toko (otomatis cari Google dlm 3 detik)" />
                {(isDebouncing || isSearchingPlace) && <LuRefreshCw className="animate-spin text-primary absolute right-2 top-2 text-sm" />}
              </div>
            </div>

            {/* Locked Place Chip */}
            {verifiedPlace && <div className="mt-1.5 flex items-center justify-between text-[11px] bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-0.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <LuCheck /> Terkunci ke data Google Place: <u>{verifiedPlace.name}</u>
                </span>
                <button type="button" onClick={handleUnlockGooglePlace} className="text-[10px] text-red-600 underline hover:text-red-700 cursor-pointer">
                  Lepas Kunci
                </button>
              </div>}

            {/* Dropdown Hasil Pencarian Google Place */}
            {placeSearchResults.length > 0 && !isSearchingPlace && !isDebouncing && <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface rounded-xl border-2 border-primary shadow-2xl max-h-56 overflow-y-auto divide-y divide-border-glass">
                <div className="p-1.5 bg-primary/10 text-[10px] font-bold text-primary flex items-center justify-between">
                  <span>Pilih tempat dari peta ({settings.CUSTOMER_REG_ENFORCE_PLACES_RADIUS ? `radius ≤ ${settings.CUSTOMER_REG_PLACES_RADIUS_METERS}m` : 'tanpa batas radius'}):</span>
                  <span>{placeSearchResults.length} toko</span>
                </div>
                {placeSearchResults.map((place, idx) => <div key={place.placeId || idx} onClick={() => {
            handleSelectGooglePlace(place);
            setHasSearched(false);
          }} className="p-2.5 hover:bg-primary/10 cursor-pointer text-xs space-y-0.5">
                    <div className="font-extrabold text-on-surface flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <LuMapPin className="text-primary text-xs" /> {place.name}
                      </span>
                      {place.rating && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                          <LuStar className="fill-amber-500 text-amber-500 text-[10px]" /> {place.rating} ({place.userRatingsTotal || 1})
                        </span>}
                    </div>
                    <div className="text-[10px] text-on-surface-variant ">
                      {place.address}
                    </div>
                    <div className="text-[9px] text-primary font-mono flex items-center gap-2">
                      <span>Jarak: {place.distanceMeters ?? '-'} m</span>
                      <span className="font-bold">{place.area}</span>
                    </div>
                  </div>)}
              </div>}

            {/* Not Found Dropdown */}
            {hasSearched && placeSearchResults.length === 0 && !isSearchingPlace && !isDebouncing && formData.name?.trim()?.length >= 2 && !verifiedPlace && <div className="absolute left-0 right-0 top-full mt-1 z-30 p-2.5 bg-surface rounded-xl border border-amber-500/40 shadow-xl flex items-start gap-2 text-xs">
                <LuInfo className="text-amber-500 text-sm shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-600">Toko &quot;{formData.name}&quot; Tidak Ditemukan di Google Places</strong>
                  <p className="text-[10px] text-on-surface-variant m-0">
                    {settings.CUSTOMER_REG_ENFORCE_PLACES_RADIUS ? `Tidak ditemukan dalam radius ${settings.CUSTOMER_REG_PLACES_RADIUS_METERS}m.` : 'Tidak ditemukan pada layanan peta.'} Sistem menggunakan data manual dan GPS aktual.
                  </p>
                </div>
              </div>}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-on-surface-variant shrink-0">KODE OUTLET :</span>
            <input type="text" readOnly value="*diisi Admin" className="w-full px-2 py-1 text-xs italic text-on-surface-variant bg-surface-container/60 border border-dashed border-border-glass rounded text-center" />
          </div>
        </div>

        {/* Alamat Outlet (Auto-fill dari Google Place API & Diizinkan Diedit) */}
        <div className="p-2.5 flex items-start gap-2">
          <span className="w-28 text-xs font-black shrink-0 pt-1">ALAMAT OUTLET :</span>
          <textarea required rows={2} value={formData.address} onChange={e => updateField('address', e.target.value)} className="w-full px-2.5 py-1 text-xs bg-transparent border-b border-slate-400 focus:border-primary outline-none resize-y" placeholder="Terisi otomatis saat memilih Google Place atau ketik alamat lengkap manual..." />
        </div>

        {/* No Telp & Nama Pemilik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 p-2.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-28 text-xs font-black shrink-0">NO TELP :</span>
            <input type="text" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className="w-full px-2 py-1 text-xs font-mono bg-transparent border-b border-slate-400 focus:border-primary outline-none" placeholder="081234567890" />
          </div>
          <div className="flex items-center gap-2 sm:pl-2">
            <span className="w-28 text-xs font-black shrink-0">PEMILIK :</span>
            <input type="text" value={formData.ownerName} onChange={e => updateField('ownerName', e.target.value)} className="w-full px-2 py-1 text-xs bg-transparent border-b border-slate-400 focus:border-primary outline-none" placeholder="Nama penanggung jawab" />
          </div>
        </div>

        {/* Lokasi Fisik */}
        <div className="p-2.5 flex flex-wrap items-center gap-3">
          <span className="w-28 text-xs font-black shrink-0">LOKASI :</span>
          <div className="flex flex-wrap items-center gap-4">
            {LOCATION_OPTIONS.map(loc => {
          const isChecked = formData.locationType === loc.id;
          return <label key={loc.id} onClick={() => updateField('locationType', loc.id)} className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${isChecked ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                    {isChecked && <LuCheck className="text-xs" />}
                  </div>
                  <span>{loc.label}</span>
                </label>;
        })}
          </div>
        </div>
      </div>;
}
