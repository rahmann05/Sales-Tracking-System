/**
 * Reverse Geocode Service (Google Maps & OpenStreetMap High-Precision Geocoder)
 * Single Responsibility: Convert GPS coordinates (lat, lng) into Indonesian addresses
 * without any hardcoded or mocked data.
 * 1 File = 1 Pure Service
 */

/**
 * Format address elements into standard Indonesian detailed address:
 */
export const formatDetailedIndonesianAddress = ({
  road,
  houseNumber,
  rtrw,
  kelurahan,
  kecamatan,
  city,
  state = 'Jawa Barat',
  postcode,
  rawAddress,
}) => {
  const parts = [];

  // 1. Street and house number
  let streetPart = road || '';
  if (streetPart && !streetPart.startsWith('Jl.') && !streetPart.startsWith('Jalan')) {
    streetPart = `Jl. ${streetPart}`;
  }
  if (houseNumber) {
    streetPart += ` ${houseNumber.startsWith('No.') ? houseNumber : `No. ${houseNumber}`}`;
  }
  if (streetPart) parts.push(streetPart.trim());

  // 2. RT / RW
  if (rtrw) parts.push(rtrw);

  // 3. Kelurahan / Desa
  if (kelurahan) {
    const kelPart = kelurahan.startsWith('Kel.') || kelurahan.startsWith('Desa') ? kelurahan : `Kel. ${kelurahan}`;
    parts.push(kelPart);
  }

  // 4. Kecamatan
  if (kecamatan) {
    const kecPart = kecamatan.startsWith('Kec.') ? kecamatan : `Kec. ${kecamatan}`;
    parts.push(kecPart);
  }

  // 5. Kota / Kabupaten
  if (city) parts.push(city);

  // 6. Provinsi & Kode Pos
  const endPart = [state, postcode].filter(Boolean).join(' ');
  if (endPart) parts.push(endPart);

  const result = parts.join(', ');
  return result || rawAddress || 'Alamat Lokasi Terverifikasi GPS';
};

/**
 * Main detailed reverse geocoding function
 */
export const getDetailedAddressFromGps = async (lat, lng) => {
  if (lat == null || lng == null) return null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 1. Google Maps Geocoding API (Official Google Client)
  if (apiKey) {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=id`
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.results && gData.results.length > 0) {
          const result = gData.results[0];
          const comps = result.address_components || [];

          let road = '';
          let houseNumber = '';
          let rtrw = '';
          let kelurahan = '';
          let kecamatan = '';
          let city = '';
          let state = '';
          let postcode = '';

          comps.forEach((c) => {
            const types = c.types;
            if (types.includes('street_number')) houseNumber = `No. ${c.long_name}`;
            if (types.includes('route')) road = c.long_name;
            if (types.includes('neighborhood') || types.includes('sublocality_level_2')) {
              if (c.long_name.toLowerCase().includes('rw') || c.long_name.toLowerCase().includes('rt')) {
                rtrw = c.long_name;
              } else {
                kelurahan = c.long_name;
              }
            }
            if (types.includes('sublocality_level_1') || types.includes('administrative_area_level_4')) {
              if (!kelurahan) kelurahan = c.long_name;
            }
            if (types.includes('administrative_area_level_3')) kecamatan = c.long_name;
            if (types.includes('administrative_area_level_2')) city = c.long_name;
            if (types.includes('administrative_area_level_1')) state = c.long_name;
            if (types.includes('postal_code')) postcode = c.long_name;
          });

          return formatDetailedIndonesianAddress({
            road,
            houseNumber,
            rtrw,
            kelurahan,
            kecamatan,
            city,
            state,
            postcode,
            rawAddress: result.formatted_address,
          });
        }
      }
    } catch (err) {
      console.warn('[Google Geocode] fetch error, falling back to OSM Nominatim:', err);
    }
  }

  // 2. OpenStreetMap High-Precision Reverse Geocoding (Zoom 18 + Address Details)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`,
      {
        headers: { 'Accept-Language': 'id, en' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (osmRes.ok) {
      const osmData = await osmRes.json();
      if (osmData && osmData.address) {
        const a = osmData.address;
        const road = a.road || a.pedestrian || a.street || a.neighbourhood || '';
        const houseNumber = a.house_number ? `No. ${a.house_number}` : '';
        const kelurahan = a.village || a.suburb || a.hamlet || a.quarter || '';
        const kecamatan = a.city_district || a.municipality || '';
        const city = a.city || a.town || a.county || '';
        const state = a.state || '';
        const postcode = a.postcode || '';

        return formatDetailedIndonesianAddress({
          road,
          houseNumber,
          kelurahan,
          kecamatan,
          city,
          state,
          postcode,
          rawAddress: osmData.display_name,
        });
      }
    }
  } catch (err) {
    console.warn('[OSM Nominatim] error:', err);
  }

  // 3. Absolute Fallback
  return `GPS: ${lat}, ${lng}`;
};
