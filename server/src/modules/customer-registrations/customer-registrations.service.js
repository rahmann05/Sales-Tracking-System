import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { ROLES } from '../../utils/constants.js';
import { broadcastCacheInvalidation } from '../../config/socket.js';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Helper: Calculate distance in meters between two lat/lng points
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

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

import { saveOutletPhoto } from './customer-photo.service.js';

/**
 * 1. Create Outlet Registration (Salesman)
 */
export const createRegistration = async (data, currentUser) => {
  const { latitude = 0, longitude = 0, name, address, photoUrl: incomingPhotoUrl } = data;

  // 1. Process and save outlet photo to local storage bucket folder if provided
  let photoId = data.photoId || null;
  let photoUrl = incomingPhotoUrl || null;

  if (incomingPhotoUrl && incomingPhotoUrl.startsWith('data:image')) {
    const photoResult = await saveOutletPhoto(incomingPhotoUrl, 'PHOTO-REG');
    photoId = photoResult.photoId;
    photoUrl = photoResult.photoUrl;
  }

  // 2. Run Google Place verification
  const placeValidation = await validateGooglePlace(name, address, latitude, longitude);

  const registration = await prisma.customerRegistration.create({
    data: {
      ...data,
      photoId,
      photoUrl,
      placeId: data.placeId || (placeValidation?.isPlaceFound ? 'PLACE-VERIFIED' : null),
      placeDetails: data.placeDetails || placeValidation || null,
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
      salesmanId: currentUser.id,
      salesmanName: currentUser.name,
      registrationStatus: 'SUBMITTED',
    },
  });

  // Kirim notifikasi ke SPV dan Manajer Operasional
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: { in: [ROLES.SUPERVISOR, ROLES.MANAJER_OPERASIONAL, ROLES.ADMIN] },
        deletedAt: null,
      },
    });

    for (const mgr of managers) {
      await prisma.notification.create({
        data: {
          userId: mgr.id,
          type: 'OUTLET_REGISTRATION_SUBMITTED',
          title: 'Pengajuan Registrasi Outlet Baru',
          message: `Salesman ${currentUser.name} telah mengajukan registrasi outlet "${name}" di ${data.area || 'Cimahi'}.`,
          payload: {
            registrationId: registration.id,
            outletName: name,
            salesmanName: currentUser.name,
          },
        },
      });
    }
  } catch (err) {
    console.warn('[CustomerRegistration] Failed to create notifications:', err.message);
  }

  broadcastCacheInvalidation('customer-registrations');
  return { ...registration, placeValidation };
};

/**
 * 2. Get Paginated Registrations
 */
