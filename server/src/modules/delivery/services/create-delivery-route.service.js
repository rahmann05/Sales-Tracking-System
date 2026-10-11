import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {preparationStages} from '../../../../../shared/warehouse-policy.mjs';
import {DRIVER_EVIDENCE_KEYS} from '../../../../../shared/operational-policy.mjs';
import { validateAllocation,packingBalance } from '../../../../../shared/packing.mjs';
import { getDynamicConfig } from '../../config/config.service.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';
/** createDeliveryRoute - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { assertResources } from './resource-policy.service.js';
import {createVehicleMileagePlan} from './vehicle-mileage-plan.service.js';
import {DEFAULT_DELIVERY_DEPOTS,parseDeliveryDepots} from '../../../../../shared/delivery-depots.mjs';
import {packingDestination} from './packing-destination.service.js';
import {existingOperation,operationHash} from '../../../utils/operation-request.js';
import {destinationPacking,isVehicleLoad} from '../../../../../shared/packing-load.mjs';


const routeInclude = {
 vehicle:{select:{id:true,code:true,name:true,maxCartons:true}},
 driver:{select:{id:true,name:true,email:true}},
 stops:{orderBy:{sequence:'asc'},include:{
  outlet:{select:{id:true,name:true,googleLocation:true,phone:true,clusterId:true,address:true,latitude:true,longitude:true}},
  packingList:{include:{invoices:true}},
 }},
 createdBy:{select:{id:true,name:true}},
};
const replayRoute=(db,id)=>db.deliveryRoute.findUnique({where:{id},include:routeInclude});

/**
 * Create delivery route with stops
 */
