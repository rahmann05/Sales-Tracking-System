import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { calculateDistanceMeters } from '../../utils/geolocation.js';

/** Reusable select object for clean user queries */
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  clusterId: true,
  cluster: { select: { id: true, name: true, region: true, centerLat: true, centerLng: true } },
  createdAt: true,
};

// Global in-memory cache for live GPS positions from sales device pings
const liveLocationsCache = new Map();

export const getUsers = async (query = {}) => {
  const { role, clusterId, search } = query;
  const where = { deletedAt: null };

  if (role) where.role = role;
  if (clusterId) where.clusterId = clusterId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  return users.map(enrichUserResponse);
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!user || user.deletedAt) {
    throw new AppError('User tidak ditemukan', 404);
  }
  return enrichUserResponse(user);
};

export const createUser = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email sudah terdaftar', 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const created = await prisma.user.create({
    data: { ...data, password: hashedPassword },
    select: USER_SELECT,
  });
  return enrichUserResponse(created);
};

export const updateUser = async (id, data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });
  return enrichUserResponse(updated);
};

export const deleteUser = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

/**
 * Update real-time GPS coordinates of a user (Sales device live ping)
 */
export const updateSalesLocation = async (userId, locationData = {}) => {
  const { latitude, longitude, accuracy = 10, speed = 0, heading = 0, battery = null } = locationData;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new AppError('Koordinat latitude dan longitude wajib berupa angka', 400);
  }

  const existing = liveLocationsCache.get(userId) || { breadcrumbs: [] };
  const now = new Date();

  // Keep last 20 breadcrumb locations for trail
  const newBreadcrumb = {
    lat: latitude,
    lng: longitude,
    time: now.toISOString(),
  };

  const updatedBreadcrumbs = [
    newBreadcrumb,
    ...(existing.breadcrumbs || []).slice(0, 19),
  ];

  const record = {
    userId,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    battery,
    updatedAt: now.toISOString(),
    isOnline: true,
    breadcrumbs: updatedBreadcrumbs,
  };

  liveLocationsCache.set(userId, record);
  return record;
};

/**
 * Get Live Locations of all Sales Representatives (for Admin, Ops, Supervisor)
 */
export const getLiveSalesLocations = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Get all Sales users
  const salesUsers = await prisma.user.findMany({
    where: { role: 'SALES', deletedAt: null },
    include: {
      cluster: true,
      pjps: {
        where: { date: { gte: today, lt: tomorrow } },
        include: {
          stops: {
            include: { outlet: true, attendances: { orderBy: { timestamp: 'desc' } } },
            orderBy: { sequence: 'asc' },
          },
        },
      },
      attendances: {
        where: { timestamp: { gte: today, lt: tomorrow } },
        orderBy: { timestamp: 'desc' },
        take: 1,
        include: { pjpStop: { include: { outlet: true } } },
      },
    },
  });

  const nowMs = Date.now();

  return salesUsers.map((sales) => {
    const livePing = liveLocationsCache.get(sales.id);
    const lastAttendance = sales.attendances?.[0];
    const todayPjp = sales.pjps?.[0];
    const stops = todayPjp?.stops || [];

    const completedStops = stops.filter((s) => s.status === 'VISITED' || s.attendances?.some((a) => a.type === 'OUT')).length;
    const currentStop = stops.find((s) => s.status === 'IN_VISIT' || s.status === 'ARRIVED') || null;
    const nextPendingStop = stops.find((s) => s.status === 'PENDING') || null;

    let lat = -6.884984;
    let lng = 107.489953;
    let locationSource = 'DEFAULT';
    let lastUpdated = null;
    let isOnline = false;

    if (livePing && livePing.latitude) {
      lat = livePing.latitude;
      lng = livePing.longitude;
      locationSource = 'LIVE_GPS_PING';
      lastUpdated = livePing.updatedAt;
      const ageMinutes = (nowMs - new Date(livePing.updatedAt).getTime()) / 60000;
      isOnline = ageMinutes <= 15; // Online if pinged within last 15 minutes
    } else if (lastAttendance && lastAttendance.latitude) {
      lat = lastAttendance.latitude;
      lng = lastAttendance.longitude;
      locationSource = 'LAST_ATTENDANCE';
      lastUpdated = lastAttendance.timestamp.toISOString();
      const ageMinutes = (nowMs - new Date(lastAttendance.timestamp).getTime()) / 60000;
      isOnline = ageMinutes <= 60;
    } else if (sales.cluster?.centerLat && sales.cluster?.centerLng) {
      lat = sales.cluster.centerLat;
      lng = sales.cluster.centerLng;
      locationSource = 'CLUSTER_CENTER';
    }

    // Determine current activity status
    let activityStatus = 'OFFLINE';
    let activityDescription = 'Belum aktif / Tidak ada sinyal GPS hari ini';

    if (currentStop) {
      activityStatus = 'IN_VISIT';
      activityDescription = `Sedang kunjungan di toko "${currentStop.outlet?.name || 'Toko'}" (#${currentStop.sequence})`;
    } else if (isOnline && (livePing?.speed || 0) > 2) {
      activityStatus = 'TRAVELING';
      activityDescription = `Sedang di perjalanan (${Math.round(livePing.speed * 3.6)} km/jam)`;
    } else if (isOnline) {
      activityStatus = 'ONLINE_IDLE';
      activityDescription = 'Online / Di area kerja';
    } else if (lastAttendance) {
      activityStatus = 'LAST_SEEN';
      activityDescription = `Terakhir absen di "${lastAttendance.pjpStop?.outlet?.name || 'Toko'}"`;
    }

    // Calculate distance to next stop if coordinates available
    let distanceToNextStopMeters = null;
    if (nextPendingStop?.outlet?.latitude && lat && lng) {
      distanceToNextStopMeters = Math.round(
        calculateDistanceMeters(lat, lng, nextPendingStop.outlet.latitude, nextPendingStop.outlet.longitude)
      );
    }

    return {
      salesId: sales.id,
      salesName: sales.name,
      email: sales.email,
      clusterId: sales.clusterId,
      clusterName: sales.cluster?.name || 'Cimahi & Padalarang',
      latitude: lat,
      longitude: lng,
      accuracy: livePing?.accuracy || 10,
      speed: livePing?.speed || 0,
      isOnline,
      locationSource,
      lastUpdated,
      activityStatus,
      activityDescription,
      pjpProgress: {
        totalStops: stops.length,
        completedStops,
        progressPercent: stops.length > 0 ? Math.round((completedStops / stops.length) * 100) : 0,
        currentStopName: currentStop?.outlet?.name || null,
        nextStopName: nextPendingStop?.outlet?.name || null,
        nextStopAddress: nextPendingStop?.outlet?.address || null,
        distanceToNextStopMeters,
      },
      breadcrumbs: livePing?.breadcrumbs || [],
    };
  });
};

const ROLE_LABELS = {
  SALES: 'Sales Field Rep',
  SUPERVISOR: 'Supervisor Operasional',
  ADMIN: 'Admin Penjualan',
  MANAJER_OPERASIONAL: 'Manajer Operasional',
};

const enrichUserResponse = (user) => ({
  ...user,
  region: user.cluster?.region ?? null,
  clusterName: user.cluster?.name ?? null,
  roleLabel: ROLE_LABELS[user.role] ?? user.role,
});
