import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
/** createOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';


export const createOutlet = async (data) => {
  const result = await prisma.$transaction(async tx=>{await assertClusterTrade(tx,data.clusterId,data.type || data.channel || 'GENERAL_TRADE');const outletCode=await resolveBusinessCode('OUTLET',data.outletCode,{db:tx});return tx.outlet.create({data:{...data,outletCode}});});
  invalidateOutletCache();
  return result;
};
