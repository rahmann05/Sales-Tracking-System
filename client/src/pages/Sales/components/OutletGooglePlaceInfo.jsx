import React from 'react';
import { LuStar, LuExternalLink, LuClock } from 'react-icons/lu';
import { FcGoogle } from 'react-icons/fc';

/**
 * OutletGooglePlaceInfo Component
 * Single Responsibility: Display Google Places API metadata (rating, review count,
 * business open status, business category, summary, and external Maps link).
 */
export const OutletGooglePlaceInfo = ({ googlePlaceDetails }) => {
  if (!googlePlaceDetails) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2 text-xs">
      {/* Header with Google logo and External Maps Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-on-surface text-xs">
          <FcGoogle className="text-base shrink-0" />
          <span>Info Google Places API</span>
        </div>
        {googlePlaceDetails.googleMapsUrl && (
          <a
            href={googlePlaceDetails.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Buka Maps</span>
            <LuExternalLink className="text-xs" />
          </a>
        )}
      </div>

      {/* Badges: Rating, Category, and Business Status */}
      <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
        {googlePlaceDetails.rating && (
          <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
            <LuStar className="text-xs fill-amber-500 text-amber-500" />
            <span>{googlePlaceDetails.rating}</span>
            <span className="font-normal text-[10px] text-on-surface-variant">
              ({googlePlaceDetails.userRatingsTotal || 0} ulasan)
            </span>
          </div>
        )}

        {googlePlaceDetails.category && (
          <span className="text-[11px] font-medium text-on-surface-variant bg-surface px-2 py-0.5 rounded-md border border-border-glass">
            {googlePlaceDetails.category}
          </span>
        )}

        {googlePlaceDetails.businessStatus && (
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
            <LuClock className="text-xs" />
            {googlePlaceDetails.businessStatus} • {googlePlaceDetails.openHours || '07:00 - 21:00'}
          </span>
        )}
      </div>

      {/* Summary / Description */}
      {googlePlaceDetails.description && (
        <p className="text-[11px] text-on-surface-variant leading-relaxed border-t border-primary/10 pt-1.5 italic">
          "{googlePlaceDetails.description}"
        </p>
      )}
    </div>
  );
};
