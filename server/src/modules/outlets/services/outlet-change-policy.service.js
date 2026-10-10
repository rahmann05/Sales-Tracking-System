import {assertOutletLocationIdle} from './outlet-google-location.service.js';
import { AppError } from '../../../utils/errors.js';
import { actorSnapshot } from './outlet-review-policy.service.js';
export const editableKeys=['name','address','latitude','longitude','clusterId','outletCode','ownerName','phone','radiusMeters','channel','type','subChannel','itineraryCode','taxType','taxNumber','taxName','taxAddress','deletedAt'];
export async function recordOutletChange(db,before,data,{actor,reason,source='MASTER',updatedAt,locationEvidence}={}) {
  if(actor&&(!updatedAt||new Date(updatedAt).getTime()!==before.updatedAt.getTime()))throw new AppError('Data outlet sudah berubah. Muat ulang sebelum menyimpan.',409);
  const keys=editableKeys.filter(k=>data[k]!==undefined&&JSON.stringify(data[k])!==JSON.stringify(before[k]));
  if(!keys.length)return {};
  if(keys.includes('clusterId')&&db.outletFieldTask&&await db.outletFieldTask.count({where:{review:{outletId:before.id},status:{in:['OPEN','SUBMITTED']}}}))throw new AppError('Selesaikan atau batalkan tugas pemeriksaan outlet sebelum memindahkan wilayah, termasuk melalui impor.',409);
  const locationChanged=keys.some(k=>['latitude','longitude'].includes(k));
  const basisChanged=keys.some(k=>['name','address','latitude','longitude','clusterId','phone','deletedAt'].includes(k));
  if(locationChanged||basisChanged&&before.googleLocation&&before.googleLocation.status!=='SUPERSEDED')await assertOutletLocationIdle(db,before.id);
  await db.outletChange.create({data:{outletId:before.id,actor:actorSnapshot(actor),reason:reason || 'Pembaruan sumber data',source,before:Object.fromEntries(keys.map(k=>[k,before[k] ?? null])),after:Object.fromEntries(keys.map(k=>[k,data[k]]))}});
  if(basisChanged) {
    await db.clusterRoute.deleteMany({where:{clusterId:before.clusterId}});
    return {...(before.googleLocation?{googleLocation:{source:'GOOGLE',status:'CONFLICT',placeId:before.googleLocation.placeId,basis:before.googleLocation.basis,lastError:'MASTER_CHANGED',problemSince:new Date().toISOString(),revision:(before.googleLocation.revision||0)+1}}:{}),validationStatus:'UNVALIDATED',validationConfidence:null,googleSuggestedLat:null,googleSuggestedLng:null,validationDetails:{...before.validationDetails,stale:true},...(locationChanged?{locationEvidence:{source:locationEvidence?.source || source,accuracyMeters:locationEvidence?.accuracyMeters ?? null,capturedAt:locationEvidence?.capturedAt || null,actor:actorSnapshot(actor),at:new Date().toISOString()}}:{})};
  }
  return {};
}
