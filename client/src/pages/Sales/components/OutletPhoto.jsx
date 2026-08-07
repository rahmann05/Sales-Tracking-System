import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

/**
 * OutletPhoto Component
 * Single Responsibility: Display storefront photo retrieved from Google Places API / Google Maps.
 * If photo is not available (null, empty, or fails to load), returns null so the section is completely omitted.
 */
export const OutletPhoto = ({ photoUrl, customerName }) => {
  const [hasError, setHasError] = useState(false);

  // If no photo from Google API or failed to load, omit the photo section completely
  if (!photoUrl || hasError) {
    return null;
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border-glass aspect-video bg-surface-variant/40 group shadow-inner">
      <img
        src={photoUrl}
        alt={`Foto ${customerName || 'Outlet'} dari Google Maps`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={() => setHasError(true)}
      />
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center gap-1.5 shadow-sm">
        <FcGoogle className="text-xs shrink-0" />
        <span className="font-medium tracking-wide">Foto Lokasi (Google Places API)</span>
      </div>
    </div>
  );
};
