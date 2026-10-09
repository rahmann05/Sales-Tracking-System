import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
/** updateOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import { validateCodeUpdate } from '../../config/services/business-code.service.js';
import {AppError} from '../../../utils/errors.js';
import {invalidateClusterCache} from '../../clusters/services/clusters.helpers.js';


export const updateOutlet = async (id, data) => {
  const result = await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    const previous = await tx.outlet.findUnique({where:{id}});
    if(!previous||previous.deletedAt)throw new AppError('Outlet aktif tidak ditemukan',404);
    if(data.clusterId&&data.clusterId!==previous.clusterId)throw new AppError('Pindahkan outlet melalui Wilayah & outlet pada Master RJP untuk meninjau dampak jadwal.',409);
    if (data.outletCode!==undefined) data={...data,outletCode:await validateCodeUpdate('OUTLET',data.outletCode,id)};
    const changed = ['name','address','latitude','longitude'].some(key=>data[key] !== undefined && data[key] !== previous[key]);
    if (changed) data = {...data,validationStatus:'UNVALIDATED',validationConfidence:null,validatedAt:null,googleSuggestedLat:null,googleSuggestedLng:null,validationDetails:{coordinateHistory:previous.validationDetails?.coordinateHistory || []}};
    await assertClusterTrade(tx,data.clusterId || previous.clusterId,data.type || previous.type,id);
    const updated=await tx.outlet.update({where:{id},data});
    if(changed)await tx.clusterRoute.deleteMany({where:{clusterId:previous.clusterId}});
    if(data.outletCode!==undefined&&data.outletCode!==previous.outletCode&&previous.outletCode) await tx.customerRegistration.updateMany({where:{customerCode:previous.outletCode,registrationStatus:'REGISTERED_ACTIVE'},data:{customerCode:data.outletCode}});
    return updated;
  });
  invalidateOutletCache();
  invalidateClusterCache(result.clusterId);
  return result;
};
