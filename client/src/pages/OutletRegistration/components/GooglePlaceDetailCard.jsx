import React, { useState } from 'react';
import {
  LuMapPin,
  LuExternalLink,
  LuPhone,
  LuClock,
  LuStar,
  LuCheck,
  LuNavigation,
  LuBookmark,
  LuCompass,
  LuSmartphone,
  LuShare2,
  LuImage,
  LuSparkles,
  LuStore,
  LuInfo,
} from 'react-icons/lu';

/**
 * GooglePlaceDetailCard Component
 * Single Responsibility: Render authentic Google Places API profile card with strictly REAL data.
 * If place is not found or not selected, renders clear "Tidak Ditemukan" notice.
 */
export const GooglePlaceDetailCard = ({ place, currentLat, currentLng, searchedQuery }) => {
  const [activeTab, setActiveTab] = useState('Ringkasan');

  // If no place is found or verified
  if (!place) {
    return (
      <div className="p-5 rounded-2xl bg-surface border border-border-glass text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl">
          <LuInfo />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-on-surface m-0">
            {searchedQuery
              ? `Toko "${searchedQuery}" Tidak Ditemukan di Google Places API`
              : 'Belum Ada Data dari Google Places API'}
          </h4>
          <p className="text-xs text-on-surface-variant m-0 max-w-sm mx-auto leading-relaxed">
            {searchedQuery
              ? 'Toko ini belum terdaftar di database Google Places. Formulir registrasi tetap dapat diajukan menggunakan titik koordinat GPS aktual perangkat Anda.'
              : 'Ketik nama toko pada kolom Nama Outlet di sebelah kiri untuk menyandingkan profil resmi dari Google Places API.'}
          </p>
        </div>
        <div className="p-2.5 bg-surface-container-low rounded-xl border border-border-glass inline-flex items-center gap-2 text-xs font-mono text-primary font-bold">
          <LuMapPin className="text-xs shrink-0" />
          <span>GPS Sistem: {currentLat}, {currentLng}</span>
        </div>
      </div>
    );
  }

  const name = place.name;
  const category = place.categoryName || 'Toko Retail';
  const rating = place.rating ? Number(place.rating).toFixed(1).replace('.', ',') : null;
  const reviewsCount = place.userRatingsTotal || null;
  const address = place.address || '-';
  const openingHours = place.openingHoursText || null;
  const phone = place.phone || null;
  const plusCode = place.plusCode || `GPS: ${currentLat}, ${currentLng}`;
  const photoUrl = place.photoUrl || null;
  const googleMapsUrl =
    place.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${currentLat || -6.8582},${currentLng || 107.5123}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-border-glass bg-surface shadow-md text-on-surface">
      {/* 1. Cover Photo Header (if photo exists) or Stylish Store Header Banner */}
      {photoUrl ? (
        <div className="relative w-full h-44 sm:h-48 bg-neutral-900 overflow-hidden">
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Top Floating Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 bg-black/70 backdrop-blur-xs text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
              <LuCheck className="text-xs" /> Google Place API Terverifikasi
            </span>
          </div>

          {/* 'Lihat foto' button bottom left */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 left-3 z-10 px-3 py-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-xs text-white rounded-lg text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-all shadow-md"
          >
            <LuImage className="text-sm" /> Lihat foto di Google Maps
          </a>
        </div>
      ) : (
        <div className="p-4 bg-linear-to-r from-teal-900/30 via-slate-900/20 to-primary/10 border-b border-border-glass flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg">
              <LuStore />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                <LuCheck /> Google Place Terverifikasi
              </span>
              <div className="text-xs text-on-surface-variant font-medium">{category}</div>
            </div>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
          >
            <LuExternalLink className="text-xs" /> Buka Maps
          </a>
        </div>
      )}

      {/* 2. Main Title & Rating Section */}
      <div className="p-4 border-b border-border-glass space-y-1">
        <h3 className="text-lg font-black text-on-surface tracking-tight m-0">
          {name}
        </h3>

        {rating ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-on-surface">{rating}</span>
            <div className="flex items-center text-amber-500 text-xs">
              <LuStar className="fill-amber-500" />
              <LuStar className="fill-amber-500" />
              <LuStar className="fill-amber-500" />
              <LuStar className="fill-amber-500" />
              <LuStar className="fill-amber-500" />
            </div>
            {reviewsCount && (
              <span className="text-on-surface-variant font-medium">({reviewsCount})</span>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-on-surface-variant italic">
            Belum ada rating ulasan publik di Google
          </div>
        )}

        <div className="text-xs text-teal-700 dark:text-teal-400 font-bold">{category}</div>
      </div>

      {/* 3. Sub Tabs: Ringkasan | Ulasan | Tentang */}
      <div className="flex items-center px-4 border-b border-border-glass text-xs font-bold">
        {['Ringkasan', 'Ulasan', 'Tentang'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-3 border-b-2 transition-all ${
              activeTab === tab
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 font-extrabold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. Circular Quick Action Buttons */}
      <div className="p-4 border-b border-border-glass flex items-center justify-around gap-2 text-center">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-md transition-all group-hover:scale-105">
            <LuNavigation className="text-base" />
          </div>
          <span className="text-[10px] font-bold text-on-surface group-hover:text-teal-600">Rute</span>
        </a>

        <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-neutral-800 border border-teal-600/30 text-teal-700 dark:text-teal-400 flex items-center justify-center transition-all group-hover:bg-teal-100">
            <LuBookmark className="text-base" />
          </div>
          <span className="text-[10px] font-bold text-on-surface">Simpan</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-neutral-800 border border-teal-600/30 text-teal-700 dark:text-teal-400 flex items-center justify-center transition-all group-hover:bg-teal-100">
            <LuCompass className="text-base" />
          </div>
          <span className="text-[10px] font-bold text-on-surface">Di Sekitar</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-neutral-800 border border-teal-600/30 text-teal-700 dark:text-teal-400 flex items-center justify-center transition-all group-hover:bg-teal-100">
            <LuSmartphone className="text-base" />
          </div>
          <span className="text-[10px] font-bold text-on-surface">Kirim ke ponsel</span>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-neutral-800 border border-teal-600/30 text-teal-700 dark:text-teal-400 flex items-center justify-center transition-all group-hover:bg-teal-100">
            <LuShare2 className="text-base" />
          </div>
          <span className="text-[10px] font-bold text-on-surface">Bagikan</span>
        </a>
      </div>

      {/* 5. Detailed Meta List */}
      <div className="p-4 space-y-3 text-xs divide-y divide-border-glass">
        {/* Full Address */}
        <div className="flex items-start gap-3 pt-1">
          <LuMapPin className="text-teal-600 text-base shrink-0 mt-0.5" />
          <div className="text-on-surface font-medium leading-relaxed">{address}</div>
        </div>

        {/* Operating Hours (if exists) */}
        {openingHours && (
          <div className="flex items-center gap-3 pt-3">
            <LuClock className="text-teal-600 text-base shrink-0" />
            <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <span>{openingHours}</span>
            </div>
          </div>
        )}

        {/* Phone (if exists) */}
        {phone && (
          <div className="flex items-center gap-3 pt-3">
            <LuPhone className="text-teal-600 text-base shrink-0" />
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="font-bold text-teal-700 dark:text-teal-400 hover:underline font-mono"
            >
              {phone}
            </a>
          </div>
        )}

        {/* Plus Code & Coordinates */}
        <div className="flex items-center justify-between pt-3 text-[11px]">
          <div className="flex items-center gap-2 text-on-surface-variant font-mono">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>{plusCode}</span>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 dark:text-teal-400 font-bold underline flex items-center gap-1"
          >
            <LuExternalLink /> Buka Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};

