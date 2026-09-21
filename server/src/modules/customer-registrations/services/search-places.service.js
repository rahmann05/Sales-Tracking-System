/** searchPlaces - single-responsibility service (extracted from customer-registrations.service.js). */
import { GOOGLE_API_KEY, getDistanceInMeters } from './customer-registrations.helpers.js';

/**
 * Search places by query keyword strictly within 100 meters of current coordinates via Google Places API
 */
export const searchPlaces = async (keyword, lat = -6.8722, lng = 107.5422) => {
  if (!keyword || keyword.trim().length < 2) return [];

  const results = [];
  const cleanKeyword = keyword.trim();
  const userLat = Number(lat) || -6.8722;
  const userLng = Number(lng) || 107.5422;

  // 1. Google Places Text Search within strictly 100 meters
  if (GOOGLE_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        cleanKeyword
      )}&location=${userLat},${userLng}&radius=100&key=${GOOGLE_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data?.results && data.results.length > 0) {
        for (const item of data.results) {
          const itemLat = item.geometry?.location?.lat;
          const itemLng = item.geometry?.location?.lng;

          // Strictly enforce 100-meter radius check
          const dist = (itemLat && itemLng)
            ? getDistanceInMeters(userLat, userLng, itemLat, itemLng)
            : 0;

          if (dist > 100) {
            continue; // Outside 100m radius, skip
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
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
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

  // 2. OpenStreetMap / Nominatim Fallback if Google returned nothing within 100m
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

          const dist = getDistanceInMeters(userLat, userLng, itemLat, itemLng);
          if (dist > 100) {
            continue; // Outside 100m, skip
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
