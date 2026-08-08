import { resolveRoadRoute } from './routing.service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const MAX_WAYPOINTS = 25;

const isValidPoint = (p) =>
    p && typeof p.lat === 'number' && typeof p.lng === 'number' &&
    p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180;

export const getRoadRoute = async (req, res, next) => {
    try {
        const { waypoints } = req.body;

        if (!Array.isArray(waypoints) || waypoints.length < 2) {
            return errorResponse(res, 400, 'Minimal 2 waypoints (origin & destination) diperlukan');
        }
        if (waypoints.length > MAX_WAYPOINTS) {
            return errorResponse(res, 400, `Maksimal ${MAX_WAYPOINTS} waypoints per request`);
        }
        if (!waypoints.every(isValidPoint)) {
            return errorResponse(res, 400, 'Format waypoints tidak valid. Gunakan {lat: number, lng: number}');
        }

        const { legs, provider } = await resolveRoadRoute(waypoints);
        const pointCount = legs.reduce((sum, l) => sum + l.path.length, 0);
        return successResponse(res, 200, { legs, provider, pointCount }, 'Rute berhasil di-resolve');
    } catch (err) {
        next(err);
    }
};
