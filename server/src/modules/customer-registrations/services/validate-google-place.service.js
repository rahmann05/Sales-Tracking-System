/** validateGooglePlace - single-responsibility service (extracted from customer-registrations.service.js). */
import { getDistanceInMeters } from './customer-registrations.helpers.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { placeLookupPolicy, fetchPlaceJson } from './place-lookup-policy.service.js';

/**
 * Validasi tempat & toko secara live menggunakan Google Places API / Geocoding
 */
export const validateGooglePlace = async (name, address, lat, lng) => {
  const radius = await getDynamicConfig('CUSTOMER_REG_PLACES_RADIUS_METERS', 100);
  const enforceRadius = await getDynamicConfig('CUSTOMER_REG_ENFORCE_PLACES_RADIUS', true);
  const policy = await placeLookupPolicy();
  const apiKey = policy.google ? policy.key : null;
  let placeId = null;
  let isPlaceFound = false;
  let placeName = null;
  let placeAddress = null;
  let placeLat = null;
  let placeLng = null;
  const confidenceScore = null; // A provider match is not proof of physical outlet identity.
  let googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat ?? -6.8722},${lng ?? 107.5422}`;

  if (apiKey && name) {
    try {
      // Text search via Google Places API (New)
      const placeUrl = 'https://places.googleapis.com/v1/places:searchText';
      const biasRadius = Math.max(100, Math.min(50000, Number(radius) || 500));
      const data = await fetchPlaceJson(placeUrl, policy, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri',
        },
        body: JSON.stringify({
          textQuery: `${name} ${address || ''}`.trim(),
          languageCode: 'id',
          regionCode: 'ID',
          pageSize: 5,
          locationBias: {
            circle: {
              center: {
                latitude: Number(lat ?? -6.8722),
                longitude: Number(lng ?? 107.5422),
              },
              radius: biasRadius,
            },
          },
        }),
      });

      if (data?.places && data.places.length > 0) {
        const candidate = data.places.find((item) => {
          const location = item.location;
          return (
            Number.isFinite(location?.latitude) &&
            Number.isFinite(location?.longitude) &&
            (!enforceRadius ||
              getDistanceInMeters(lat, lng, location.latitude, location.longitude) <= radius)
          );
        });
        if (!candidate)
          return {
            isPlaceFound: false,
            placeName: null,
            placeAddress: null,
            placeLat: null,
            placeLng: null,
            confidenceScore,
            googleMapsUrl,
            validatedAt: new Date().toISOString(),
          };
        isPlaceFound = true;
        placeId = candidate.id || null;
        placeName = candidate.displayName?.text || null;
        placeAddress = candidate.formattedAddress || null;
        placeLat = candidate.location?.latitude ?? null;
        placeLng = candidate.location?.longitude ?? null;
        googleMapsUrl =
          candidate.googleMapsUri ||
          (candidate.id
            ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(candidate.id)}`
            : googleMapsUrl);
      }
    } catch (err) {
      console.warn('[CustomerRegistration] Google Place check error:', err.message);
    }
  }

  // Fallback direct coordinate URL if place wasn't found by name
  if (!isPlaceFound && lat != null && lng != null) {
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
