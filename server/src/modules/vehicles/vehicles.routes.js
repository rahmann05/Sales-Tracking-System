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
import {automaticIssue} from '../delivery/services/automatic-issue.service.js';
import {vehicleVolume} from '../../../../shared/vehicle-volume.mjs';

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
router.patch('/:id/capacity',authorize('ADMIN','SUPERVISOR'),async(req,res,next)=>{
 try{
  const data=z.object({maxCartons:z.number().int().nonnegative(),maxWeightKg:z.number().finite().nonnegative(),maxVolumeLiters:z.number().finite().nonnegative().max(1000000).optional(),litersPerCarton:z.number().finite().positive().max(100000).nullable().optional(),independentVolume:z.boolean().optional(),status:z.enum(['UNVERIFIED','ESTIMATED','MEASURED']),notes:z.string().trim().max(2000),reason:z.string().trim().min(5).max(2000),updatedAt:z.string().datetime()}).strict().parse(req.body);
  const volumeInput=['maxVolumeLiters','litersPerCarton','independentVolume'].some(key=>Object.hasOwn(data,key));
  if(volumeInput&&req.user.role!=='ADMIN')throw new AppError('Pengaturan liter dan konversi karton khusus Admin.',403);
  if(data.status==='MEASURED'&&!data.notes.trim())throw new AppError('Jelaskan dasar pengukuran sebelum menandai kapasitas sudah diukur.',422);
  const updated=await prisma.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${req.params.id}`}))`;
   const old=await tx.vehicle.findUnique({where:{id:req.params.id}});
   if(!old||old.deletedAt)throw new AppError('Kendaraan tidak ditemukan',404);
   if(old.updatedAt.toISOString()!==data.updatedAt)throw new AppError('Data kendaraan berubah. Perbarui sebelum menyimpan kapasitas.',409);
   const profile={...(old.capacityProfile||{}),...(volumeInput?{maxVolumeLiters:data.maxVolumeLiters??0,litersPerCarton:data.litersPerCarton??null,independentVolume:data.independentVolume===true}:{})};
   const volume=vehicleVolume(data.maxCartons,profile);
   if(volume.liters>1000000)throw new AppError('Hasil konversi kapasitas melampaui 1.000.000 liter. Periksa karton dan patokannya.',422);
   if(volumeInput&&!volume.independent&&data.maxVolumeLiters>0&&!volume.ratio)throw new AppError('Isi patokan liter per karton, atau centang isi terpisah.',422);
   if(data.status!=='UNVERIFIED'&&data.maxCartons===0&&data.maxWeightKg===0&&!volume.liters)throw new AppError('Isi minimal satu patokan kapasitas, atau pilih Belum diverifikasi.',422);
   const capacityProfile={...profile,maxVolumeLiters:volume.liters??0,status:data.status,notes:data.notes,reviewedBy:req.user.id,reviewedAt:new Date().toISOString()};
   const next=await tx.vehicle.update({where:{id:old.id},data:{maxCartons:data.maxCartons,maxWeightKg:data.maxWeightKg,capacityProfile}});
   await tx.auditEvent.create({data:{actorId:req.user.id,actorName:req.user.name,action:'VEHICLE_CAPACITY_UPDATED',entityType:'VEHICLE',entityId:old.id,before:{maxCartons:old.maxCartons,maxWeightKg:old.maxWeightKg,capacityProfile:old.capacityProfile},after:{maxCartons:next.maxCartons,maxWeightKg:next.maxWeightKg,capacityProfile,reason:data.reason}}});
   return next;
  },{isolationLevel:'Serializable'});
  res.json({data:updated});
 }catch(error){next(error);}
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
        if(data.condition!=='AVAILABLE')await automaticIssue(tx,{routeId:route.id,title:'Kendaraan tidak siap',reason:data.note,createdById:req.user.id,history:[{action:'VEHICLE_CONDITION',actorId:req.user.id,at:new Date().toISOString()}]});
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
