import {prisma} from '../../../config/prisma.js';
import {packingOrderIds} from '../../../../../shared/packing-orders.mjs';
import {mileagePoint} from './vehicle-mileage-plan.service.js';
import {isVehicleLoad,loadLogistics} from '../../../../../shared/packing-load.mjs';
export function packingDestination(packing,orders){
 if(isVehicleLoad(packing))return {destinationConflict:false,destinationPoint:packing.destinations?.length===1?packing.destinations[0].point:null,destinationsReady:!!packing.destinations?.length&&packing.destinations.every(row=>!!row.point),logistics:loadLogistics(packing)};
 const points=orders.filter(order=>packingOrderIds(packing).includes(order.id)).map(order=>mileagePoint(packing.outlet,order.customerSnapshot?.deliveryPoint)).filter(Boolean);
 const keys=new Set(points.map(point=>`${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`));
 return {destinationConflict:keys.size>1,destinationPoint:keys.size>1?null:points[0]||mileagePoint(packing.outlet)};
}
export async function withPackingDestinations(packings,db=prisma){
 const ids=[...new Set(packings.flatMap(packingOrderIds))];
 const orders=ids.length?await db.order.findMany({where:{id:{in:ids},deletedAt:null},select:{id:true,customerSnapshot:true}}):[];
 return packings.map(packing=>({...packing,...packingDestination(packing,orders)}));
}
