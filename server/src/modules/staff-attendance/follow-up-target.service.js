import { prisma } from '../../config/prisma.js';
import { outletOperationalPoint } from '../../../../shared/outlet-location.mjs';

const OUTLET_SELECT = {
  id: true,
  name: true,
  outletCode: true,
  address: true,
  latitude: true,
  longitude: true,
  radiusMeters: true,
  googleLocation: true,
  locationEvidence: true,
  source: true,
  deletedAt: true,
};

export function followUpTargetIds(record) {
  const f = record?.followUp || {};
  const scheduledStopId = f.scheduledVisit?.stopId || null;
  const sourceStopId =
    f.sourceKind === 'PJP_RESULT' && f.sourceId
      ? f.sourceId
      : typeof record?.activityKey === 'string' && record.activityKey.startsWith('COLLECTION:PJP_RESULT:')
        ? record.activityKey.slice('COLLECTION:PJP_RESULT:'.length)
        : record?.kind === 'VISIT' && record?.activityKey
          ? record.activityKey
          : null;
  const offPjpId =
    f.sourceKind === 'OFF_PJP' && f.sourceId
      ? f.sourceId
      : typeof record?.activityKey === 'string' && record.activityKey.startsWith('COLLECTION:OFF_PJP:')
        ? record.activityKey.slice('COLLECTION:OFF_PJP:'.length)
        : null;
  return {
    stopId: scheduledStopId || sourceStopId,
    offPjpId,
  };
}

export function formatTargetOutlet(outlet) {
  if (!outlet) return null;
  const point = outletOperationalPoint(outlet);
  return {
    id: outlet.id || null,
    name: outlet.name || '',
    outletCode: outlet.outletCode || null,
    address: outlet.address || null,
    latitude: point.latitude,
    longitude: point.longitude,
    radiusMeters: outlet.radiusMeters ?? 50,
    googleMapsOnly: Boolean(point.googleMapsOnly),
    outlet,
  };
}

export async function resolveFollowUpTargets(records = [], db = prisma) {
  const byId = new Map();
  if (!Array.isArray(records) || records.length === 0) return byId;

  const stopIds = new Set();
  const offPjpIds = new Set();
  const refs = records.map((record) => {
    const ref = followUpTargetIds(record);
    if (ref.stopId) stopIds.add(ref.stopId);
    if (ref.offPjpId) offPjpIds.add(ref.offPjpId);
    return { record, ref };
  });

  const [stops, offPjps] = await Promise.all([
    stopIds.size > 0 && typeof db.pjpStop?.findMany === 'function'
      ? db.pjpStop.findMany({
          where: { id: { in: [...stopIds] } },
          select: { id: true, outlet: { select: OUTLET_SELECT } },
        })
      : Promise.resolve([]),
    offPjpIds.size > 0 && typeof db.offPjpAttendance?.findMany === 'function'
      ? db.offPjpAttendance.findMany({
          where: { id: { in: [...offPjpIds] } },
          select: {
            id: true,
            outletId: true,
            outletName: true,
            address: true,
            latitude: true,
            longitude: true,
            outlet: { select: OUTLET_SELECT },
          },
        })
      : Promise.resolve([]),
  ]);

  const stopOutletMap = new Map(stops.map((s) => [s.id, s.outlet || null]));
  const offPjpOutletMap = new Map(
    offPjps.map((o) => [
      o.id,
      o.outlet || {
        id: o.outletId || null,
        name: o.outletName || '',
        address: o.address || null,
        latitude: o.latitude ?? null,
        longitude: o.longitude ?? null,
        radiusMeters: 50,
      },
    ])
  );

  for (const { record, ref } of refs) {
    const outlet =
      (ref.stopId && stopOutletMap.get(ref.stopId)) ||
      (ref.offPjpId && offPjpOutletMap.get(ref.offPjpId)) ||
      null;
    const formatted = formatTargetOutlet(outlet);
    if (formatted) {
      const { outlet: _raw, ...publicTarget } = formatted;
      byId.set(record.id, publicTarget);
    }
  }
  return byId;
}

export async function resolveFollowUpOutlet(record, db = prisma) {
  const { stopId, offPjpId } = followUpTargetIds(record);
  if (stopId && typeof db.pjpStop?.findUnique === 'function') {
    const stop = await db.pjpStop.findUnique({
      where: { id: stopId },
      select: { id: true, outlet: { select: OUTLET_SELECT } },
    });
    if (stop?.outlet) return formatTargetOutlet(stop.outlet);
  }
  if (offPjpId && typeof db.offPjpAttendance?.findUnique === 'function') {
    const offPjp = await db.offPjpAttendance.findUnique({
      where: { id: offPjpId },
      select: {
        id: true,
        outletId: true,
        outletName: true,
        address: true,
        latitude: true,
        longitude: true,
        outlet: { select: OUTLET_SELECT },
      },
    });
    if (offPjp) {
      return formatTargetOutlet(
        offPjp.outlet || {
          id: offPjp.outletId || null,
          name: offPjp.outletName || '',
          address: offPjp.address || null,
          latitude: offPjp.latitude ?? null,
          longitude: offPjp.longitude ?? null,
          radiusMeters: 50,
        }
      );
    }
  }
  return null;
}
