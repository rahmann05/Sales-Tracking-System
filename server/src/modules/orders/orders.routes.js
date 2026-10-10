import { Router } from 'express';
import * as orderController from './orders.controller.js';
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createOrderSchema } from './orders.schema.js';
import { z } from 'zod';
import {authorizeOrderOperation} from './services/order-operation-permissions.js';
import {setOrderPromise} from './services/order-promise.service.js';
import {cancelOrderRemainder} from './services/cancel-order-remainder.service.js';
import {withUserTransaction} from '../../utils/user-transaction.js';
import {getOrderReviewAssignment,saveOrderReviewAssignment} from './services/order-review-assignment.service.js';

const router = Router();

router.use(authenticate);
router.get('/:id/review-assignment',authorize('ADMIN','SUPERVISOR'),async(req,res,next)=>{
  try{const id=z.string().uuid().parse(req.params.id);res.json({data:await getOrderReviewAssignment(id,req.user)});}catch(error){next(error);}
});
router.put('/:id/review-assignment',authorizeOrderOperation('ASSIGN_REVIEW'),async(req,res,next)=>{
  try{const id=z.string().uuid().parse(req.params.id);res.json({data:await saveOrderReviewAssignment(id,req.body,req.user)});}catch(error){next(error);}
});
router.get('/requests/:requestId',authorize('SALES'),async(req,res,next)=>{
  try{const requestId=z.string().uuid().parse(req.params.requestId);const order=await withUserTransaction(req.user.id,tx=>tx.order.findUnique({where:{requestId},select:{id:true,createdBy:true}}));res.json({success:true,data:order?.createdBy===req.user.id?{id:order.id}:null});}catch(e){next(e);}
});
router.patch('/:id/cancel-remainder',authorizeOrderOperation('CANCEL_REMAINDER'),async(req,res,next)=>{
  try{const data=z.object({note:z.string().trim().min(1).max(2000),lines:z.array(z.object({id:z.string().uuid(),quantity:z.number().int().positive()})).min(1)}).parse(req.body);res.json({success:true,data:await cancelOrderRemainder(req.params.id,data,req.user)});}catch(e){next(e);}
});
router.patch('/:id/promise', authorizeOrderOperation('PROMISE'), async(req,res,next)=>{
  try {
    const data=z.object({promisedAt:z.string().datetime(),note:z.string().trim().min(1).max(2000)}).parse(req.body);
    res.json({success:true,data:await setOrderPromise(req.params.id,data,req.user)});
  }catch(e){next(e);}
});

router.post('/', authorizeWithPermission(['SALES'],'can_create_order'), validate(createOrderSchema), orderController.create);
router.get('/', authorize('ADMIN', 'SUPERVISOR', 'SALES'), orderController.getAll);
router.patch('/batch-approve', authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_approve_order'), orderController.batchApprove);
router.get('/:id', orderController.getById);
router.patch('/:id/approve', authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_approve_order'), orderController.approve);
router.patch('/:id/reject', authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_approve_order'), orderController.reject);

export default router;
