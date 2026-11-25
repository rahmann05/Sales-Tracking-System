import { getDistanceInMeters } from './customer-registrations.helpers.js';
import { getDynamicConfig } from '../../config/config.service.js';
import {
  placeLookupPolicy,
  fetchPlaceJson,
  osmOptions,
  inferredArea,
} from './place-lookup-policy.service.js';

export const searchPlaces = async (keyword, lat = null, lng = null) => {
  if (!keyword || keyword.trim().length < 2) return [];
  const policy = await placeLookupPolicy();
  const userLat =
    lat != null && Number.isFinite(Number(lat))
      ? Number(lat)
      : await getDynamicConfig('DEFAULT_OFFICE_LATITUDE', -6.8722);
  const userLng =
    lng != null && Number.isFinite(Number(lng))
      ? Number(lng)
      : await getDynamicConfig('DEFAULT_OFFICE_LONGITUDE', 107.5422);
  const radius = await getDynamicConfig('CUSTOMER_REG_PLACES_RADIUS_METERS', 100);
  const enforce = await getDynamicConfig('CUSTOMER_REG_ENFORCE_PLACES_RADIUS', true);
  const browserKey = await getDynamicConfig('MAPS_BROWSER_API_KEY', '');
  const distanceOrigin = lat != null && lng != null ? 'INPUT_COORDINATES' : 'OFFICE_SEARCH_BIAS';
  const results = [];
  let outsideRadius = 0;
  let error;
  const append = (point) => {
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return;
    const distanceMeters = getDistanceInMeters(userLat, userLng, point.latitude, point.longitude);
    if (enforce && distanceMeters > radius) {
      outsideRadius++;
      return;
    }
    results.push({
      ...point,
      distanceMeters,
      distanceOrigin,
      latitude: Number(point.latitude.toFixed(6)),
      longitude: Number(point.longitude.toFixed(6)),
    });
  };
  if (policy.google) {
    try {
      const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
      const fieldMask =
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.currentOpeningHours.openNow,places.plusCode,places.nationalPhoneNumber,places.internationalPhoneNumber,places.photos,places.googleMapsUri';
      const biasRadius = Math.max(100, Math.min(50000, Number(radius) || 500));
      const data = await fetchPlaceJson(searchUrl, policy, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': policy.key,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify({
          textQuery: keyword.trim(),
          languageCode: 'id',
          regionCode: 'ID',
          pageSize: 10,
          locationBias: {
            circle: {
              center: { latitude: userLat, longitude: userLng },
              radius: biasRadius,
            },
          },
        }),
      });
      for (const item of data?.places || []) {
        const photoName = item.photos?.[0]?.name;
        const openNow = item.currentOpeningHours?.openNow ?? null;
        append({
          placeId: item.id,
          name: item.displayName?.text || '',
          address: item.formattedAddress || '',
          latitude: item.location?.latitude,
          longitude: item.location?.longitude,
          rating: item.rating ?? null,
          userRatingsTotal: item.userRatingCount ?? null,
          types: item.types || [],
          openNow,
          openingHoursText:
            typeof openNow === 'boolean'
              ? openNow
                ? 'Sedang buka menurut penyedia peta'
                : 'Sedang tutup menurut penyedia peta'
              : null,
          plusCode: item.plusCode?.compoundCode ?? null,
          phone: item.nationalPhoneNumber ?? item.internationalPhoneNumber ?? null,
          photoUrl:
            browserKey && photoName
              ? `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=600&key=${encodeURIComponent(browserKey)}`
              : null,
          categoryName: null,
          deliveryInfo: [],
          area: inferredArea(item.formattedAddress || ''),
          googleMapsUrl:
            item.googleMapsUri ||
            (item.id
              ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(item.id)}`
              : null),
          source: 'GOOGLE_PLACE',
        });
      }
    } catch (e) {
      error = e;
    }
  }
  if (!results.length && policy.osm) {
    try {
      const data = await fetchPlaceJson(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword.trim())}&format=json&addressdetails=1&limit=5`,
        policy,
        osmOptions
      );
      if (Array.isArray(data))
        for (const item of data) {
          const address = item.address || {};
          append({
            placeId: `osm-${item.osm_type || 'place'}-${item.osm_id}`,
            name: item.name || item.display_name?.split(',')[0],
            address: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            subAreaKecamatan: address.suburb || address.municipality || '',
            kelurahan: address.village || address.quarter || '',
            rating: null,
            userRatingsTotal: null,
            categoryName: null,
            openNow: null,
            openingHoursText: null,
            plusCode: null,
            phone: null,
            photoUrl: null,
            deliveryInfo: [],
            area: inferredArea(address.county || address.city || address.state_district),
            googleMapsUrl: null,
            mapUrl: `https://www.openstreetmap.org/?mlat=${encodeURIComponent(item.lat)}&mlon=${encodeURIComponent(item.lon)}#map=18/${encodeURIComponent(item.lat)}/${encodeURIComponent(item.lon)}`,
            source: 'OSM_NOMINATIM',
          });
        }
      error = null;
    } catch (e) {
      error = e;
    }
  }
  if (!results.length && error) throw error;
  // Not serialized with the array; the controller reports it so the form can explain an empty list.
  Object.defineProperty(results, 'meta', {
    value: { outsideRadius, radiusMeters: enforce ? Number(radius) : null, distanceOrigin },
    enumerable: false,
  });
  return results;
};