export const getRegistrations = async (query = {}, currentUser) => {
  const {
    status = 'ALL',
    area = 'ALL',
    channel = 'ALL',
    division = 'ALL',
    search = '',
    startDate,
    endDate,
  } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = { deletedAt: null };

  // Sales only sees their own submissions unless privileged
  if (currentUser?.role === ROLES.SALES) {
    where.salesmanId = currentUser.id;
  }

  if (status !== 'ALL') where.registrationStatus = status;
  if (area !== 'ALL') where.area = area;
  if (channel !== 'ALL') where.channel = channel;
  if (division !== 'ALL') where.division = division;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { customerCode: { contains: search, mode: 'insensitive' } },
      { salesmanName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [data, total, statusCounts] = await Promise.all([
    prisma.customerRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.customerRegistration.count({ where }),
    // Summary status counts
    prisma.customerRegistration.groupBy({
      by: ['registrationStatus'],
      where: currentUser?.role === ROLES.SALES ? { salesmanId: currentUser.id, deletedAt: null } : { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const countsMap = {
    TOTAL: total,
    SUBMITTED: 0,
    SPV_APPROVED: 0,
    OPS_APPROVED: 0,
    REGISTERED_ACTIVE: 0,
    REJECTED: 0,
  };
  statusCounts.forEach((c) => {
    countsMap[c.registrationStatus] = c._count._all;
  });

  const response = buildPaginatedResponse(data, total, page, limit);
  return { ...response, statusCounts: countsMap };
};

/**
 * 3. Get Registration By ID
 */
export const getRegistrationById = async (id) => {
  const registration = await prisma.customerRegistration.findUnique({
    where: { id },
  });
  if (!registration) throw new AppError('Data registrasi outlet tidak ditemukan', 404);

  const placeValidation = await validateGooglePlace(
    registration.name,
    registration.address,
    registration.latitude,
    registration.longitude
  );

  return { ...registration, placeValidation };
};

/**
 * 4. Approve Registration (Supervisor or Ops Manager)
 */
export const approveRegistration = async (id, note, currentUser) => {
  const registration = await prisma.customerRegistration.findUnique({ where: { id } });
  if (!registration) throw new AppError('Data registrasi tidak ditemukan', 404);

  const isSupervisor = currentUser.role === ROLES.SUPERVISOR;
  const isOpsManager = currentUser.role === ROLES.MANAJER_OPERASIONAL;
  const isAdmin = currentUser.role === ROLES.ADMIN;

  if (!isSupervisor && !isOpsManager && !isAdmin) {
    throw new AppError('Anda tidak memiliki wewenang untuk menyetujui pengajuan ini', 403);
  }

  const updateData = {};
  if (isSupervisor) {
    updateData.spvName = currentUser.name;
    updateData.spvApprovedAt = new Date();
    updateData.registrationStatus = 'SPV_APPROVED';
  } else if (isOpsManager || isAdmin) {
    updateData.opsManagerName = currentUser.name;
    updateData.opsApprovedAt = new Date();
    updateData.registrationStatus = 'OPS_APPROVED';
  }

  const updated = await prisma.customerRegistration.update({
    where: { id },
    data: updateData,
  });

  // Notifikasi ke Salesman dan Admin
  if (registration.salesmanId) {
    await prisma.notification.create({
      data: {
        userId: registration.salesmanId,
        type: 'OUTLET_REGISTRATION_APPROVED',
        title: 'Pengajuan Outlet Disetujui',
        message: `Pengajuan outlet "${registration.name}" telah disetujui oleh ${currentUser.name} (${currentUser.role}).`,
        payload: { registrationId: id, status: updated.registrationStatus },
      },
    }).catch(() => null);
  }

  broadcastCacheInvalidation('customer-registrations');
  return updated;
};

/**
 * 5. Reject Registration
 */
export const rejectRegistration = async (id, reason, currentUser) => {
  const registration = await prisma.customerRegistration.findUnique({ where: { id } });
  if (!registration) throw new AppError('Data registrasi tidak ditemukan', 404);

  const isSupervisor = currentUser.role === ROLES.SUPERVISOR;
  const isOpsManager = currentUser.role === ROLES.MANAJER_OPERASIONAL;
  const isAdmin = currentUser.role === ROLES.ADMIN;

  if (!isSupervisor && !isOpsManager && !isAdmin) {
    throw new AppError('Anda tidak memiliki wewenang untuk menolak pengajuan ini', 403);
  }

  const updated = await prisma.customerRegistration.update({
    where: { id },
    data: {
      registrationStatus: 'REJECTED',
      rejectionNote: reason,
    },
  });

  // Notifikasi ke Salesman
  if (registration.salesmanId) {
    await prisma.notification.create({
      data: {
        userId: registration.salesmanId,
        type: 'OUTLET_REGISTRATION_REJECTED',
        title: 'Pengajuan Outlet Ditolak',
        message: `Pengajuan outlet "${registration.name}" ditolak oleh ${currentUser.name}. Alasan: ${reason}`,
        payload: { registrationId: id, reason },
      },
    }).catch(() => null);
  }

  broadcastCacheInvalidation('customer-registrations');
  return updated;
};

/**
 * 6. Finalize and Register Active Outlet (Admin)
 * Aturan: Jika sudah disetujui salah satu (SPV_APPROVED atau OPS_APPROVED) atau Admin langsung,
 * Admin dapat memprosesnya untuk langsung disimpan di tabel Outlet aktif!
 */
export const finalizeAndRegisterByAdmin = async (id, payload, currentUser) => {
  if (currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.MANAJER_OPERASIONAL) {
    throw new AppError('Hanya Admin atau Manajer Operasional yang dapat mendaftarkan outlet ke sistem aktif', 403);
  }

  const registration = await prisma.customerRegistration.findUnique({ where: { id } });
  if (!registration) throw new AppError('Data registrasi tidak ditemukan', 404);

  const { customerCode, clusterId } = payload;

  // Cek apakah kode outlet sudah ada di tabel Outlet
  const existingOutlet = await prisma.outlet.findFirst({
    where: { outletCode: customerCode, deletedAt: null },
  });
  if (existingOutlet) {
    throw new AppError(`Kode outlet "${customerCode}" sudah digunakan oleh toko "${existingOutlet.name}"`, 400);
  }

  // Tentukan Cluster: prioritaskan clusterId dari payload, atau cari cluster berdasarkan Area
  let targetClusterId = clusterId;
  if (!targetClusterId) {
    const matchedCluster = await prisma.cluster.findFirst({
      where: {
        OR: [
          { name: { contains: registration.area, mode: 'insensitive' } },
          { region: { contains: registration.area, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
    });
    targetClusterId = matchedCluster?.id;
  }

  // Jika belum ada cluster, gunakan cluster aktif pertama
  if (!targetClusterId) {
    const firstCluster = await prisma.cluster.findFirst({ where: { deletedAt: null } });
    targetClusterId = firstCluster?.id;
  }

  if (!targetClusterId) {
    throw new AppError('Tidak ada klaster wilayah yang tersedia untuk mengaitkan outlet baru', 400);
  }

  // 1. Update status CustomerRegistration
  const updatedRegistration = await prisma.customerRegistration.update({
    where: { id },
    data: {
      customerCode,
      registrationStatus: 'REGISTERED_ACTIVE',
      adminName: currentUser.name,
      adminRegisteredAt: new Date(),
    },
  });

  // 2. Masukkan ke tabel master Outlet aktif
  const outletType = registration.channel === 'MODERN_TRADE' ? 'MODERN_TRADE' : 'GENERAL_TRADE';
  const newOutlet = await prisma.outlet.create({
    data: {
      outletCode,
      name: registration.name,
      address: registration.address,
      latitude: registration.latitude || -6.8722,
      longitude: registration.longitude || 107.5422,
      clusterId: targetClusterId,
      type: outletType,
      ownerName: registration.ownerName || registration.taxName,
      phone: registration.phone,
      radiusMeters: 50,
      validationStatus: 'VALID',
      validationConfidence: 95,
      validatedAt: new Date(),
    },
  });

  // Notifikasi ke Salesman dan Ops
  if (registration.salesmanId) {
    await prisma.notification.create({
      data: {
        userId: registration.salesmanId,
        type: 'OUTLET_REGISTERED_ACTIVE',
        title: 'Outlet Berhasil Terdaftar di Sistem',
        message: `Outlet "${registration.name}" telah resmi didaftarkan dengan Kode Outlet: ${customerCode}. Outlet kini aktif dalam sistem.`,
        payload: { registrationId: id, outletId: newOutlet.id, customerCode },
      },
    }).catch(() => null);
  }

  broadcastCacheInvalidation('customer-registrations');
  broadcastCacheInvalidation('outlets');

  return { registration: updatedRegistration, outlet: newOutlet };
};
