import {getDynamicConfig} from '../../config/config.service.js';
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { calculateNameSimilarity } from './calculate-name-similarity.service.js';
import { reviewScope } from './outlet-review-policy.service.js';
import { AppError } from '../../../utils/errors.js';
const normal=s=>String(s || '').toLowerCase().replace(/[^a-z0-9]/g,'');
export async function duplicateOutlets(db,data,actor,excludeId) {
  const radius=await getDynamicConfig('OUTLET_DUPLICATE_RADIUS_METERS',100),threshold=(await getDynamicConfig('OUTLET_DUPLICATE_NAME_PERCENT',80))/100,delta=radius/111000;
  const where={...await reviewScope(actor,db),...(excludeId?{id:{not:excludeId}}:{})};
  where.OR=[{name:{equals:data.name,mode:'insensitive'}},{address:{equals:data.address,mode:'insensitive'}},...(data.phone?[{phone:data.phone}]:[]),{latitude:{gte:data.latitude-delta,lte:data.latitude+delta},longitude:{gte:data.longitude-delta/Math.max(.01,Math.cos(data.latitude*Math.PI/180)),lte:data.longitude+delta/Math.max(.01,Math.cos(data.latitude*Math.PI/180))}}];
  const rows=await db.outlet.findMany({where,select:{id:true,name:true,address:true,outletCode:true,latitude:true,longitude:true,phone:true},take:100});
  return rows.map(o=>{const distance=calculateDistanceMeters(data.latitude,data.longitude,o.latitude,o.longitude);return {...o,distanceMeters:distance===null?null:Math.round(distance)};}).filter(o=>
    normal(o.name)===normal(data.name)&&normal(o.address)===normal(data.address)||calculateNameSimilarity(data.name,o.name)>=threshold&&o.distanceMeters!==null&&o.distanceMeters<=radius
  ).slice(0,10);
}
export async function assertNoUnreviewedDuplicate(db,data,actor,reason,excludeId) {
  const duplicates=await duplicateOutlets(db,data,actor,excludeId);
  const mode=await getDynamicConfig('OUTLET_DUPLICATE_POLICY','REASON');
  if(duplicates.length&&mode==='BLOCK')throw new AppError('Kemungkinan outlet ganda. Periksa master sebelum membuat data baru.',409);
  if(mode==='REASON'&&duplicates.length&&(!reason||reason.trim().length<10))throw new AppError(`Kemungkinan outlet ganda: ${duplicates.map(o=>o.name).join(', ')}. Periksa kandidat dan isi alasan bila memang outlet berbeda.`,409);
  return duplicates;
}
