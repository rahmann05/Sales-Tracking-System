import {listFollowUps,completeFollowUp,reviewFollowUp} from './follow-up.service.js';
import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { prisma } from '../../config/prisma.js';
import { wibDateKey } from '../../../../shared/visit-metrics.mjs';
import { staffActionSchema } from './staff-attendance.schema.js';
import { recordShift } from './shift.service.js';
import { recordSupervisorVisit } from './supervisor-visit.service.js';
const router = Router();
router.use(authenticate);
router.get('/follow-ups',async(req,res,next)=>{try{res.json({data:await listFollowUps(req.user,req.query)});}catch(e){next(e);}});
router.patch('/follow-ups/:id',async(req,res,next)=>{try{res.json({data:await completeFollowUp(req.params.id,req.user,req.body.note,req.body.evidence)});}catch(e){next(e);}});
router.post('/follow-ups/:id/review',authorize('ADMIN','SUPERVISOR'),async(req,res,next)=>{try{res.json({data:await reviewFollowUp(req.params.id,req.user,req.body)});}catch(e){next(e);}});
router.get('/', async (req, res, next) => {
  try { res.json({ data: await prisma.staffActivity.findMany({ where: { userId:req.user.id, OR:[{dateKey:wibDateKey()},{kind:'SHIFT',checkOutAt:null}] }, orderBy: { checkInAt: 'asc' } }) }); }
  catch (error) { next(error); }
});
router.get('/report', authorize('ADMIN', 'SUPERVISOR', 'KEPALA_GUDANG'), async (req, res, next) => {
  try {
    const dateKey = req.query.date || wibDateKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return res.status(400).json({ message: 'Tanggal tidak valid' });
    const where = { dateKey };
    if (req.user.role !== 'ADMIN') where.OR = [{ userId: req.user.id }, { user: { supervisorId: req.user.id } }];
    res.json({ data: await prisma.staffActivity.findMany({ where, include: { user: { select: { name: true, role: true } } }, orderBy: { checkInAt: 'asc' } }) });
  } catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    const { body } = staffActionSchema.parse({ body: req.body });
    const data = body.action.startsWith('SHIFT_') ? await recordShift(req.user.id, body.action) : await recordSupervisorVisit(req.user, body);
    res.status(201).json({ data });
  } catch (error) { next(error); }
});
export default router;
