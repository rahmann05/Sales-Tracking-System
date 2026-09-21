/** validateGooglePlace - single-responsibility service (extracted from customer-registrations.service.js). */
import { GOOGLE_API_KEY } from './customer-registrations.helpers.js';

/**
 * Validasi tempat & toko secara live menggunakan Google Places API / Geocoding
 */
export const validateGooglePlace = async (name, address, lat, lng) => {
  let isPlaceFound = false;
  let placeName = null;
  let placeAddress = null;
  let placeLat = null;
  let placeLng = null;
  let confidenceScore = 50; // default baseline
  let googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat || -6.8722},${lng || 107.5422}`;

  if (GOOGLE_API_KEY && name) {
    try {
      // 1. TextSearch / FindPlace via Google Places API
      const query = encodeURIComponent(`${name} ${address || ''} Cimahi Bandung`);
      const placeUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=name,formatted_address,geometry,place_id&locationbias=circle:15000@${lat || -6.8722},${lng || 107.5422}&key=${GOOGLE_API_KEY}`;
      
      const res = await fetch(placeUrl);
      const data = await res.json();

      if (data?.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        isPlaceFound = true;
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
    placeName,
    placeAddress,
    placeLat,
    placeLng,
    confidenceScore,
    googleMapsUrl,
    validatedAt: new Date().toISOString(),
  };
};
