import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
import {AppError} from '../../../utils/errors.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {gpsEvidence} from '../../../utils/gps-evidence.js';
import {withUserTransaction} from '../../../utils/user-transaction.js';
import {calculateDistanceMeters} from '../../../utils/geolocation.js';
import {locationExpired} from '../../../../../shared/location-retention.mjs';
export async function updateSalesLocation(userId,data={}){
 const mode=await getDynamicConfig('SALES_TRACKING_MODE','LOGIN');
 if(mode==='OFF')throw new AppError('Berbagi lokasi Sales dinonaktifkan Admin',403);
 const {latitude,longitude,accuracy=null,speed=null,heading=null,battery=null}=data;
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw new AppError('Koordinat latitude dan longitude tidak valid',400);
 const evidence=await gpsEvidence(data),observedAt=evidence.observedAt?new Date(evidence.observedAt):null;
 const max=await getDynamicConfig('LIVE_TRACKING_MAX_BREADCRUMBS',20),interval=await getDynamicConfig('TRACKING_SEND_INTERVAL_SECONDS',30),distance=await getDynamicConfig('TRACKING_TRAIL_MIN_DISTANCE_METERS',0),retention=await getDynamicConfig('TRACKING_LOCATION_RETENTION_HOURS',0);
 return withUserTransaction(userId,async tx=>{
  const user=await tx.user.findUnique({where:{id:userId},select:{role:true,deletedAt:true}});
  if(!user||user.deletedAt||user.role!=='SALES')throw new AppError('Pelacakan ini hanya untuk Sales aktif',403);
  if(mode==='SHIFT'){const shift=await tx.staffActivity.findFirst({where:{userId,kind:'SHIFT',dateKey:wibDateKey(),checkOutAt:null}});if(!shift||shift.checklist?.state==='FINISHED')throw new AppError('GPS hanya dibagikan pada shift aktif',409);}
  if(mode==='VISIT'&&!await tx.pjpStop.findFirst({where:{pjp:{userId},status:'PENDING',OR:[{attendances:{some:{type:'IN'},none:{type:'OUT'}}},{visitSession:{path:['state'],equals:'ACTIVE'}}]}}))throw new AppError('GPS hanya dibagikan pada kunjungan aktif',409);
  const existing=await tx.salesLivePosition.findUnique({where:{userId}}),now=new Date();
  if(existing&&observedAt&&existing.observedAt&&+observedAt<=+existing.observedAt)return {...existing,accepted:false};
  if(existing&&+now-+existing.receivedAt<interval*1000)return {...existing,accepted:false};
  const previous=locationExpired(existing,retention,+now)?[]:existing?.breadcrumbs||[];
  const point={lat:latitude,lng:longitude,time:observedAt?.toISOString()??null,receivedAt:now.toISOString()};
  const last=previous[0],append=!last||distance<=0||calculateDistanceMeters(latitude,longitude,last.lat,last.lng)>=distance;
  const breadcrumbs=append?[point,...previous].slice(0,max):previous.slice(0,max);
  const record=await tx.salesLivePosition.upsert({where:{userId},create:{userId,latitude,longitude,accuracy,speed,heading,battery,observedAt,receivedAt:now,gpsEvidence:evidence,breadcrumbs},update:{latitude,longitude,accuracy,speed,heading,battery,observedAt,receivedAt:now,gpsEvidence:evidence,breadcrumbs}});
  return {...record,updatedAt:now.toISOString(),accepted:true};
 });
}
