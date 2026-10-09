import {at,offsetDate} from '../seeds/context.js';
import {ensure,id,note,fixturePolicy} from './context.js';
import {DEFAULT_AUDIT_ITEMS} from '../../../shared/supervision-checklist.mjs';

export async function seedSales(db,master,date){
 const {sales,groups,clusters,users,supervisors,products,division}=master,plans=[],orders=[];
 for(const [index,member] of sales.entries()){
  const historical=offsetDate(date,index<2?-14:index===2?-28:-7),reportingContext={source:'BELFOODS_UAT_SIMULATION',supervisorId:member.supervisorId,clusterId:clusters[index].id,supervisorName:supervisors[index<2?0:1].name,clusterName:clusters[index].name};
  for(const [key,day] of [['history',historical],['today',date]]){
   const modes=['IN_OUT','IN_OUT','IN_ONLY','IN_OUT','OPTIONAL'],policy=fixturePolicy(day,{SALES_ATTENDANCE_MODE:key==='history'?'IN_OUT':modes[index],SALES_ALLOW_CONTINUE_WITHOUT_OUT:true});
   const plan=await ensure(db,'pjp',`pjp-${member.staffCode}-${day}`,{code:`UJI-BF-PJP-${member.staffCode}-${day}`,userId:member.id,date:at(day,'00:00'),type:'SALES',status:key==='history'?'COMPLETED':'IN_PROGRESS',reportSupervisorId:member.supervisorId,reportClusterId:clusters[index].id,reportingContext,createdAt:at(day,'07:30')});
   const stops=[];
   for(const [j,outlet] of groups[index].entries()){
    if(key==='today'&&index===0&&j===3)continue;
    const finished=key==='history'||j===0&&![0,4].includes(index),active=key==='today'&&j===0&&[0,4].includes(index),missing=key==='today'&&index===1&&j===1;
    const start=at(day,`${String(8+j).padStart(2,'0')}:00`),end=new Date(start.getTime()+15*60000);
    const mode=policy.values.SALES_ATTENDANCE_MODE,state=missing?'INCOMPLETE':finished?'FINISHED':active?'ACTIVE':null;
    const collection=key==='today'&&index===3&&j===0?{purpose:'BOTH',reference:`UJI-BF-ORD-${member.staffCode}-${historical}`,result:'PROMISED',promiseDate:offsetDate(date,3),note:'Uji: pelanggan menjanjikan pembayaran di luar aplikasi.'}:undefined;
    const session=state?{state,attendanceMode:mode,startedAt:start.toISOString(),...(finished||missing?{finishedAt:end.toISOString(),finishSource:'BELFOODS_UAT_SIMULATION',result:{notes:note,...(collection?{visitOutcome:collection}:{})}}:{}),source:'BELFOODS_UAT_SIMULATION'}:undefined;
    const stop=await ensure(db,'pjpStop',`stop-${member.staffCode}-${day}-${j}`,{pjpId:plan.id,outletId:outlet.id,sequence:j+1,status:finished||missing?'VISITED':'PENDING',...(session?{visitSession:session,policySnapshot:policy}:{}),createdAt:at(day,'07:30')});stops.push(stop);
    if((finished||active||missing)&&mode!=='OPTIONAL'){
     await ensure(db,'attendance',`in-${stop.id}`,{pjpStopId:stop.id,userId:member.id,type:'IN',timestamp:start,createdAt:start,notes:note,gpsEvidence:{source:'SEED_SIMULATION',note:'Tidak ada lokasi perangkat atau foto fisik.'}});
     if(finished&&mode==='IN_OUT')await ensure(db,'attendance',`out-${stop.id}`,{pjpStopId:stop.id,userId:member.id,type:'OUT',timestamp:end,createdAt:end,durationMinutes:15,notes:note,gpsEvidence:{source:'SEED_SIMULATION'},...(collection?{visitOutcome:collection}:{})});
    }
    if(collection)await ensure(db,'staffActivity',`collection-${stop.id}`,{userId:member.id,dateKey:date,activityKey:`COLLECTION:PJP_RESULT:${stop.id}`,kind:'COLLECTION_FOLLOW_UP',outletName:outlet.name,checkInAt:end,checkOutAt:end,notes:note,policySnapshot:policy,followUp:{ownerId:member.id,createdBy:member.id,createdAt:end.toISOString(),status:'OPEN',dueDate:collection.promiseDate,note:collection.note,sourceKind:'PJP_RESULT',sourceId:stop.id,reference:collection.reference,history:[{action:'CREATED_FROM_VISIT',actorId:member.id,at:end.toISOString(),source:'BELFOODS_UAT_SIMULATION'}]}});
    if(missing)await ensure(db,'operationalException',`missing-${stop.id}`,{dedupeKey:`MISSING_OUT:${stop.id}`,kind:'MISSING_OUT',entityId:stop.id,userId:member.id,supervisorId:member.supervisorId,details:{outletName:outlet.name,source:'BELFOODS_UAT_SIMULATION',startedAt:start.toISOString(),note}});
   }
   if(key==='today')plans.push({...plan,stops});
   if(key==='history'||[1,2,3].includes(index)){
    const status=key==='history'?'APPROVED':index===3?'REJECTED':'PENDING_APPROVAL',p=products[index%products.length],quantity=8,total=p.price*quantity;
    const order=await ensure(db,'order',`order-${member.staffCode}-${day}`,{code:`UJI-BF-ORD-${member.staffCode}-${day}`,pjpStopId:stops[0].id,createdBy:member.id,status,totalValue:total,paymentType:'TOP',termOfPaymentDays:14,policySnapshot:policy,customerSnapshot:{outletId:groups[index][0].id,name:groups[index][0].name,code:groups[index][0].outletCode,source:'BELFOODS_UAT_SIMULATION'},createdAt:at(day,'08:05'),...(status==='APPROVED'?{approvedBy:member.supervisorId,approvedAt:at(day,'08:10')}:{}) ,...(status==='REJECTED'?{rejectionReason:'Uji: jumlah pesanan perlu dikonfirmasi ulang'}:{}),history:[{action:'SEED_SIMULATION',actorId:member.id,at:at(day,'08:05').toISOString(),note}],items:{create:[{id:id(`item-${member.staffCode}-${day}`),productId:p.id,productName:p.name,productSku:p.sku,unit:'pak',baseUnit:'pak',unitsPerUnit:1,quantity,unitPrice:p.price,subtotal:total}]} });
    orders.push(order);
   }
  }
 }
 for(const [i,spv] of supervisors.entries()){
  const member=sales[i?2:0],outlet=groups[i?2:0][0],start=at(date,'09:00'),finish=at(date,'09:20');
  await ensure(db,'staffActivity',`audit-${i}-${date}`,{userId:spv.id,dateKey:date,activityKey:plans[i?2:0].stops[0].id,kind:'VISIT',visitMode:'AUDIT',outletName:outlet.name,checkInAt:start,checkOutAt:finish,notes:note,policySnapshot:fixturePolicy(date),checklist:Object.fromEntries(DEFAULT_AUDIT_ITEMS.map(item=>[item.key,true])),followUp:{ownerId:member.id,createdBy:spv.id,dueDate:offsetDate(date,1),note:'Uji: konfirmasi daftar produk dan catatan kebutuhan outlet.',status:i?'SUBMITTED':'OPEN',...(i?{submission:{id:id(`submission-${date}`),actorId:member.id,at:finish.toISOString(),note:'Catatan kebutuhan sudah diperbarui (uji)',evidence:'Referensi uji, tanpa lampiran fisik'}}:{}),history:[{action:'ASSIGNED',actorId:spv.id,at:start.toISOString(),source:'BELFOODS_UAT_SIMULATION'}]}});
  const startsOn=offsetDate(date,1),endsOn=offsetDate(date,29),team=sales.filter(s=>s.supervisorId===spv.id);
  const rules=team.flatMap(s=>{const index=sales.findIndex(m=>m.id===s.id);return groups[index].map(o=>{let anchor=startsOn;while(new Date(`${anchor}T12:00:00Z`).getUTCDay()!==o.visitSchedule.days[0])anchor=offsetDate(anchor,1);if(o.visitSchedule.weekType==='WEEK_2')anchor=offsetDate(anchor,7);return {userId:s.id,outletId:o.id,anchorDate:anchor,intervalWeeks:Number(o.itineraryCode.slice(1)),reason:'Tanggal acuan uji baru; sumber lama tidak memuat tanggal acuan.'};});});
  await ensure(db,'pjpPlan',`planner-${i}-${date}`,{requestId:id(`planner-request-${i}-${date}`),name:`Rencana Belfoods ${i?'MT':'GT'} (Uji)`,supervisorId:spv.id,startsOn,endsOn,rules,status:'DRAFT',createdBy:spv.id,updatedBy:spv.id,history:[{action:'DRAFT',actorId:spv.id,at:start.toISOString(),note}]});
 }
 for(const member of Object.values(users))await ensure(db,'staffActivity',`shift-${member.id}-${date}`,{userId:member.id,dateKey:date,activityKey:'SHIFT',kind:'SHIFT',checkInAt:at(date,'07:45'),notes:note,policySnapshot:fixturePolicy(date,{SHIFT_REQUIRE_GPS:false,SHIFT_REQUIRE_PHOTO:false})});
 for(const [i,status] of ['DRAFT','SUBMITTED','SPV_APPROVED','REJECTED'].entries())await ensure(db,'customerRegistration',`registration-${status}`,{registrationCode:`UJI-BF-NOO-${i+1}`,name:`Calon outlet ${i+1} (Uji Belfoods)`,address:'Alamat calon outlet simulasi di Bandung Raya',divisionId:division.id,divisionName:'BELFOODS',salesmanId:sales[0].id,salesmanName:sales[0].name,clusterId:clusters[0].id,latitude:groups[0][0].latitude,longitude:groups[0][0].longitude,locationEvidence:{source:'SEED_SIMULATION',verified:false},area:'Bandung Raya',city:'Bandung',registrationStatus:status,policySnapshot:fixturePolicy(date),...(status==='SPV_APPROVED'?{spvId:supervisors[0].id,spvName:supervisors[0].name,spvApprovedAt:at(date,'10:00')}:{}) ,...(status==='REJECTED'?{rejectionNote:'Uji: alamat lengkap belum dikonfirmasi'}:{})});
 for(const memberIndex of [0,2])await ensure(db,'outletReview',`review-${memberIndex}`,{outletId:groups[memberIndex][3].id,reason:'Uji pemeriksaan opsional data lama: confidence sumber belum membuktikan kesesuaian lokasi.',requestedBy:{id:users.admin.id,name:users.admin.name,role:'ADMIN'},status:'OPEN'});
 await ensure(db,'offPjpAttendance',`off-pjp-${date}`,{userId:sales[0].id,outletId:groups[0][3].id,outletName:groups[0][3].name,address:groups[0][3].address,reason:'Uji kunjungan tambahan di luar jadwal, tanpa bukti GPS rekaan',status:'PENDING',policySnapshot:fixturePolicy(date),reportSupervisorId:sales[0].supervisorId,reportClusterId:clusters[0].id,createdAt:at(date,'10:30')});
 return {plans,orders};
}
