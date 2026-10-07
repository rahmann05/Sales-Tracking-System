import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
/** createOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';


export const createOutlet = async (data) => {
  const result = await prisma.$transaction(async tx=>{await assertClusterTrade(tx,data.clusterId,data.type || data.channel || 'GENERAL_TRADE');return tx.outlet.create({data});});
  invalidateOutletCache();
  return result;
};
