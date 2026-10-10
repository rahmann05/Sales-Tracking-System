import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
/** updateOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import { validateCodeUpdate } from '../../config/services/business-code.service.js';
import {AppError} from '../../../utils/errors.js';
import {invalidateClusterCache} from '../../clusters/services/clusters.helpers.js';
import {recordOutletChange} from './outlet-change-policy.service.js';
import {assertOutletLegal,assertOutletTrade} from './outlet-data-policy.service.js';


export const updateOutlet = async (id, raw,actor) => {
  const {updatedAt,reason,locationEvidence,...input}=raw;
  let data={...input,...(input.channel?{type:input.channel}:{})};
  const result = await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    const previous = await tx.outlet.findUnique({where:{id}});
    if(!previous||previous.deletedAt)throw new AppError('Outlet aktif tidak ditemukan',404);
    assertOutletLegal(input,previous);
    assertOutletTrade(input,previous);
    const lat=input.latitude===undefined?previous.latitude:input.latitude,lng=input.longitude===undefined?previous.longitude:input.longitude;
    if((lat==null)!==(lng==null))throw new AppError('Isi kedua koordinat atau kosongkan keduanya.',422);
    if(data.clusterId&&data.clusterId!==previous.clusterId)throw new AppError('Pindahkan outlet melalui Wilayah & outlet pada Master RJP untuk meninjau dampak jadwal.',409);
    if (data.outletCode!==undefined) data={...data,outletCode:await validateCodeUpdate('OUTLET',data.outletCode,id)};
    const audit=await recordOutletChange(tx,previous,data,{actor,reason,updatedAt,locationEvidence,source:locationEvidence?'LOCATION':'MASTER'});
    data={...data,...audit};
    await assertClusterTrade(tx,data.clusterId || previous.clusterId,data.type || previous.type,id);
    const updated=await tx.outlet.update({where:{id},data});
    if(previous.registrationId) {
      const legal=Object.fromEntries(['taxType','taxNumber','taxName','taxAddress','ownerName'].filter(k=>input[k]!==undefined).map(k=>[k,input[k]]));
      if(Object.keys(legal).length)await tx.customerRegistration.update({where:{id:previous.registrationId},data:legal});
    }
    if(data.outletCode!==undefined&&data.outletCode!==previous.outletCode&&previous.outletCode) await tx.customerRegistration.updateMany({where:{customerCode:previous.outletCode,registrationStatus:'REGISTERED_ACTIVE'},data:{customerCode:data.outletCode}});
    return updated;
  });
  invalidateOutletCache();
  invalidateClusterCache(result.clusterId);
  return result;
};
