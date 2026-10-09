import {request} from './httpClient';
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
  state = '',
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
  return result || rawAddress || null;
};

/**
 * Main detailed reverse geocoding function
 */
export const getDetailedAddressFromGps = async (lat, lng) => {
  if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;
  const response=await request('/routing/reverse-geocode',{method:'POST',body:JSON.stringify({lat,lng})});
  return response.data?.address||null;
};
