import { Router } from 'express';
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
import { listTeams, assignTeam } from './teams.service.js';
const router = Router();
router.use(authenticate, authorize('ADMIN','SUPERVISOR'), authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_view_team'));
router.get('/', async (req,res,next) => {try {res.json({data:await listTeams(req.user)});} catch(e) {next(e);}});
router.patch('/:salesId', async (req,res,next) => {try {res.json({data:await assignTeam(req.params.salesId,req.body,req.user)});} catch(e) {next(e);}});
export default router;
