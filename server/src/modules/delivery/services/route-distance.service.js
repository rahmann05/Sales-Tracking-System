import {operationalWaypoint} from '../../../../../shared/outlet-location.mjs';
import { resolveRoadRoute } from '../../routing/routing.service.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { AppError } from '../../../utils/errors.js';
export async function routeDistance(route) {
  const stored = route.totalDistanceKm;
  if (stored != null) return stored;
  try {
    const [lat,lng] = await Promise.all([getDynamicConfig('DEFAULT_OFFICE_LATITUDE',-6.8582),getDynamicConfig('DEFAULT_OFFICE_LONGITUDE',107.5123)]);
    const {legs} = await resolveRoadRoute([{lat,lng},...route.stops.map(s=>operationalWaypoint(s.outlet)),{lat,lng}]);
    const distance = legs.reduce((sum,leg)=>sum+(leg.distanceKm || 0),0);
    if (!Number.isFinite(distance) || distance<=0) throw new Error('Jarak rute kosong');
    return distance;
  } catch { throw new AppError('Jarak rute belum tersedia. Lengkapi titik tujuan atau buat ulang trip agar jarak dihitung otomatis.',422); }
}
export const routeDistanceFields = (route,distance) => ({totalDistanceKm:distance,fuelConsumedLiters:route.vehicle.fuelKmPerLiter>0 ? distance/route.vehicle.fuelKmPerLiter : null});
