import { Router } from 'express';
import { getRoadRoute } from './routing.controller.js';

const router = Router();

// POST /api/v1/routing/road-route — resolve rute mengikuti jalan (Google → OSRM)
router.post('/road-route', getRoadRoute);

export default router;
