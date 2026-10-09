import {AppError} from './errors.js';
import {getDynamicConfig} from '../modules/config/config.service.js';
// Unknown metadata remains unknown on legacy clients. Never infer device accuracy or time.
export async function gpsEvidence(data={},read=getDynamicConfig){
 if(!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude))return null;
 const accuracy=data.accuracy??null,observedAt=data.observedAt?new Date(data.observedAt):null;
 if(await read('GPS_REQUIRE_METADATA',false)&&(accuracy==null||!observedAt))throw new AppError('Akurasi dan waktu pengambilan GPS wajib. Ambil ulang lokasi perangkat.',422);
 if(accuracy!=null&&(!Number.isFinite(accuracy)||accuracy<0||accuracy>await read('GPS_MAX_ACCURACY_METERS',100000)))throw new AppError('Akurasi GPS belum memadai. Ambil ulang lokasi perangkat.',422);
 const age=observedAt?Date.now()-+observedAt:null;
 if(observedAt&&(!Number.isFinite(age)||age < -30000||age>(await read('GPS_MAX_AGE_SECONDS',120))*1000))throw new AppError('GPS terlalu lama atau jam perangkat tidak sesuai. Ambil ulang lokasi.',422);
 return {accuracy,observedAt:observedAt?.toISOString()??null,receivedAt:new Date().toISOString(),source:'DEVICE',metadataKnown:accuracy!=null&&observedAt!=null};
}
