import React from 'react';
import { LuLock, LuCamera, LuRefreshCw, LuMapPin } from 'react-icons/lu';
import { GooglePlaceDetailCard } from './GooglePlaceDetailCard';

/**
 * Ruang khusus pengecekan API (profil tempat Google, GPS) dan foto fisik outlet.
 * Tata letaknya sama seperti sebelumnya: kiri hasil pengecekan, kanan foto; tempatnya selalu
 * tersedia walau belum ada hasil.
 */
export function RegistrationLocationSection({
  formData,
  handleDetectGPS,
  isLocating,
  gpsError,
  setIsOutletCameraOpen,
  settings,
  verifiedPlace,
}) {
  const requireLocation = settings.REGISTRATION_REQUIRE_LOCATION !== false;
  const requirePhoto = settings.CUSTOMER_REG_REQUIRE_PHOTO !== false;
  const hasCoords = formData.latitude != null && formData.longitude != null;

  return (
    <section id="registration-location" className="npf-block">
      <h3 className="npf-block-title">Pengecekan lokasi (API) &amp; foto outlet</h3>
      <div className="npf-gps-bar">
        <span>
          <LuMapPin aria-hidden="true" />
          <span>
            GPS
            {requireLocation ? (
              <span className="npf-req" aria-hidden="true">
                {' '}
                *
              </span>
            ) : null}
            :{' '}
            <strong>
              {hasCoords ? `${formData.latitude}, ${formData.longitude}` : 'Belum diambil'}
            </strong>
          </span>
          {hasCoords ? (
            <span>
              <LuLock aria-hidden="true" /> Terkunci
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isLocating}
          className="npf-btn npf-btn--mini"
        >
          <LuRefreshCw className={isLocating ? 'animate-spin' : ''} aria-hidden="true" />
          <span>
            {isLocating ? 'Mendeteksi…' : hasCoords ? 'Ambil ulang GPS' : 'Ambil GPS outlet'}
          </span>
        </button>
      </div>

      {gpsError ? (
        <p role="alert" className="npf-error">
          {gpsError}
        </p>
      ) : null}

      <div className="npf-api-grid">
        <div className="npf-api-box">
          <span className="npf-heading">Hasil pengecekan API tempat</span>
          <div>
            <GooglePlaceDetailCard
              place={verifiedPlace}
              currentLat={formData.latitude}
              currentLng={formData.longitude}
              searchedQuery={formData.name}
            />
          </div>
        </div>

        <div className="npf-photo-box">
          <div className="npf-photo-head">
            <span>
              Foto fisik outlet
              {requirePhoto ? (
                <span className="npf-req" aria-hidden="true">
                  {' '}
                  *
                </span>
              ) : null}
            </span>
            {formData.photoUrl ? (
              <button
                type="button"
                className="npf-btn npf-btn--mini"
                onClick={() => setIsOutletCameraOpen(true)}
              >
                <LuRefreshCw aria-hidden="true" /> Ulangi
              </button>
            ) : null}
          </div>

          {formData.photoUrl ? (
            <div className="npf-photo-preview">
              <img src={formData.photoUrl} alt="Foto fisik outlet" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsOutletCameraOpen(true)}
              className="npf-photo-empty"
            >
              <LuCamera aria-hidden="true" />
              <span>Ambil foto toko (kamera)</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
