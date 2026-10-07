/** searchPlaces - single-responsibility service (extracted from customer-registrations.service.js). */
import { GOOGLE_API_KEY, getDistanceInMeters } from './customer-registrations.helpers.js';
import { getDynamicConfig } from '../../config/config.service.js';

/**
 * Search places by query keyword strictly within configurable radius of current coordinates via Google Places API
 */
export const searchPlaces = async (keyword, lat = null, lng = null) => {
  if (!keyword || keyword.trim().length < 2) return [];

  const defaultLat = await getDynamicConfig('DEFAULT_OFFICE_LATITUDE', -6.8722);
  const defaultLng = await getDynamicConfig('DEFAULT_OFFICE_LONGITUDE', 107.5422);
  const searchRadius = await getDynamicConfig('CUSTOMER_REG_PLACES_RADIUS_METERS', 100);
  const enforceRadius = await getDynamicConfig('CUSTOMER_REG_ENFORCE_PLACES_RADIUS', true);
  const apiKey = await getDynamicConfig('MAPS_API_KEY', '') || GOOGLE_API_KEY;

  const results = [];
  const cleanKeyword = keyword.trim();
  const userLat = lat != null && Number.isFinite(Number(lat)) ? Number(lat) : defaultLat;
  const userLng = lng != null && Number.isFinite(Number(lng)) ? Number(lng) : defaultLng;

  // 1. Google Places Text Search within strictly searchRadius meters
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        cleanKeyword
      )}&location=${userLat},${userLng}&radius=${searchRadius}&key=${apiKey}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data?.results && data.results.length > 0) {
        for (const item of data.results) {
          const itemLat = item.geometry?.location?.lat;
          const itemLng = item.geometry?.location?.lng;

          // Strictly enforce radius check
          if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) continue;
          const dist = (itemLat != null && itemLng != null)
            ? getDistanceInMeters(userLat, userLng, itemLat, itemLng)
            : 0;

          if (enforceRadius && dist > searchRadius) {
            continue; // Outside radius, skip
          }

          // Determine Area based on address text
          let area = 'CIMAHI';
          const addr = (item.formatted_address || '').toUpperCase();
          if (addr.includes('BANDUNG BARAT') || addr.includes('PADALARANG') || addr.includes('LEMBANG') || addr.includes('BATUJAJAR')) {
            area = 'KAB_BANDUNG_BARAT';
          } else if (addr.includes('KAB') && addr.includes('BANDUNG')) {
            area = 'KAB_BANDUNG';
          } else if (addr.includes('KOTA BANDUNG')) {
            area = 'KOTA_BANDUNG';
          }

          // Category mapping
          let categoryName = 'Toko Retail';
          const types = item.types || [];
          if (types.includes('grocery_or_supermarket') || types.includes('supermarket')) {
            categoryName = 'Toko makanan beku & Supermarket';
          } else if (types.includes('store') || types.includes('food')) {
            categoryName = 'Toko makanan & sembako';
          } else if (types.includes('pharmacy')) {
            categoryName = 'Apotek';
          } else if (types.includes('wholesaler')) {
            categoryName = 'Grosir';
          }

          // Photo reference if exists
          let photoUrl = null;
          if (item.photos && item.photos.length > 0) {
            const photoRef = item.photos[0].photo_reference;
            // Photo URLs sent to the client use only the browser Maps key.
            const browserKey = await getDynamicConfig('MAPS_BROWSER_API_KEY', '');
            if (browserKey) photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${browserKey}`;
          }

          const placeObj = {
            placeId: item.place_id,
            name: item.name,
            address: item.formatted_address,
            latitude: itemLat ? parseFloat(itemLat.toFixed(6)) : userLat,
            longitude: itemLng ? parseFloat(itemLng.toFixed(6)) : userLng,
            distanceMeters: dist,
            rating: item.rating || 5.0,
            userRatingsTotal: item.user_ratings_total || 1,
            categoryName,
            types: item.types || ['store'],
            openNow: item.opening_hours?.open_now ?? true,
            openingHoursText: item.opening_hours?.open_now ? 'Buka · Tutup pukul 22.00' : 'Tutup · Buka pukul 08.00',
            plusCode: item.plus_code?.compound_code || `${userLat?.toFixed(4)}, ${userLng?.toFixed(4)}`,
            photoUrl,
            phone: '0838-2217-0889',
            deliveryInfo: ['Ambil di toko', 'Pesan antar'],
            area,
            googleMapsUrl: item.place_id
              ? `https://www.google.com/maps/place/?q=place_id:${item.place_id}`
              : `https://www.google.com/maps/search/?api=1&query=${userLat},${userLng}`,
            source: 'GOOGLE_PLACE',
          };

          results.push(placeObj);
        }
      }
    } catch (err) {
      console.warn('[searchPlaces] Google API error:', err.message);
    }
  }

  // 2. OpenStreetMap uses the same radius policy as Google.
  if (results.length === 0) {
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        cleanKeyword
      )}&format=json&addressdetails=1&limit=5`;

      const res = await fetch(osmUrl, {
        headers: { 'User-Agent': 'SinarAnugrahDistribution/1.0' },
      });
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        for (const item of data) {
          const itemLat = parseFloat(item.lat);
          const itemLng = parseFloat(item.lon);
          if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) continue;

          const dist = getDistanceInMeters(userLat, userLng, itemLat, itemLng);
          if (enforceRadius && dist > searchRadius) {
            continue;
          }

          const addrObj = item.address || {};
          let area = 'CIMAHI';
          const cityOrCounty = (addrObj.city || addrObj.county || addrObj.state_district || '').toUpperCase();
          if (cityOrCounty.includes('BANDUNG BARAT')) {
            area = 'KAB_BANDUNG_BARAT';
          } else if (cityOrCounty.includes('KABUPATEN BANDUNG')) {
            area = 'KAB_BANDUNG';
          } else if (cityOrCounty.includes('KOTA BANDUNG')) {
            area = 'KOTA_BANDUNG';
          }

          results.push({
            placeId: `osm-${item.osm_id}`,
            name: item.display_name.split(',')[0],
            address: item.display_name,
            latitude: parseFloat(itemLat.toFixed(6)),
            longitude: parseFloat(itemLng.toFixed(6)),
            distanceMeters: dist,
            subAreaKecamatan: addrObj.suburb || addrObj.municipality || addrObj.neighbourhood || '',
            kelurahan: addrObj.village || addrObj.quarter || '',
            rating: 5.0,
            userRatingsTotal: 1,
            categoryName: 'Toko makanan beku & grosir',
            openNow: true,
            openingHoursText: 'Buka · Tutup pukul 22.00',
            plusCode: `4F7R+X3 ${addrObj.suburb || 'Padalarang'}, Kabupaten Bandung Barat`,
            phone: '0838-2217-0889',
            deliveryInfo: ['Ambil di toko', 'Pesan antar'],
            area,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${userLat},${userLng}`,
            source: 'OSM_NOMINATIM',
          });
        }
      }
    } catch (err) {
      console.warn('[searchPlaces] OSM Fallback error:', err.message);
    }
  }

  return results;
};
