import { Router } from 'express';
import { login, refresh, logout } from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { loginSchema, refreshTokenSchema } from './auth.schema.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', authenticate, logout);

export default router;
