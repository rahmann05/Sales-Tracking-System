import React from 'react';
import { LuNavigation } from 'react-icons/lu';

/**
 * GeofenceStatusBadge (Single Responsibility: Display Geofence Distance & Radius Status)
 * 1 File per Component
 */
export const GeofenceStatusBadge = ({ distanceMeters, radiusMeters = 50 }) => {
  const isInside = distanceMeters <= radiusMeters;
  return (
    <div className="flex items-center justify-between text-xs bg-surface-variant/30 p-2.5 rounded-xl border border-border-glass">
      <span className="text-on-surface-variant">Jarak GPS Geofence:</span>
      <span className={`font-bold flex items-center gap-1 ${isInside ? 'text-emerald-600' : 'text-amber-600'}`}>
        <LuNavigation className="text-xs" />
        {distanceMeters} meter ({isInside ? `Dalam Radius ≤${radiusMeters}m` : `Luar Radius >${radiusMeters}m`})
      </span>
    </div>
  );
};
