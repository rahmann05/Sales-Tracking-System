import {masterImport} from '../products/master-import.service.js';
import { Router } from 'express';
import {authorizeDomainAction} from '../../middlewares/domain-permission.middleware.js';
import * as vehicleController from './vehicles.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import {z} from 'zod';
import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {setMaintenancePolicy} from './services/maintenance-policy.service.js';
import {vehicleMileage,correctVehicleMileage} from './services/vehicle-mileage.service.js';
import {setVehiclePhoto} from './services/set-vehicle-photo.service.js';
import {vehiclePhotoSchema} from './vehicles.schema.js';

const router = Router();

router.use(authenticate);
router.use((req,res,next)=>{
 if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
 const action=req.path.endsWith('/service-policy')?'VEHICLE_POLICY':req.path.endsWith('/condition')||req.path.endsWith('/photo')?'VEHICLE_CONDITION':req.path.endsWith('/maintenance')?'VEHICLE_MAINTENANCE':'MANAGE_VEHICLE';
 return authorizeDomainAction(action)(req,res,next);
});
router.patch('/:id/service-policy',authorize('ADMIN'),async(req,res,next)=>{
 try{res.json({status:'success',data:await setMaintenancePolicy(req.params.id,req.body,req.user)});}catch(error){next(error);}
});
router.get('/:id/mileage',authorize('ADMIN','KEPALA_GUDANG'),async(req,res,next)=>{try{res.json({data:await vehicleMileage(req.params.id)});}catch(error){next(error);}});
router.patch('/:id/mileage',authorize('ADMIN'),async(req,res,next)=>{
 try{
  const data=z.object({odometerKm:z.number().finite().nonnegative(),reason:z.string().trim().min(5).max(2000),updatedAt:z.string().datetime()}).strict().parse(req.body);
  res.json({data:await correctVehicleMileage(req.params.id,data,req.user)});
 }catch(error){next(error);}
});
router.get('/:id/service-records/:recordId/receipt', authorize('ADMIN','SUPERVISOR','KEPALA_GUDANG'), async(req,res,next)=>{
  try{
    const record=await prisma.vehicleServiceRecord.findFirst({where:{id:req.params.recordId,vehicleId:req.params.id},select:{receiptPhotoUrl:true}});
    if(!record?.receiptPhotoUrl)throw new AppError('Foto struk tidak tersedia untuk catatan ini',404);
    res.json({status:'success',data:{photoUrl:record.receiptPhotoUrl}});
  }catch(error){next(error);}
});
router.patch('/:id/photo', authorize('ADMIN','SUPERVISOR','KEPALA_GUDANG'), async(req,res,next)=>{
  try{const data=vehiclePhotoSchema.parse({body:req.body,params:{id:req.params.id}});res.json({status:'success',data:await setVehiclePhoto(data.params.id,data.body.photoUrl,req.user)});}catch(error){next(error);}
});
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

router.post('/import/preview',authorize('ADMIN'),async(req,res,next)=>{try{res.json({data:await masterImport('vehicles',req.body,req.user)});}catch(error){next(error);}});
router.post('/import/apply',authorize('ADMIN'),async(req,res,next)=>{try{res.json({data:await masterImport('vehicles',req.body,req.user,true)});}catch(error){next(error);}});
router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Hanya supervisor atau admin yang bisa manage vehicle
router.post('/', authorize('ADMIN', 'SUPERVISOR'), vehicleController.createVehicle);
router.put('/:id', authorize('ADMIN', 'SUPERVISOR'), vehicleController.updateVehicle);
router.delete('/:id', authorize('ADMIN', 'SUPERVISOR'), vehicleController.deleteVehicle);
router.post('/:id/maintenance', authorize('ADMIN', 'SUPERVISOR', 'KEPALA_GUDANG', 'SUPIR'), vehicleController.recordMaintenance);

export default router;
