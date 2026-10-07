import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { routeDistance, routeDistanceFields } from './route-distance.service.js';
import { finalizeRoute } from './route-lifecycle.service.js';
export const updateRouteStatus = async (id,status,totalDistanceKm) => {
  const route=await prisma.deliveryRoute.findUnique({where:{id},include:{vehicle:true,stops:{include:{outlet:true},orderBy:{sequence:'asc'}}}});
  if(!route)throw new AppError('Rute tidak ditemukan',404);
  const transitions={DRAFT:['READY'],READY:['IN_TRANSIT'],IN_TRANSIT:['COMPLETED','PARTIAL']};
  if(status!==route.status && !transitions[route.status]?.includes(status))throw new AppError('Transisi status rute tidak diizinkan',409);
  if(totalDistanceKm!==undefined && (!Number.isFinite(totalDistanceKm)||totalDistanceKm<0))throw new AppError('Jarak tidak valid',400);
  if(route.odometerPostedAt && totalDistanceKm!==undefined && totalDistanceKm!==route.totalDistanceKm)throw new AppError('Jarak rute final tidak dapat diubah',409);
  const distance = status==='IN_TRANSIT' ? await routeDistance(route,totalDistanceKm) : totalDistanceKm ?? route.totalDistanceKm;
  return prisma.$transaction(async tx=>{
    const changed=await tx.deliveryRoute.updateMany({where:{id,status:route.status},data:{status:['COMPLETED','PARTIAL'].includes(status)?route.status:status,
      ...(distance!=null?routeDistanceFields(route,distance):{})}});
    if(!changed.count)throw new AppError('Rute berubah, muat ulang',409);
    if(['COMPLETED','PARTIAL'].includes(status))return finalizeRoute(tx,id);
    return tx.deliveryRoute.findUnique({where:{id},include:{vehicle:true,driver:{select:{id:true,name:true}}}});
  },{isolationLevel:'Serializable'});
};