export const createDeliveryRoute = async (data, userId) => {
  const requestHash=data.requestId?operationHash(data):null;
  const prior=await existingOperation(prisma,'deliveryRoute',data.requestId,requestHash,userId);
  if(prior)return replayRoute(prisma,prior.id);
  const { date, vehicleId, driverId, notes, stops } = data;

  const allowRedelivery = await getDynamicConfig('DELIVERY_ALLOW_REDELIVERY',true)&&await getDynamicConfig('FEATURE_RETURNS_MODE','ACTIVE')==='ACTIVE';
  const allowSplit = await getDynamicConfig('PACKING_ALLOW_SPLIT', true);
  const outletIds=[...new Set(stops.map(stop=>stop.outletId))],packingIds=[...new Set(stops.map(stop=>stop.packingListId))];
  const [routeOutlets,routePackings]=await Promise.all([
    prisma.outlet.findMany({where:{id:{in:outletIds},deletedAt:null}}),
    prisma.packingList.findMany({where:{id:{in:packingIds}},select:{id:true,outletId:true,sourceOrderId:true,sourceOrderIds:true,updatedAt:true,loadPlanVersion:true,destinations:true}}),
  ]);
  const sourceIds=[...new Set(routePackings.flatMap(packing=>[packing.sourceOrderId,...(packing.sourceOrderIds||[])].filter(Boolean)))];
  const sourceOrders=sourceIds.length?await prisma.order.findMany({where:{id:{in:sourceIds},deletedAt:null},select:{id:true,outletId:true,customerSnapshot:true,createdAt:true}}):[];
  const mileageStops=stops.map(stop=>{
    const outlet=routeOutlets.find(row=>row.id===stop.outletId);
    const packing=routePackings.find(row=>row.id===stop.packingListId);
    let destination;
    try{destination=isVehicleLoad(packing)?{destinationPoint:destinationPacking(packing,stop.packingDestinationId).point}:outlet?packingDestination({...packing,outlet},sourceOrders):{};}catch(error){throw new AppError(error.message,422);}
    if(destination.destinationConflict)throw new AppError('Order pada satu dokumen memiliki titik tujuan berbeda. Admin perlu memeriksa titik pengiriman sebelum dijadwalkan.',422);
    return {...stop,point:destination.destinationPoint||null};
  });
  if(mileageStops.some(stop=>!stop.point))throw new AppError('Titik pengiriman satu atau lebih outlet belum tersedia. Lengkapi atau validasi titik toko sebelum membuat trip.',422);
  const depots=parseDeliveryDepots(await getDynamicConfig('DELIVERY_DEPOT_LOCATIONS',DEFAULT_DELIVERY_DEPOTS));
  const departureDepot=depots.find(point=>point.id===(data.departureDepotId||depots[0].id));
  const returnDepot=depots.find(point=>point.id===(data.returnDepotId||data.departureDepotId||depots[0].id));
  if(!departureDepot||!returnDepot)throw new AppError('Titik berangkat atau kembali tidak tersedia dalam pengaturan Admin. Muat ulang lokasi operasional.',422);
  const mileagePlan=await createVehicleMileagePlan(mileageStops,{office:departureDepot,returnOffice:returnDepot,allowPending:true});
  return prisma.$transaction(async tx => {
  const previous=await existingOperation(tx,'deliveryRoute',data.requestId,requestHash,userId,{lock:true});
  if(previous)return replayRoute(tx,previous.id);
  for(const id of [...packingIds].sort())await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`packing:${id}`}))`;
  await assertResources(tx, { ...data, date: new Date(date) });
  // Verify vehicle exists and is active
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.deletedAt || !vehicle.isActive || vehicle.condition !== 'AVAILABLE') throw new AppError('Kendaraan tidak ditemukan atau tidak aktif', 404);
  if (!vehicle.photoUrl) throw new AppError('Foto kendaraan belum dilampirkan. Set foto di menu Armada sebelum kendaraan dipakai pada trip.', 422);

  // Verify driver exists and has SUPIR role
  const driver = await tx.user.findUnique({ where: { id: driverId } });
  if (!driver || driver.deletedAt || driver.role !== 'SUPIR') throw new AppError('Supir tidak ditemukan atau role bukan SUPIR', 404);

  // Verify all packing lists exist
  const plIds = stops.map((s) => s.packingListId);
  const packingLists = await tx.packingList.findMany({
    where: { id: { in: plIds } },
    include: { invoices: true, deliveryStops: true },
  });
  if (packingLists.length !== packingIds.length) {
    throw new AppError('Satu atau lebih packing list tidak ditemukan', 404);
  }
  const changedOutlet=await tx.outlet.findMany({where:{id:{in:outletIds}},select:{id:true,updatedAt:true}});
  if(changedOutlet.length!==routeOutlets.length||changedOutlet.some(row=>+row.updatedAt!==+routeOutlets.find(outlet=>outlet.id===row.id)?.updatedAt))throw new AppError('Lokasi outlet berubah saat rute disiapkan. Muat ulang tujuan.',409);
  if(packingLists.some(row=>{
    const before=routePackings.find(packing=>packing.id===row.id);
    return !before||+before.updatedAt!==+row.updatedAt;
  }))throw new AppError('Packing list berubah saat rute disiapkan. Muat ulang muatan.',409);

  if (new Set(stops.map(stop=>`${stop.packingListId}:${stop.packingDestinationId||''}`)).size !== stops.length) throw new AppError('Tujuan packing list tidak boleh dipilih dua kali', 400);
  const vehicleLoads=packingLists.filter(isVehicleLoad);
  if(vehicleLoads.length&&(packingLists.length!==1))throw new AppError('Satu packing list muatan kendaraan dijadwalkan sebagai satu perjalanan. Jangan gabungkan dengan packing list lain.',409);
  const allocations = [];
  for (const entry of stops) {
    const original = packingLists.find(pl => pl.id === entry.packingListId);
    let packing;try{packing=destinationPacking(original,entry.packingDestinationId);}catch(error){throw new AppError(error.message,422);}
    if (!allowRedelivery && packing.deliveryStops.some(s=>s.returnReceivedAt)) throw new AppError('Pengiriman ulang dinonaktifkan admin',409);
    if (packing.outletId !== entry.outletId) throw new AppError('Toko tujuan tidak sesuai packing list', 400);
    try { allocations.push({ ...entry, ...validateAllocation(packing, entry, isVehicleLoad(original)?false:allowSplit) }); }
    catch (error) { throw new AppError(error.message, 409); }
  }
  for(const packing of vehicleLoads){
    const pending=packing.destinations.filter(destination=>{
      const view=destinationPacking(packing,destination.id);
      return packingBalance(view).remainingCartons>0;
    });
    if(pending.length!==stops.length||pending.some(destination=>!stops.some(stop=>stop.packingDestinationId===destination.id)))throw new AppError('Seluruh tujuan yang belum dijadwalkan pada satu muatan harus dibawa dalam perjalanan yang sama.',409);
  }
  if (new Set(stops.map(s => s.sequence)).size !== stops.length) throw new AppError('Urutan toko harus unik', 400);

  // Calculate totals
  const totalCartons = allocations.reduce((sum, a) => sum + a.allocatedCartons, 0);
  const totalWeight = allocations.reduce((sum, a) => sum + a.allocatedWeight, 0);
  const weightComplete=allocations.every(allocation=>{
    const packing=packingLists.find(row=>row.id===allocation.packingListId);
    return destinationPacking(packing,allocation.packingDestinationId).totalWeight!=null;
  });

  // Check vehicle capacity
  const exceedsCartons=vehicle.maxCartons>0&&totalCartons>vehicle.maxCartons,exceedsWeight=vehicle.maxWeightKg>0&&totalWeight>vehicle.maxWeightKg;
  if ((exceedsCartons||exceedsWeight)&&!data.capacityOverrideReason?.trim()) {
    throw new AppError(
      `Perkiraan muatan melampaui patokan kendaraan (${totalCartons} karton, ${totalWeight} kg diketahui). Isi alasan persetujuan kapasitas atau pilih kendaraan lain.`,
      400
    );
  }

  const changedSuggestion=packingLists.some(packing=>packing.suggestedVehicleId&&packing.suggestedVehicleId!==vehicle.id);
  if(changedSuggestion&&!data.vehicleDecisionReason?.trim())throw new AppError('Jelaskan alasan mengganti saran kendaraan Admin.',422);

  const code = await resolveBusinessCode('DELIVERY_ROUTE',data.code,{db:tx,date:new Date(date)});

  const snapshot=await capturePolicySnapshot(),driverSettings=await effectivePolicy(driver);
  snapshot.warehouseEvidence={values:Object.fromEntries(['CAMERA_INPUT_MODE','EVIDENCE_IMAGE_MAX_KB','EVIDENCE_IMAGE_FORMATS','EVIDENCE_ALLOW_REMOTE_IMAGES'].map(key=>[key,snapshot.values[key]]))};
  for(const key of DRIVER_EVIDENCE_KEYS)snapshot.values[key]=driverSettings.values[key];
  snapshot.driver={id:driverId,versions:driverSettings.versions,at:driverSettings.at};
  const route = await tx.deliveryRoute.create({
    data: {
      code,policySnapshot:snapshot,mileagePlan,...(data.requestId?{requestId:data.requestId,requestHash}:{}),
      date: new Date(date),
      plannedStartAt: data.plannedStartAt ? new Date(data.plannedStartAt) : null,
      plannedEndAt: data.plannedEndAt ? new Date(data.plannedEndAt) : null,
      vehicleId,
      driverId,
      status:preparationStages(snapshot.values).length?'DRAFT':'READY',
      totalCartons,
      totalDistanceKm: mileagePlan.totalKm,
      fuelConsumedLiters: mileagePlan.totalKm != null && vehicle.fuelKmPerLiter>0 ? mileagePlan.totalKm / vehicle.fuelKmPerLiter : null,
      totalWeight: weightComplete?totalWeight:null,
      notes,
      history:[{action:'VEHICLE_LOAD_APPROVAL',userId,at:new Date().toISOString(),packingListIds:packingIds,vehicleId,vehicleCode:vehicle.code,suggestions:packingLists.map(packing=>({packingListId:packing.id,vehicleId:packing.suggestedVehicleId||null})),decision:changedSuggestion?'REPLACED':packingLists.some(packing=>packing.suggestedVehicleId)?'ACCEPTED':'SELECTED',reason:data.vehicleDecisionReason||null,capacity:{totalCartons,knownWeightKg:totalWeight,weightComplete,maxCartons:vehicle.maxCartons,maxWeightKg:vehicle.maxWeightKg,exceedsCartons,exceedsWeight,overrideReason:data.capacityOverrideReason||null}}],
      createdById: userId,
      stops: {
        create: allocations.map((s) => ({
          packingListId: s.packingListId,
          packingDestinationId:s.packingDestinationId||null,
          outletId: s.outletId,
          targetLatitude:mileagePlan.points.find(point=>point.sequence===s.sequence)?.latitude??null,
          targetLongitude:mileagePlan.points.find(point=>point.sequence===s.sequence)?.longitude??null,
          targetPointSource:mileagePlan.points.find(point=>point.sequence===s.sequence)?.googleMapsOnly?'GOOGLE':mileagePlan.points.find(point=>point.sequence===s.sequence)?.source??null,
          sequence: s.sequence,
          allocatedCartons: s.allocatedCartons, allocatedWeight: s.allocatedWeight, allocatedItems: s.allocatedItems,
          allocatedInvoices: s.allocatedInvoices,
        })),
      },
    },
    include: routeInclude,
  });

  return route;
  }, { isolationLevel: 'Serializable' }).catch(async error=>{
    if(error?.code==='P2034'||error?.code==='P2002'&&error.meta?.target?.includes('requestId')){
      const saved=await existingOperation(prisma,'deliveryRoute',data.requestId,requestHash,userId);if(saved)return replayRoute(prisma,saved.id);
      throw new AppError('Driver, kendaraan atau alokasi berubah bersamaan. Muat ulang sebelum membuat trip.',409);
    }
    throw error;
  });
};
