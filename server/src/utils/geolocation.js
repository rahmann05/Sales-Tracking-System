import {outletOperationalPoint} from '../../../shared/outlet-location.mjs';
/**
 * Calculate distance between two coordinates in meters using the Haversine formula
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if(![lat1,lon1,lat2,lon2].every(Number.isFinite))return null;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const distanceToOutlet=(latitude,longitude,outlet)=>{const point=outletOperationalPoint(outlet);return calculateDistanceMeters(latitude,longitude,point.latitude,point.longitude);};
