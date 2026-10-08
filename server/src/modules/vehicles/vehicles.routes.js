import { Router } from 'express';
import * as vehicleController from './vehicles.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import {z} from 'zod';
import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';

const router = Router();

router.use(authenticate);
router.patch('/:id/condition', authorize('ADMIN','SUPERVISOR','KEPALA_GUDANG'), async(req,res,next)=>{
  try {
    const data=z.object({condition:z.enum(['AVAILABLE','IN_SERVICE','BROKEN']),note:z.string().trim().min(1).max(2000)}).parse(req.body);
    const vehicle=await prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${req.params.id}`}))`;
      const old=await tx.vehicle.findUnique({where:{id:req.params.id}});if(!old||old.deletedAt)throw new AppError('Kendaraan tidak ditemukan',404);
      if(old.condition===data.condition)return old;
      const updated=await tx.vehicle.update({where:{id:old.id},data:{condition:data.condition}});
      const routes=await tx.deliveryRoute.findMany({where:{vehicleId:old.id,closedAt:null,cancelledAt:null}});
      for(const route of routes){
        await tx.deliveryRoute.update({where:{id:route.id},data:{...(data.condition!=='AVAILABLE'?{onHold:true}:{}),history:[...route.history,{action:'VEHICLE_CONDITION',actorId:req.user.id,actorName:req.user.name,at:new Date().toISOString(),detail:{before:old.condition,condition:data.condition,note:data.note}}]}});
        if(data.condition!=='AVAILABLE')await tx.deliveryIssue.create({data:{routeId:route.id,title:'Kendaraan tidak siap',reason:data.note,ownerId:route.createdById,createdById:req.user.id,dueAt:new Date()}});
      }
      return updated;
    },{isolationLevel:'Serializable'});res.json({success:true,data:vehicle});
  }catch(e){next(e);}
});

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Hanya supervisor atau admin yang bisa manage vehicle
router.post('/', authorize('ADMIN', 'SUPERVISOR'), vehicleController.createVehicle);
router.put('/:id', authorize('ADMIN', 'SUPERVISOR'), vehicleController.updateVehicle);
router.delete('/:id', authorize('ADMIN', 'SUPERVISOR'), vehicleController.deleteVehicle);
router.post('/:id/maintenance', authorize('ADMIN', 'SUPERVISOR', 'KEPALA_GUDANG'), vehicleController.recordMaintenance);

export default router;
