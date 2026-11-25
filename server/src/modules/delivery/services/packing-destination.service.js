import { prisma } from '../../../config/prisma.js';
import { packingOrderIds } from '../../../../../shared/packing-orders.mjs';
import { mileagePoint } from './vehicle-mileage-plan.service.js';
import { isVehicleLoad, loadLogistics } from '../../../../../shared/packing-load.mjs';

export function packingDestination(packing, orders) {
  if (isVehicleLoad(packing))
    return {
      destinationConflict: false,
      destinationPoint: packing.destinations?.length === 1 ? packing.destinations[0].point : null,
      destinationsReady:
        !!packing.destinations?.length && packing.destinations.every((row) => !!row.point),
      logistics: loadLogistics(packing),
    };
  const points = orders
    .filter((order) => packingOrderIds(packing).includes(order.id))
    .map((order) => mileagePoint(packing.outlet, order.customerSnapshot?.deliveryPoint))
    .filter(Boolean);
  const keys = new Set(
    points.map((point) => `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`)
  );
  return {
    destinationConflict: keys.size > 1,
    destinationPoint: keys.size > 1 ? null : points[0] || mileagePoint(packing.outlet),
  };
}

export async function withPackingDestinations(packings, db = prisma) {
  const ids = [...new Set(packings.flatMap(packingOrderIds))];
  const missingOutletIds = [
    ...new Set(
      packings
        .filter(isVehicleLoad)
        .flatMap((p) => p.destinations || [])
        .filter((row) => row?.outletId && (!row?.outlet?.name || !row?.point))
        .map((row) => row.outletId)
    ),
  ];

  const [orders, outlets] = await Promise.all([
    ids.length
      ? db.order.findMany({
          where: { id: { in: ids }, deletedAt: null },
          select: { id: true, customerSnapshot: true },
        })
      : Promise.resolve([]),
    missingOutletIds.length && db?.outlet?.findMany
      ? db.outlet.findMany({
          where: { id: { in: missingOutletIds }, deletedAt: null },
          select: {
            id: true,
            name: true,
            address: true,
            outletCode: true,
            latitude: true,
            longitude: true,
            googleLocation: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const outletById = new Map(outlets.map((o) => [o.id, o]));

  return packings.map((packing) => {
    let hydrated = packing;
    if (isVehicleLoad(packing) && Array.isArray(packing.destinations)) {
      hydrated = {
        ...packing,
        destinations: packing.destinations.map((row) => {
          const found = outletById.get(row?.outletId);
          return {
            ...row,
            outlet: row?.outlet?.name
              ? row.outlet
              : found
                ? {
                    id: found.id,
                    name: found.name,
                    address: found.address,
                    outletCode: found.outletCode,
                  }
                : row?.outlet || null,
            point: row?.point || (found ? mileagePoint(found) : null),
          };
        }),
      };
    }
    return { ...hydrated, ...packingDestination(hydrated, orders) };
  });
}
