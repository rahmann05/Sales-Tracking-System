/** Shared helpers for customer-registrations services (internal). */

export const GOOGLE_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Helper: Calculate distance in meters between two lat/lng points
export function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Normalize CustomerRegistration.revisionHistory entries across legacy/seeded and canonical shapes.
 */
export function normalizeRevisionHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      ...entry,
      actor: {
        ...(entry.actor && typeof entry.actor === 'object' && !Array.isArray(entry.actor)
          ? entry.actor
          : {}),
        id: entry.actor?.id ?? entry.actorId ?? null,
        name: entry.actor?.name || entry.actorName || 'Pengguna tidak diketahui',
        role: entry.actor?.role ?? null,
      },
      reason:
        entry.reason ||
        entry.note ||
        (entry.action === 'SUBMITTED' ? 'Pengajuan awal' : 'Revisi pengajuan'),
      rejectionNote: entry.rejectionNote ?? null,
      before:
        entry.before && typeof entry.before === 'object' && !Array.isArray(entry.before)
          ? entry.before
          : {},
      after:
        entry.after && typeof entry.after === 'object' && !Array.isArray(entry.after)
          ? entry.after
          : {},
    }));
}
