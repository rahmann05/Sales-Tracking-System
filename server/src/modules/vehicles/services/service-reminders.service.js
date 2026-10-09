import {createHash} from 'node:crypto';
import {prisma} from '../../../config/prisma.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {vehicleServiceStatus} from '../../../../../shared/vehicle-service-policy.mjs';
import {policyNotification} from '../../notifications/services/notification-policy.service.js';
export async function remindVehicleServices({now=new Date(),db=prisma,policyFor=effectivePolicy}={}){
 const users=await db.user.findMany({where:{role:{in:['ADMIN','KEPALA_GUDANG']},deletedAt:null},select:{id:true,name:true,role:true,supervisorId:true}});
 const vehicles=await db.vehicle.findMany({where:{deletedAt:null},orderBy:{id:'asc'}});
 let notified=0;
 for(const user of users){
  const {values}=await policyFor(user);
  if(values.VEHICLE_SERVICE_SCHEDULED_REMINDERS!==true||values.FEATURE_VEHICLES_MODE!=='ACTIVE')continue;
  const interval=values.VEHICLE_SERVICE_REPEAT_HOURS??24;
  for(const vehicle of vehicles)for(const service of vehicleServiceStatus(vehicle,values).filter(s=>['DUE_SOON','OVERDUE'].includes(s.state))){
   const identity=createHash('sha256').update(JSON.stringify([user.id,vehicle.id,service.key,service.state,service.threshold,vehicle[service.field]])).digest('hex');
   const sent=await db.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`service-reminder:${identity}`}))`;
    const previous=await tx.auditEvent.findFirst({where:{entityType:'VEHICLE_SERVICE_REMINDER',entityId:identity},orderBy:{createdAt:'desc'}});
    if(previous&&(interval===0||+now-Date.parse(previous.after.observedAt)<interval*3600000))return false;
    const notice=await policyNotification(tx,{data:{userId:user.id,type:'VEHICLE_SERVICE_DUE',title:`${vehicle.code} · ${service.label}`,message:`${service.state==='OVERDUE'?'Interval servis terlampaui':'Mendekati interval servis'}. Terpakai ${service.used} km dari ${service.threshold} km. Periksa jadwal dan kondisi kendaraan.`,payload:{vehicleId:vehicle.id,serviceType:service.key,state:service.state,observedAt:now.toISOString()}}});
    if(!notice)return false;
    await tx.auditEvent.create({data:{entityType:'VEHICLE_SERVICE_REMINDER',entityId:identity,action:'NOTIFIED',actorName:'Scheduler servis',before:{},after:{vehicleId:vehicle.id,userId:user.id,service:service.key,state:service.state,observedAt:now.toISOString(),notificationId:notice.id}}});return true;
   });if(sent)notified++;
  }
 }
 return {notified};
}
