import {policyNotification} from '../notifications/services/notification-policy.service.js';
import { Router } from 'express';
import * as orderController from './orders.controller.js';
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createOrderSchema } from './orders.schema.js';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import {cancelOrderRemainder} from './services/cancel-order-remainder.service.js';
import {withUserTransaction} from '../../utils/user-transaction.js';
import {getOrderReviewAssignment,saveOrderReviewAssignment} from './services/order-review-assignment.service.js';

const router = Router();

router.use(authenticate);
router.get('/:id/review-assignment',authorize('ADMIN','SUPERVISOR'),async(req,res,next)=>{
  try{const id=z.string().uuid().parse(req.params.id);res.json({data:await getOrderReviewAssignment(id,req.user)});}catch(error){next(error);}
});
router.put('/:id/review-assignment',authorize('ADMIN'),async(req,res,next)=>{
  try{const id=z.string().uuid().parse(req.params.id);res.json({data:await saveOrderReviewAssignment(id,req.body,req.user)});}catch(error){next(error);}
});
router.get('/requests/:requestId',authorize('SALES'),async(req,res,next)=>{
  try{const requestId=z.string().uuid().parse(req.params.requestId);const order=await withUserTransaction(req.user.id,tx=>tx.order.findUnique({where:{requestId},select:{id:true,createdBy:true}}));res.json({success:true,data:order?.createdBy===req.user.id?{id:order.id}:null});}catch(e){next(e);}
});
router.patch('/:id/cancel-remainder',authorize('ADMIN'),async(req,res,next)=>{
  try{const data=z.object({note:z.string().trim().min(1).max(2000),lines:z.array(z.object({id:z.string().uuid(),quantity:z.number().int().positive()})).min(1)}).parse(req.body);res.json({success:true,data:await cancelOrderRemainder(req.params.id,data,req.user)});}catch(e){next(e);}
});
router.patch('/:id/promise', authorize('ADMIN'), async(req,res,next)=>{
  try {
    const data=z.object({promisedAt:z.string().datetime(),note:z.string().trim().min(1).max(2000)}).parse(req.body);
    const result=await prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order:${req.params.id}`}))`;
      const order=await tx.order.findUnique({where:{id:req.params.id}});
      if(!order||order.deletedAt||order.status==='REJECTED')throw new AppError('Order tidak aktif',409);
      const updated=await tx.order.update({where:{id:order.id},data:{promisedAt:new Date(data.promisedAt),history:[...order.history,{action:'PROMISE',actorId:req.user.id,at:new Date().toISOString(),note:data.note,before:order.promisedAt?.toISOString()||null,after:data.promisedAt}]}});
      await policyNotification(tx,{data:{userId:order.createdBy,type:'ORDER_PROMISE',title:'Janji pengiriman order',message:data.note,payload:{orderId:order.id,promisedAt:data.promisedAt,previousPromisedAt:order.promisedAt?.toISOString()||null,actorId:req.user.id}}});
      return updated;
    });res.json({success:true,data:result});
  }catch(e){next(e);}
});

router.post('/', authorizeWithPermission(['SALES'],'can_create_order'), validate(createOrderSchema), orderController.create);
router.get('/', authorize('ADMIN', 'SUPERVISOR', 'SALES'), orderController.getAll);
router.patch('/batch-approve', authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_approve_order'), orderController.batchApprove);
router.get('/:id', orderController.getById);
router.patch('/:id/approve', authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_approve_order'), orderController.approve);
router.patch('/:id/reject', authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_approve_order'), orderController.reject);

export default router;
