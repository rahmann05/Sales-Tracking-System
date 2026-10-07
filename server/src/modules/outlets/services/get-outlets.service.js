import {outletClusterScope} from '../../../utils/team-scope.js';
/** getOutlets - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { cacheGetOrFetch } from "../../../utils/cacheHelper.js";
import { CACHE_KEYS } from '../../../config/cache.js';


export const getOutlets = async (query = {},user=null) => {
  const { clusterId, search } = query;
  
  if(user&&['SUPERVISOR','SALES'].includes(user.role)){
    const where={deletedAt:null,cluster:await outletClusterScope(user)};
    if(clusterId)where.clusterId=clusterId;
    if(search)where.OR=[{name:{contains:search,mode:'insensitive'}},{address:{contains:search,mode:'insensitive'}}];
    return prisma.outlet.findMany({where,include:{cluster:{select:{id:true,name:true,region:true,deletedAt:true}}},orderBy:{name:'asc'}});
  }
  // If there's a search query or specific clusterId, don't use the global cache
  if (clusterId || search) {
    const where = { deletedAt: null };
    if (clusterId) where.clusterId = clusterId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    return await prisma.outlet.findMany({
      where,
      include: { cluster: { select: { id: true, name: true, region: true, deletedAt: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // Use global cache for fetch all
  return await cacheGetOrFetch(
    CACHE_KEYS.ALL_OUTLETS,
    async () => {
      return await prisma.outlet.findMany({
        where: { deletedAt: null },
        include: { cluster: { select: { id: true, name: true, region: true, deletedAt: true } } },
        orderBy: { name: 'asc' },
      });
    },
    300 // 5 minutes TTL
  );
};
