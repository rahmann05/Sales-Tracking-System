/** validateGooglePlace - single-responsibility service (extracted from customer-registrations.service.js). */
import { GOOGLE_API_KEY, getDistanceInMeters } from './customer-registrations.helpers.js';
import { getDynamicConfig } from '../../config/config.service.js';

/**
 * Validasi tempat & toko secara live menggunakan Google Places API / Geocoding
 */
export const validateGooglePlace = async (name, address, lat, lng) => {
  const radius = await getDynamicConfig('CUSTOMER_REG_PLACES_RADIUS_METERS', 100);
  const enforceRadius = await getDynamicConfig('CUSTOMER_REG_ENFORCE_PLACES_RADIUS', true);
  const apiKey = await getDynamicConfig('MAPS_API_KEY', '') || GOOGLE_API_KEY;
  let placeId = null;
  let isPlaceFound = false;
  let placeName = null;
  let placeAddress = null;
  let placeLat = null;
  let placeLng = null;
  let confidenceScore = 50; // default baseline
  let googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat || -6.8722},${lng || 107.5422}`;

  if (apiKey && name) {
    try {
      // 1. TextSearch / FindPlace via Google Places API
      const query = encodeURIComponent(`${name} ${address || ''} Cimahi Bandung`);
      const placeUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=name,formatted_address,geometry,place_id&locationbias=circle:${radius}@${lat ?? -6.8722},${lng ?? 107.5422}&key=${apiKey}`;
      
      const res = await fetch(placeUrl);
      const data = await res.json();

      if (data?.candidates && data.candidates.length > 0) {
        const candidate = data.candidates.find(item => {
          const location = item.geometry?.location;
          return Number.isFinite(location?.lat) && Number.isFinite(location?.lng) && (!enforceRadius || getDistanceInMeters(lat, lng, location.lat, location.lng) <= radius);
        });
        if (!candidate) return {isPlaceFound:false,placeName:null,placeAddress:null,placeLat:null,placeLng:null,confidenceScore,googleMapsUrl,validatedAt:new Date().toISOString()};
        isPlaceFound = true;
        placeId = candidate.place_id || null;
        placeName = candidate.name;
        placeAddress = candidate.formatted_address;
        placeLat = candidate.geometry?.location?.lat;
        placeLng = candidate.geometry?.location?.lng;
        confidenceScore = 90;
        if (candidate.place_id) {
          googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${candidate.place_id}`;
        }
      }
    } catch (err) {
      console.warn('[CustomerRegistration] Google Place check error:', err.message);
    }
  }

  // Fallback direct coordinate URL if place wasn't found by name
  if (!isPlaceFound && lat && lng) {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  return {
    isPlaceFound,
    placeId,
    placeName,
    placeAddress,
    placeLat,
    placeLng,
    confidenceScore,
    googleMapsUrl,
    validatedAt: new Date().toISOString(),
  };
};
