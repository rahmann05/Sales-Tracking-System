import React, { useState } from 'react';
import {
  ID_PHONE_HTML_PATTERN,
  sanitizePhoneInput,
  validateIndonesianPhone,
} from '../../../../../shared/indonesia-identity.mjs';
import { NooField } from './NooField';
import { NooTick } from './NooTick';

/**
 * Blok identitas formulir kertas: NAMA OUTLET, ALAMAT OUTLET, NO TELP, KODE OUTLET (diisi Admin),
 * dan pilihan LOKASI. Pencarian tempat (API) menampilkan hasilnya di bawah nama outlet.
 */
export function RegistrationIdentitySection({
  LOCATION_OPTIONS,
  formData,
  handleNameChange,
  handleSelectGooglePlace,
  handleUnlockGooglePlace,
  hasSearched,
  isDebouncing,
  isSearchingPlace,
  placeSearchError,
  placeSearchResults,
  requiredFields = [],
  setHasSearched,
  settings,
  updateField,
  verifiedPlace,
}) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const lookupEnabled =
    settings.FEATURE_MAPS_MODE === 'ACTIVE' && settings.PLACE_LOOKUP_PROVIDER !== 'OFF';
  const req = new Set(requiredFields);
  const phoneError = phoneTouched ? validateIndonesianPhone(formData.phone) : null;

  return (
    <section id="registration-identity" className="npf-block">
      <div className="npf-row npf-cols-identity">
        <div className="npf-stack">
          <NooField
            label="Nama outlet"
            required
            hint={lookupEnabled ? 'Otomatis cari profil tempat' : 'Pencarian tempat nonaktif'}
          >
            <input
              id="reg-name"
              name="name"
              className="npf-line"
              required
              minLength={2}
              maxLength={200}
              value={formData.name || ''}
              onChange={handleNameChange}
              placeholder="Nama toko / pelanggan"
              autoComplete="organization"
              enterKeyHint="next"
            />
          </NooField>

          {isDebouncing || isSearchingPlace ? (
            <p className="npf-status" role="status">
              {isSearchingPlace ? 'Mencari tempat…' : 'Menunggu nama selesai diketik…'}
            </p>
          ) : null}
          {placeSearchError ? (
            <p className="npf-error" role="alert">
              {placeSearchError}
            </p>
          ) : null}
          {verifiedPlace ? (
            <div className="npf-place-chip">
              <span>
                Profil terpilih: <strong>{verifiedPlace.name}</strong>
              </span>
              <button
                type="button"
                className="npf-btn npf-btn--mini"
                onClick={handleUnlockGooglePlace}
              >
                Lepas
              </button>
            </div>
          ) : null}
          {placeSearchResults.length > 0 && !isSearchingPlace && !isDebouncing ? (
            <div className="npf-place-results" aria-label="Hasil pencarian tempat">
              <p>
                Pilih tempat yang sesuai
                {settings.CUSTOMER_REG_ENFORCE_PLACES_RADIUS
                  ? ` (radius ${settings.CUSTOMER_REG_PLACES_RADIUS_METERS} m)`
                  : ''}
              </p>
              {placeSearchResults.map((place, index) => (
                <button
                  type="button"
                  key={place.placeId || index}
                  onClick={() => {
                    handleSelectGooglePlace(place);
                    setHasSearched(false);
                  }}
                >
                  <strong>{place.name}</strong>
                  <span>{place.address}</span>
                  {place.distanceMeters != null ? (
                    <small>
                      Jarak {place.distanceMeters} m ·{' '}
                      {place.distanceOrigin === 'OFFICE_SEARCH_BIAS'
                        ? 'acuan kantor'
                        : 'GPS perangkat'}
                    </small>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
          {lookupEnabled &&
          !placeSearchError &&
          hasSearched &&
          !placeSearchResults.length &&
          !isSearchingPlace &&
          !isDebouncing &&
          formData.name?.trim().length >= 2 &&
          !verifiedPlace ? (
            <p className="npf-status" role="status">
              Tidak ditemukan di peta — lengkapi alamat manual dan ambil GPS.
            </p>
          ) : null}

          <NooField label="Alamat outlet" required>
            <textarea
              id="reg-address"
              name="address"
              className="npf-line"
              required
              minLength={3}
              rows={2}
              value={formData.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Jalan, nomor bangunan, RT/RW, dan wilayah"
              autoComplete="street-address"
            />
          </NooField>
          <NooField label="Alamat 2" required={req.has('address2')}>
            <input
              id="reg-address2"
              name="address2"
              className="npf-line"
              required={req.has('address2')}
              maxLength={200}
              value={formData.address2 || ''}
              onChange={(e) => updateField('address2', e.target.value)}
              placeholder="Blok / kompleks / pasar"
              autoComplete="address-line2"
            />
          </NooField>
          <NooField label="Alamat 3" required={req.has('address3')}>
            <input
              id="reg-address3"
              name="address3"
              className="npf-line"
              required={req.has('address3')}
              maxLength={200}
              value={formData.address3 || ''}
              onChange={(e) => updateField('address3', e.target.value)}
              placeholder="Keterangan tambahan"
              autoComplete="address-line3"
            />
          </NooField>
          <NooField
            label="No telp"
            required={req.has('phone')}
            hint="08xx / 02x / +62 (9–14 digit)"
            error={phoneError}
          >
            <input
              id="reg-phone"
              name="phone"
              className="npf-line"
              type="tel"
              inputMode="tel"
              required={req.has('phone')}
              minLength={9}
              maxLength={16}
              pattern={ID_PHONE_HTML_PATTERN}
              title="Format telepon Indonesia (9–14 digit, diawali 08, 02x, atau +62)"
              value={formData.phone || ''}
              onChange={(e) => updateField('phone', sanitizePhoneInput(e.target.value))}
              onBlur={() => setPhoneTouched(true)}
              aria-invalid={phoneError ? 'true' : undefined}
              placeholder="081234567890"
              autoComplete="tel"
            />
          </NooField>
          <NooField label="Pemilik" required={req.has('ownerName')}>
            <input
              id="reg-owner"
              name="ownerName"
              className="npf-line"
              required={req.has('ownerName')}
              minLength={2}
              maxLength={120}
              value={formData.ownerName || ''}
              onChange={(e) => updateField('ownerName', e.target.value)}
              placeholder="Nama pemilik toko"
              autoComplete="name"
            />
          </NooField>
          <NooField label="Dikenal dari" required={req.has('outletKnownBy')}>
            <input
              id="reg-known-by"
              name="outletKnownBy"
              className="npf-line"
              required={req.has('outletKnownBy')}
              maxLength={120}
              value={formData.outletKnownBy || ''}
              onChange={(e) => updateField('outletKnownBy', e.target.value)}
              placeholder="Canvassing / rekomendasi / SPV"
            />
          </NooField>
        </div>
        <div className="npf-codebox">
          <span className="npf-heading">KODE OUTLET :</span>
          <span className="npf-line" aria-label="Kode outlet diisi Admin">
            &nbsp;
          </span>
          <small className="npf-hint">*diisi Admin setelah pengajuan diproses</small>
        </div>
      </div>
      <fieldset className="npf-ticks">
        <legend className="sr-only">Lokasi fisik</legend>
        <span className="npf-gutter">LOKASI :</span>
        {LOCATION_OPTIONS.map((item) => (
          <NooTick
            key={item.id}
            name="locationType"
            label={item.label}
            checked={(formData.locationType || 'PINGGIR_JALAN') === item.id}
            onChange={() => updateField('locationType', item.id)}
          />
        ))}
      </fieldset>
    </section>
  );
}
