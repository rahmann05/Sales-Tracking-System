import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
/** updateOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';


export const updateOutlet = async (id, data) => {
  const previous = await prisma.outlet.findUnique({where:{id}});
  const changed = ['name','address','latitude','longitude','clusterId'].some(key=>data[key] !== undefined && data[key] !== previous?.[key]);
  if (changed) data = {...data,validationStatus:'UNVALIDATED',validationConfidence:null,validatedAt:null,googleSuggestedLat:null,googleSuggestedLng:null,validationDetails:{coordinateHistory:previous?.validationDetails?.coordinateHistory || []}};
  const result = await prisma.$transaction(async tx=>{await assertClusterTrade(tx,data.clusterId || previous.clusterId,data.type || previous.type,id);return tx.outlet.update({where:{id},data});});
  invalidateOutletCache();
  return result;
};
