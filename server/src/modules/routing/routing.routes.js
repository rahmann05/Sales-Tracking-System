import {authenticate} from '../../middlewares/auth.middleware.js';
import { Router } from 'express';
import { getRoadRoute } from './routing.controller.js';
import {reverseGeocodeCoordinates} from '../customer-registrations/services/reverse-geocode-coordinates.service.js';

const router = Router();
router.use(authenticate);

// POST /api/v1/routing/road-route — resolve rute mengikuti jalan (Google → OSRM)
router.post('/road-route', getRoadRoute);
// Field visits use the same provider policy without needing outlet-registration permission.
router.post('/reverse-geocode',async(req,res,next)=>{
 try{res.json({data:await reverseGeocodeCoordinates(req.body?.lat,req.body?.lng)});}catch(error){next(error);}
});

export default router;
