import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {salesScope} from '../../../utils/team-scope.js';
import {wibDayRange,wibDateKey} from '../../../../../shared/visit-metrics.mjs';
/** getLiveSalesLocations - single-responsibility service (extracted from users.service.js). */
import { prisma } from '../../../config/prisma.js';
import { distanceToOutlet } from '../../../utils/geolocation.js';
import {locationExpired} from '../../../../../shared/location-retention.mjs';
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
      salesLivePosition:true,
      name: true,
      email: true,
      role:true,supervisorId:true,
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
              status: true,visitSession:true,
              outlet: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  googleLocation:true,phone:true,clusterId:true,latitude:true,
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
          gpsEvidence: true,
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

  return Promise.all(salesUsers.map(async(sales) => {
    const actorPolicy=await effectivePolicy(sales),trackingMode=actorPolicy.values.SALES_TRACKING_MODE||'LOGIN';
    const livePing=locationExpired(sales.salesLivePosition,actorPolicy.values.TRACKING_LOCATION_RETENTION_HOURS,nowMs)?null:sales.salesLivePosition;
    const lastAttendance = sales.attendances?.[0];
    const todayPjp = sales.pjps?.[0];
    const stops = todayPjp?.stops || [];

    const completedStops = stops.filter((s) => s.status === 'VISITED' || s.visitSession?.state==='FINISHED' || s.attendances?.some((a) => a.type === 'OUT')).length;
    const currentStop = stops.find((s) => s.status === 'IN_VISIT' || s.status === 'ARRIVED' || s.visitSession?.state==='ACTIVE' || s.status==='PENDING'&&s.attendances?.some(a=>a.type==='IN')&&!s.attendances?.some(a=>a.type==='OUT')) || null;
    const nextPendingStop = stops.find((s) => s.status === 'PENDING') || null;

    let lat = null;
    let lng = null;
    let locationSource = 'UNKNOWN';
    let lastUpdated = null;
    let isOnline = false;

    if (livePing && Number.isFinite(livePing.latitude)&&Number.isFinite(livePing.longitude)) {
      lat = livePing.latitude;
      lng = livePing.longitude;
      locationSource = 'LIVE_GPS_PING';
      lastUpdated = (livePing.observedAt||livePing.receivedAt)?.toISOString();
      const observed=livePing.observedAt?+livePing.observedAt:NaN,ageMinutes=(nowMs-observed)/60000;
      isOnline = trackingMode!=='OFF'&&Number.isFinite(observed)&&observed<=nowMs+30000&&ageMinutes <= (actorPolicy.values.LIVE_TRACKING_PING_TIMEOUT_MINUTES??PING_TIMEOUT);
      if(trackingMode==='VISIT'&&!currentStop)isOnline=false;
      if(trackingMode==='SHIFT'){const shift=await prisma.staffActivity.findFirst({where:{userId:sales.id,kind:'SHIFT',checkOutAt:null,dateKey:wibDateKey()}});if(!shift||shift.checklist?.state==='FINISHED')isOnline=false;}
    } else if (lastAttendance && Number.isFinite(lastAttendance.latitude)&&Number.isFinite(lastAttendance.longitude)) {
      lat = lastAttendance.latitude;
      lng = lastAttendance.longitude;
      locationSource = 'LAST_ATTENDANCE';
      lastUpdated = lastAttendance.timestamp.toISOString();
      isOnline = false;
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
    const nextDistance=nextPendingStop?.outlet?distanceToOutlet(lat,lng,nextPendingStop.outlet):null;
    const distanceToNextStopMeters=nextDistance==null?null:Math.round(nextDistance);

    return {
      salesId: sales.id,
      salesName: sales.name,
      email: sales.email,
      clusterId: sales.clusterId,
      clusterName: sales.cluster?.name || 'Belum ditugaskan',
      latitude: lat,
      longitude: lng,
      accuracy: locationSource==='LIVE_GPS_PING'?livePing?.accuracy??null:locationSource==='LAST_ATTENDANCE'?lastAttendance?.gpsEvidence?.accuracy??null:null,
      observedAt:locationSource==='LIVE_GPS_PING'?livePing?.observedAt?.toISOString()??null:lastAttendance?.gpsEvidence?.observedAt??null,
      receivedAt:locationSource==='LIVE_GPS_PING'?livePing?.receivedAt?.toISOString()??null:null,
      trackingMode,
      speed: livePing?.speed??null,
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
  }));
};
