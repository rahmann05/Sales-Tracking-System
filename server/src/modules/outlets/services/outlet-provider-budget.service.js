import {prisma} from '../../../config/prisma.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
export async function reserveOutletProviderCall({now=new Date(),db=prisma,values}={}){
 const read=(key)=>values?values[key]??0:getDynamicConfig(key,0);
 const [daily,perMinute,budget,estimated]=await Promise.all(['OUTLET_REVIEW_DAILY_CALL_LIMIT','OUTLET_REVIEW_CALLS_PER_MINUTE','OUTLET_REVIEW_DAILY_BUDGET_RUPIAH','OUTLET_REVIEW_ESTIMATED_CALL_RUPIAH'].map(read));
 if(!daily&&!perMinute&&!budget)return;
 return db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('maps:outlet-budget'))`;
  const key=`_OUTLET_PROVIDER_USAGE:${wibDateKey(now)}`,minute=Math.floor(+now/60000);
  const previous=(await tx.systemConfig.findUnique({where:{key}}))?.value||{calls:0,estimatedRupiah:0,minute,minuteCalls:0};
  const minuteCalls=previous.minute===minute?previous.minuteCalls:0;
  if(daily>0&&previous.calls>=daily||perMinute>0&&minuteCalls>=perMinute||budget>0&&previous.estimatedRupiah+estimated>budget)throw new Error('MAP_LOCAL_QUOTA_LIMIT');
  const value={calls:previous.calls+1,estimatedRupiah:previous.estimatedRupiah+estimated,minute,minuteCalls:minuteCalls+1,at:now.toISOString(),basis:'Attempted provider calls; estimated cost is an admin assumption, not a provider invoice.'};
  await tx.systemConfig.upsert({where:{key},create:{key,value},update:{value}});
 });
}
