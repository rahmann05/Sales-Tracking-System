import {salesScope} from '../../../utils/team-scope.js';
import {wibDayRange} from '../../../../../shared/visit-metrics.mjs';
/** getLiveSalesLocations - single-responsibility service (extracted from users.service.js). */
import { prisma } from '../../../config/prisma.js';
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { liveLocationsCache } from './users.helpers.js';
import { getDynamicConfig } from '../../config/config.service.js';

/**
 * Get Live Locations of all Sales Representatives (for Admin, Ops, Supervisor)
 */
export const getLiveSalesLocations = async (currentUser) => {
  const today=wibDayRange().gte;
  const tomorrow=new Date(wibDayRange().lte.getTime()+1);

  // 1. Get all Sales users with lean projection (Google Web Vitals DB Optimization)
  const salesUsers = await prisma.user.findMany({
    where: { role: 'SALES', deletedAt: null, ...salesScope(currentUser) },
    select: {
      id: true,
      name: true,
      email: true,
      clusterId: true,
      cluster: {
        select: {
          id: true,
          name: true,
          centerLat: true,
          centerLng: true,
        },
      },
      pjps: {
        where: { date: { gte: today, lt: tomorrow } },
        take: 1,
        select: {
          id: true,
          stops: {
            select: {
              id: true,
              sequence: true,
              status: true,
              outlet: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  latitude: true,
                  longitude: true,
                },
              },
              attendances: {
                select: { type: true },
                take: 2,
              },
            },
            orderBy: { sequence: 'asc' },
          },
        },
      },
      attendances: {
        where: { timestamp: { gte: today, lt: tomorrow } },
        orderBy: { timestamp: 'desc' },
        take: 1,
        select: {
          latitude: true,
          longitude: true,
          timestamp: true,
          pjpStop: {
            select: {
              outlet: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  const nowMs = Date.now();
  
  const PING_TIMEOUT = await getDynamicConfig('LIVE_TRACKING_PING_TIMEOUT_MINUTES', 15);
  const ATTENDANCE_TIMEOUT = await getDynamicConfig('LIVE_TRACKING_ATTENDANCE_TIMEOUT_MINUTES', 60);
  const DEFAULT_LAT = await getDynamicConfig('DEFAULT_OFFICE_LATITUDE', -6.884984);
  const DEFAULT_LNG = await getDynamicConfig('DEFAULT_OFFICE_LONGITUDE', 107.489953);

  return salesUsers.map((sales) => {
    const livePing = liveLocationsCache.get(sales.id);
    const lastAttendance = sales.attendances?.[0];
    const todayPjp = sales.pjps?.[0];
    const stops = todayPjp?.stops || [];

    const completedStops = stops.filter((s) => s.status === 'VISITED' || s.attendances?.some((a) => a.type === 'OUT')).length;
    const currentStop = stops.find((s) => s.status === 'IN_VISIT' || s.status === 'ARRIVED') || null;
    const nextPendingStop = stops.find((s) => s.status === 'PENDING') || null;

    let lat = DEFAULT_LAT;
    let lng = DEFAULT_LNG;
    let locationSource = 'DEFAULT';
    let lastUpdated = null;
    let isOnline = false;

    if (livePing && livePing.latitude) {
      lat = livePing.latitude;
      lng = livePing.longitude;
      locationSource = 'LIVE_GPS_PING';
      lastUpdated = livePing.updatedAt;
      const ageMinutes = (nowMs - new Date(livePing.updatedAt).getTime()) / 60000;
      isOnline = ageMinutes <= PING_TIMEOUT;
    } else if (lastAttendance && lastAttendance.latitude) {
      lat = lastAttendance.latitude;
      lng = lastAttendance.longitude;
      locationSource = 'LAST_ATTENDANCE';
      lastUpdated = lastAttendance.timestamp.toISOString();
      const ageMinutes = (nowMs - new Date(lastAttendance.timestamp).getTime()) / 60000;
      isOnline = ageMinutes <= ATTENDANCE_TIMEOUT;
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
