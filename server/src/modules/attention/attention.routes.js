import {Router} from 'express';
import {z} from 'zod';
import {authenticate,authorize,authorizeWithPermission} from '../../middlewares/auth.middleware.js';
import {getAttention} from './attention.service.js';
import {listAttentionEscalations} from './attention-escalation.service.js';
import {resolveOperationalException} from './operational-exceptions.service.js';
import {myOperationalExceptions,clarifyOperationalException} from './exception-clarification.service.js';
const router=Router();
router.use(authenticate);
router.get('/my-exceptions',async(req,res,next)=>{try{res.json({data:await myOperationalExceptions(req.user)});}catch(error){next(error);}});
router.patch('/exceptions/:id/clarify',async(req,res,next)=>{try{res.json({data:await clarifyOperationalException(req.params.id,req.body,req.user)});}catch(error){next(error);}});
router.use(authorize('ADMIN','SUPERVISOR','KEPALA_GUDANG'));
router.patch('/exceptions/:id',authorize('ADMIN','SUPERVISOR'),async(req,res,next)=>{try{res.json({data:await resolveOperationalException(req.params.id,req.body,req.user)});}catch(error){next(error);}});
router.use((req,res,next)=>req.user.role==='KEPALA_GUDANG'?authorizeWithPermission(['KEPALA_GUDANG'],'can_monitor_delivery')(req,res,next):next());
router.get('/escalations',authorize('ADMIN'),async(req,res,next)=>{try{
 const query=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(20),unread:z.enum(['true','false']).default('true').transform(value=>value==='true')}).parse(req.query);
 res.json({data:await listAttentionEscalations(req.user,query)});
}catch(error){next(error);}});
router.get('/',async(req,res,next)=>{try{
 const query=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(25),filter:z.enum(['ALL','MINE','OVERDUE','UNASSIGNED','UNSCHEDULED','REVIEW']).default('ALL'),category:z.enum(['ALL','ORDER','PACKING','TRIP','PREPARATION','ISSUE','VISIT','EXCEPTION']).default('ALL')}).parse(req.query);
 res.json({data:await getAttention(req.user,query)});
}catch(e){next(e);}});
export default router;
