import {prisma} from '../../config/prisma.js';
import {reviewPeople} from '../config/services/approval-readiness.service.js';
import {reviewScope} from '../outlets/services/outlet-review-policy.service.js';
import {outletLocationAlert} from '../../../../shared/outlet-monitoring.mjs';
import {wibDayRange,visitState} from '../../../../shared/visit-metrics.mjs';

// Derived queue: observing a problem never creates a review, a Sales task or attendance.
export async function outletLocationAttentionRows(user,policy={},now=Date.now()){
 if(!['ADMIN','SUPERVISOR'].includes(user.role)||user.permissions?.can_validate_outlet===false||policy.OUTLET_LOCATION_ALERTS_ENABLED===false)return [];
 const scope=await reviewScope(user,prisma);
 const outlets=await prisma.outlet.findMany({where:{...scope,OR:[{latitude:null},{longitude:null},{latitude:{lt:-90}},{latitude:{gt:90}},{longitude:{lt:-180}},{longitude:{gt:180}},{googleLocation:{path:['status'],not:'SUPERSEDED'}}]},select:{id:true,name:true,address:true,phone:true,latitude:true,longitude:true,clusterId:true,googleLocation:true,createdAt:true,updatedAt:true,cluster:{select:{supervisorId:true}}}});
 const flagged=outlets.map(outlet=>({outlet,alert:outletLocationAlert(outlet,now)})).filter(v=>v.alert);
 if(!flagged.length)return [];
 const ids=flagged.map(v=>v.outlet.id);
 const [people,visits,deliveries]=await Promise.all([
  reviewPeople(prisma),
  prisma.pjpStop.findMany({where:{outletId:{in:ids},pjp:{date:wibDayRange(new Date(now))}},select:{outletId:true,status:true,visitSession:true,validationOnly:true,validationResult:true,attendances:{select:{type:true}},pjpId:true}}),
  prisma.deliveryStop.findMany({where:{outletId:{in:ids},completedAt:null,deliveryRoute:{closedAt:null,cancelledAt:null,returnedAt:null}},select:{outletId:true,deliveryRouteId:true}}),
 ]);
 return flagged.map(({outlet,alert})=>{
  const owner=people.find(p=>p.id===outlet.cluster.supervisorId&&!p.deletedAt&&p.role==='SUPERVISOR'&&p.permissions.can_validate_outlet===true&&['can_run_outlet_review','can_apply_outlet_review','can_assign_outlet_review'].some(key=>p.permissions[key]===true));
  const today=visits.filter(v=>v.outletId===outlet.id&&!['COMPLETED','EXCEPTION'].includes(visitState(v))&&(!v.validationOnly||!['WAITING_REVIEW','ACCEPTED','RESOLVED','CANCELLED','REASSIGNED'].includes(v.validationResult?.state)));
  const impact={todayPjp:new Set(today.map(v=>v.pjpId)).size,todayVisits:today.length,openTrips:new Set(deliveries.filter(d=>d.outletId===outlet.id).map(d=>d.deliveryRouteId)).size};
  return {key:`outlet-location:${outlet.id}`,category:'OUTLET_LOCATION',stage:'OUTLET_LOCATION',status:alert.code,needsReview:true,title:`${outlet.name} · ${alert.label}`,since:alert.since,ownerId:owner?.id||null,ownerName:owner?.name||null,ownerSource:owner?'TEAM_SUPERVISOR':null,responsibleRole:'ADMIN / SPV',nextAction:alert.technical?'Periksa layanan/kuota Google dan ulangi pembaruan. Titik masih berlaku sampai masa cache berakhir; kegagalan layanan bukan alasan otomatis menugaskan Sales.':'Periksa lokasi melalui Google atau bukti internal. Tugaskan Sales hanya jika bukti digital belum memadai.',target:'OUTLET_LOCATION',reference:{outletId:outlet.id},locationAlert:{...alert,impact}};
 });
}
