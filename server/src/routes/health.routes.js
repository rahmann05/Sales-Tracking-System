import { Router } from 'express';
import { successResponse } from '../utils/response.js';

const router = Router();

router.get('/', (req, res) => {
  return successResponse(res, 200, { uptime: process.uptime(), timestamp: new Date() }, 'Server is healthy');
});

export default router;
