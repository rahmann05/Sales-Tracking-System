import {prisma} from '../../config/prisma.js';
import {assertOutletAccess} from '../../utils/team-scope.js';
import {operationalWaypoint} from '../../../../shared/outlet-location.mjs';
import {AppError} from '../../utils/errors.js';
import { resolveRoadRoute } from './routing.service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const MAX_WAYPOINTS = 25;

const isValidPoint = (p) =>
    p && typeof p.lat === 'number' && typeof p.lng === 'number' &&
    p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180;

export const getRoadRoute = async (req, res, next) => {
    try {
        let { waypoints } = req.body;

        if (!Array.isArray(waypoints) || waypoints.length < 2) {
            return errorResponse(res, 400, 'Minimal 2 waypoints (origin & destination) diperlukan');
        }
        if (waypoints.length > MAX_WAYPOINTS) {
            return errorResponse(res, 400, `Maksimal ${MAX_WAYPOINTS} waypoints per request`);
        }
        if (!waypoints.every(isValidPoint)) {
            return errorResponse(res, 400, 'Format waypoints tidak valid. Gunakan {lat: number, lng: number}');
        }

        waypoints=await Promise.all(waypoints.map(async p=>{
          if(!p.outletId)return {lat:p.lat,lng:p.lng,googleMapsOnly:p.googleMapsOnly===true};
          if(['SUPIR','KEPALA_GUDANG'].includes(req.user.role)){
            if(!await prisma.deliveryStop.count({where:{outletId:p.outletId,deliveryRoute:{cancelledAt:null,...(req.user.role==='SUPIR'?{driverId:req.user.id}:{})}}}))throw new AppError('Tujuan berada di luar penugasan pengiriman.',403);
          }else await assertOutletAccess(req.user,p.outletId);
          const outlet=await prisma.outlet.findFirst({where:{id:p.outletId,deletedAt:null}});
          if(!outlet)throw new AppError('Tujuan sudah tidak tersedia.',409);
          return operationalWaypoint(outlet);
        }));
        const { legs, provider } = await resolveRoadRoute(waypoints);
        const pointCount = legs.reduce((sum, l) => sum + l.path.length, 0);
        return successResponse(res, 200, { legs, provider, pointCount }, 'Rute berhasil di-resolve');
    } catch (err) {
        next(err);
    }
};
