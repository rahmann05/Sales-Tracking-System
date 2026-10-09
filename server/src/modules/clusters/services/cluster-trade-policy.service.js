import {currentPolicy} from '../../config/services/policy-context.service.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {AppError} from '../../../utils/errors.js';
export function assertSingleTrade(outlets) {
  const types=new Set(outlets.map(outlet=>outlet.type || outlet.channel || 'GENERAL_TRADE'));
  if(types.size>1&&currentPolicy()?.values?.CLUSTER_SINGLE_CHANNEL!==false)throw new AppError('Satu kluster hanya boleh berisi General Trade atau Modern Trade, tidak boleh campuran.',400);
  return [...types][0] || null;
}
export async function assertClusterTrade(db,clusterId,type,excludeOutletId) {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`cluster-trade:${clusterId}`}))`;
  const cluster=await db.cluster.findFirst({where:{id:clusterId,deletedAt:null},select:{name:true}});
  if(!cluster)throw new AppError('Kluster aktif tidak ditemukan',404);
  const members=await db.outlet.findMany({where:{clusterId,deletedAt:null,...(excludeOutletId?{id:{not:excludeOutletId}}:{})},select:{type:true}});
  if(await getDynamicConfig('CLUSTER_SINGLE_CHANNEL',true))assertSingleTrade([...members,{type}]);
}
