import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
/** updateOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import { validateCodeUpdate } from '../../config/services/business-code.service.js';


export const updateOutlet = async (id, data) => {
  const previous = await prisma.outlet.findUnique({where:{id}});
  if (data.outletCode!==undefined) data={...data,outletCode:await validateCodeUpdate('OUTLET',data.outletCode,id)};
  const changed = ['name','address','latitude','longitude','clusterId'].some(key=>data[key] !== undefined && data[key] !== previous?.[key]);
  if (changed) data = {...data,validationStatus:'UNVALIDATED',validationConfidence:null,validatedAt:null,googleSuggestedLat:null,googleSuggestedLng:null,validationDetails:{coordinateHistory:previous?.validationDetails?.coordinateHistory || []}};
  const result = await prisma.$transaction(async tx=>{
    await assertClusterTrade(tx,data.clusterId || previous.clusterId,data.type || previous.type,id);
    const updated=await tx.outlet.update({where:{id},data});
    if(data.outletCode!==undefined&&data.outletCode!==previous.outletCode&&previous.outletCode) await tx.customerRegistration.updateMany({where:{customerCode:previous.outletCode,registrationStatus:'REGISTERED_ACTIVE'},data:{customerCode:data.outletCode}});
    return updated;
  });
  invalidateOutletCache();
  return result;
};
