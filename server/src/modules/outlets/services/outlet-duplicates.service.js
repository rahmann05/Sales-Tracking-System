import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { calculateNameSimilarity } from './calculate-name-similarity.service.js';
import { reviewScope } from './outlet-review-policy.service.js';
import { AppError } from '../../../utils/errors.js';
const normal=s=>String(s || '').toLowerCase().replace(/[^a-z0-9]/g,'');
export async function duplicateOutlets(db,data,actor,excludeId) {
  const where={...await reviewScope(actor,db),...(excludeId?{id:{not:excludeId}}:{})};
  where.OR=[{name:{equals:data.name,mode:'insensitive'}},{address:{equals:data.address,mode:'insensitive'}},...(data.phone?[{phone:data.phone}]:[]),{latitude:{gte:data.latitude-.002,lte:data.latitude+.002},longitude:{gte:data.longitude-.002,lte:data.longitude+.002}}];
  const rows=await db.outlet.findMany({where,select:{id:true,name:true,address:true,outletCode:true,latitude:true,longitude:true,phone:true},take:100});
  return rows.map(o=>({...o,distanceMeters:Math.round(calculateDistanceMeters(data.latitude,data.longitude,o.latitude,o.longitude))})).filter(o=>
    normal(o.name)===normal(data.name)&&normal(o.address)===normal(data.address)||calculateNameSimilarity(data.name,o.name)>=.8&&o.distanceMeters<=100
  ).slice(0,10);
}
export async function assertNoUnreviewedDuplicate(db,data,actor,reason,excludeId) {
  const duplicates=await duplicateOutlets(db,data,actor,excludeId);
  if(duplicates.length&&(!reason||reason.trim().length<10))throw new AppError(`Kemungkinan outlet ganda: ${duplicates.map(o=>o.name).join(', ')}. Periksa kandidat dan isi alasan bila memang outlet berbeda.`,409);
  return duplicates;
}
