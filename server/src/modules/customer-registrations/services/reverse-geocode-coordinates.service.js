/** reverseGeocodeCoordinates - single-responsibility service (extracted from customer-registrations.service.js). */
import { GOOGLE_API_KEY } from './customer-registrations.helpers.js';

/**
 * Reverse geocode lat/lng into address, kecamatan, kelurahan, area
 */
export const reverseGeocodeCoordinates = async (lat, lng) => {
  const result = {
    address: '',
    subAreaKecamatan: '',
    kelurahan: '',
    area: 'CIMAHI',
    latitude: parseFloat(Number(lat).toFixed(6)),
    longitude: parseFloat(Number(lng).toFixed(6)),
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  };

  if (GOOGLE_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data?.results && data.results.length > 0) {
        const top = data.results[0];
        result.address = top.formatted_address;

        for (const comp of top.address_components || []) {
          const types = comp.types || [];
          if (types.includes('administrative_area_level_3') || types.includes('locality')) {
            result.subAreaKecamatan = comp.long_name.replace(/Kecamatan\s*/i, '');
          }
          if (types.includes('administrative_area_level_4') || types.includes('sublocality')) {
            result.kelurahan = comp.long_name.replace(/Kelurahan\s*|Desa\s*/i, '');
          }
          if (types.includes('administrative_area_level_2')) {
            const cityName = comp.long_name.toUpperCase();
            if (cityName.includes('BANDUNG BARAT')) result.area = 'KAB_BANDUNG_BARAT';
            else if (cityName.includes('KABUPATEN BANDUNG')) result.area = 'KAB_BANDUNG';
            else if (cityName.includes('KOTA BANDUNG')) result.area = 'KOTA_BANDUNG';
            else if (cityName.includes('CIMAHI')) result.area = 'CIMAHI';
          }
        }
      }
    } catch (err) {
      console.warn('[reverseGeocode] Google API error:', err.message);
    }
  }

  // Fallback to OSM Reverse Geocode
  if (!result.subAreaKecamatan) {
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const res = await fetch(osmUrl, {
        headers: { 'User-Agent': 'SinarAnugrahDistribution/1.0' },
      });
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        result.address = result.address || data.display_name;
        result.subAreaKecamatan = a.suburb || a.municipality || a.city_district || a.town || '';
        result.kelurahan = a.village || a.quarter || a.neighbourhood || '';
        const reg = (a.county || a.city || a.state_district || '').toUpperCase();
        if (reg.includes('BANDUNG BARAT')) result.area = 'KAB_BANDUNG_BARAT';
        else if (reg.includes('KABUPATEN BANDUNG')) result.area = 'KAB_BANDUNG';
        else if (reg.includes('KOTA BANDUNG')) result.area = 'KOTA_BANDUNG';
        else result.area = 'CIMAHI';
      }
    } catch (err) {
      console.warn('[reverseGeocode] OSM error:', err.message);
    }
  }

  return result;
};
