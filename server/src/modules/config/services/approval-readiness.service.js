import {canTripAction} from '../../../../../shared/trip-permissions.mjs';
import {BUILT_IN_ROLES} from '../../roles/roles.constants.js';
import {CONFIG_DEFAULTS} from '../../../../../shared/config.mjs';
import {orderReviewerGaps,orderReviewAssignmentGaps,registrationReviewerGaps,visitReviewGaps} from '../../../../../shared/approval-readiness.mjs';
import {warehouseAssignmentGaps} from '../../../../../shared/warehouse-assignment-readiness.mjs';
import {followUpAssignmentGaps} from '../../../../../shared/follow-up-policy.mjs';
import {shiftCorrectionGaps} from '../../../../../shared/shift-policy.mjs';
import {fieldTaskGaps} from '../../../../../shared/outlet-validation.mjs';
import {effectivePolicy} from './policy-resolver.service.js';
import {AppError} from '../../../utils/errors.js';
import {assertSchedulePeopleRemain} from './assignment-schedule-protection.js';
import {routeChangeReviewGaps} from '../../../../../shared/route-change-workflow.mjs';
import {attachRouteWorkflows} from '../../route-changes/services/route-workflow.service.js';
import {hasAdminRecovery,canDomainAction} from '../../../../../shared/domain-permissions.mjs';
export const approvalReadinessDomains=values=>({
 order:Object.keys(values).some(k=>k.startsWith('ORDER_APPROVAL_')||['ORDER_PRICE_OVERRIDE_APPROVAL_MODE','SALES_ALLOW_PRICE_OVERRIDE','FEATURE_ORDERS_MODE'].includes(k)),
 registration:Object.keys(values).some(k=>['REGISTRATION_APPROVAL_MODE','REGISTRATION_ACTIVATOR','FEATURE_REGISTRATION_MODE'].includes(k)),
});
export function reviewIdentity(p,definitions=[]){
 const role=(Array.isArray(definitions)?definitions:[]).find(r=>r.code===(p.roleCode||p.role))||BUILT_IN_ROLES.find(r=>r.code===p.role);
 return {...p,role:role?.isSystem?role.code:role?.baseRole||p.role,permissions:{...(role?.isSystem?BUILT_IN_ROLES.find(r=>r.code===role.code)?.defaultPermissions:{}),...role?.defaultPermissions,...p.permissions}};
}
export async function readReviewDefinitions(db){return (await db.systemConfig.findMany({where:{key:'ROLE_DEFINITIONS'}})).find(r=>r.key==='ROLE_DEFINITIONS')?.value||[];}
export async function reviewPeople(db,{patches={},definitions}={}){
 const [users,list]=await Promise.all([db.user.findMany({select:{id:true,name:true,role:true,roleCode:true,permissions:true,supervisorId:true,deletedAt:true}}),definitions||readReviewDefinitions(db)]);
 return users.map(user=>reviewIdentity({...user,...patches[user.id]},list));
}
export async function publicationReadiness(db,{scope='GLOBAL',at=Date.now(),override,baseOverrides,values={}}={}){
 const domains=approvalReadinessDomains(values);if(!domains.order&&!domains.registration)return [];
 const people=await reviewPeople(db),issues=[];
 const actors=people.filter(p=>!p.deletedAt&&(scope==='GLOBAL'||scope===`ROLE:${p.role}`||scope===`TEAM:${p.supervisorId}`||p.role==='SUPERVISOR'&&scope===`TEAM:${p.id}`));
 for(const actor of actors){const policy=(await effectivePolicy(actor,at,{override,baseOverrides})).values;
  if(domains.order&&actor.role==='SALES'&&actor.permissions.can_create_order!==false&&policy.FEATURE_ORDERS_MODE==='ACTIVE'){
   const modes=new Set([policy.ORDER_APPROVAL_MODE]);if(policy.ORDER_APPROVAL_AMOUNT_THRESHOLD>0)modes.add(policy.ORDER_APPROVAL_AMOUNT_MODE);if(policy.SALES_ALLOW_PRICE_OVERRIDE&&policy.ORDER_PRICE_OVERRIDE_APPROVAL_MODE!=='INHERIT')modes.add(policy.ORDER_PRICE_OVERRIDE_APPROVAL_MODE);
   for(const mode of modes){const gaps=orderReviewerGaps({policySnapshot:{values:{ORDER_APPROVAL_MODE:mode}}},actor,people,{allStages:true});if(gaps.length)issues.push(`${actor.name}: alur order ${mode} memerlukan pemeriksa aktif berizin (${gaps.join(', ')}).`);}
  }
  if(domains.registration&&['SALES','SUPERVISOR','ADMIN'].includes(actor.role)&&actor.permissions.can_register_outlet!==false&&policy.FEATURE_REGISTRATION_MODE==='ACTIVE'){
   const gaps=registrationReviewerGaps({policySnapshot:{values:policy}},actor,people);if(gaps.length)issues.push(`${actor.name}: alur pengajuan outlet memerlukan pemeriksa/aktivator aktif berizin (${gaps.join(', ')}).`);
  }
 }
 return issues;
}
async function openWorkGaps(db,people){
 const [orders,registrations,trips]=await Promise.all([db.order.findMany({where:{deletedAt:null,status:'PENDING_APPROVAL'},select:{id:true,code:true,createdBy:true,history:true,policySnapshot:true}}),db.customerRegistration.findMany({where:{registrationStatus:{in:['SUBMITTED','SPV_APPROVED']}},select:{id:true,name:true,salesmanId:true,registrationStatus:true,policySnapshot:true}}),db.deliveryRoute.findMany({where:{cancelledAt:null,OR:[{closedAt:null},{stops:{some:{rejectedCartons:{gt:0},returnReceivedAt:null}}}]},select:{id:true,code:true,driverId:true,departedAt:true,returnedAt:true,closedAt:true,status:true,preparation:true,policySnapshot:true,stops:{select:{id:true,rejectedCartons:true,returnInspection:true}}}})]);
 const issues=[];
 if(!people.some(hasAdminRecovery))issues.push({key:'ADMIN:RECOVERY',message:'Minimal satu Admin aktif harus mempunyai izin pengguna, role dan pengaturan sistem untuk pemulihan akses.'});
 if(db.deliveryIssue){
  for(const issue of await db.deliveryIssue.findMany({where:{status:'OPEN'},select:{id:true,ownerId:true}})){
   const owner=people.find(p=>p.id===issue.ownerId);
   if(!canDomainAction(owner,'RESOLVE_DELIVERY_ISSUE')||owner.permissions?.[owner.role==='SUPIR'?'can_access_driver_map':'can_monitor_delivery']===false)issues.push({key:`ISSUE:${issue.id}:OWNER`,message:'PIC kendala pengiriman terbuka harus tetap aktif dan berizin menyelesaikan tugasnya.'});
  }
 }
 if(db.operationalException){
  const results=await db.operationalException.findMany({where:{kind:'MANUAL_RESULT',status:'OPEN'},select:{id:true,userId:true,entityId:true}});
  const actionable=results.length?new Set((await db.pjpStop.findMany({where:{id:{in:results.map(row=>row.entityId)},orders:{none:{deletedAt:null}},visitSession:{path:['result','manualSalesStatus'],equals:'PENDING'}},select:{id:true}})).map(row=>row.id)):new Set();
  for(const record of results.filter(row=>actionable.has(row.entityId)))for(const gap of visitReviewGaps(record,'MANUAL_SALES',people))issues.push({key:`VISIT:RESULT:${record.id}:${gap}`,message:'Hasil manual kegiatan tanpa check-out wajib memerlukan pemeriksa aktif berizin.'});
  const exceptions=await db.operationalException.findMany({where:{kind:{not:'MANUAL_RESULT'},status:'OPEN'},select:{id:true,userId:true}});
  for(const record of exceptions){const applicant=people.find(p=>p.id===record.userId);if(!people.some(p=>p.id!==record.userId&&canDomainAction(p,'EXCEPTION_REVIEW')&&(p.role==='ADMIN'||applicant?.supervisorId===p.id)))issues.push({key:`EXCEPTION:${record.id}:REVIEWER`,message:'Pengecualian presensi terbuka memerlukan Admin atau Supervisor tim aktif berizin pemeriksaan.'});}
 }
 if(db.offPjpAttendance&&db.attendance){
  const [off,manual]=await Promise.all([
   db.offPjpAttendance.findMany({where:{OR:[{status:'PENDING'},{status:'APPROVED',manualSalesMode:'REQUIRE_APPROVAL',manualSalesStatus:'PENDING'}]},select:{id:true,userId:true,status:true,manualSalesMode:true,manualSalesStatus:true}}),
   db.attendance.findMany({where:{type:'OUT',manualSalesMode:'REQUIRE_APPROVAL',manualSalesStatus:'PENDING',pjpStop:{orders:{none:{deletedAt:null}}}},select:{id:true,userId:true}}),
  ]);
  for(const record of off){
   const actions=[...(record.status==='PENDING'?['OFF_PJP']:[]),...(record.manualSalesMode==='REQUIRE_APPROVAL'&&record.manualSalesStatus==='PENDING'?['MANUAL_SALES']:[])];
   for(const action of actions)for(const gap of visitReviewGaps(record,action,people))issues.push({key:`VISIT:OFF_PJP:${record.id}:${gap}`,message:`Kunjungan luar PJP memerlukan pemeriksa aktif berizin untuk ${action==='OFF_PJP'?'validasi kunjungan':'hasil manual'}.`});
  }
  for(const record of manual)for(const gap of visitReviewGaps(record,'MANUAL_SALES',people))issues.push({key:`VISIT:PJP:${record.id}:${gap}`,message:'Hasil manual PJP memerlukan pemeriksa aktif berizin.'});
 }
 const assignments=orders.length?await db.systemConfig.findMany({where:{key:{in:orders.map(order=>`_ORDER_REVIEW:${order.id}`)}},select:{key:true,value:true}}):[];
 const assigned=new Map(assignments.map(row=>[row.key,row.value]));
 for(const order of orders)for(const gap of orderReviewAssignmentGaps(order,assigned.get(`_ORDER_REVIEW:${order.id}`),people))issues.push({key:`ORDER:${order.id}:${gap}`,message:`Order ${order.code||order.id} masih ditugaskan kepada pemeriksa ini. Alihkan atau lepas penugasan sebelum mengubah akses/tim.`});
 if(db.routeChangeRequest){const requests=await attachRouteWorkflows(db,await db.routeChangeRequest.findMany({where:{status:'PENDING_APPROVAL'}}));for(const request of requests)for(const role of routeChangeReviewGaps(request,people))issues.push({key:`ROUTE_CHANGE:${request.id}:${role}`,message:`Laporan toko tutup memerlukan pemeriksa ${role} aktif sesuai tahap tersimpan.`});}
 for(const [kind,rows,owner,check] of [['ORDER',orders,'createdBy',orderReviewerGaps],['REGISTRATION',registrations,'salesmanId',registrationReviewerGaps]])for(const record of rows){
  const applicant=people.find(p=>p.id===record[owner]),normalized={...record,policySnapshot:{...record.policySnapshot,values:{...CONFIG_DEFAULTS,...record.policySnapshot?.values}}};
  for(const role of check(normalized,applicant,people))issues.push({key:`${kind}:${record.id}:${role}`,message:`${kind==='ORDER'?'Order':'Pengajuan outlet'} ${record.code||record.name||record.id} memerlukan ${role} aktif dengan izin yang sesuai.`});
 }
 for(const trip of trips.filter(r=>!r.returnedAt&&!r.closedAt)){const driver=people.find(p=>p.id===trip.driverId);if(!driver||driver.deletedAt||driver.role!=='SUPIR'||driver.permissions.can_access_driver_map===false||!canTripAction(driver,'RETURN'))issues.push({key:`TRIP:${trip.id}:DRIVER`,message:`Trip ${trip.code} memerlukan Driver aktif dengan akses tugas. ${trip.departedAt?'Selesaikan perjalanan terlebih dahulu.':'Alihkan Driver sebelum menonaktifkan akun.'}`});}
 issues.push(...warehouseAssignmentGaps(trips,people));
 const followUps=await db.staffActivity.findMany({where:{OR:[{followUp:{path:['status'],equals:'OPEN'}},{followUp:{path:['status'],equals:'SUBMITTED'}}]},select:{id:true,outletName:true,followUp:true,policySnapshot:true}});
 issues.push(...followUpAssignmentGaps(followUps,people));
 const shiftCorrections=await db.staffActivity.findMany({where:{kind:'SHIFT',timeCorrection:{path:['pending','mode'],equals:'DUAL'}},select:{id:true,userId:true,timeCorrection:true}});
 issues.push(...shiftCorrectionGaps(shiftCorrections,people));
 if(db.outletFieldTask)issues.push(...fieldTaskGaps(await db.outletFieldTask.findMany({where:{status:{in:['OPEN','SUBMITTED']}},select:{id:true,ownerId:true,reviewerId:true,review:{select:{outlet:{select:{cluster:{select:{supervisorId:true}}}}}}}}),people));
 return issues;
}
// Must hold approval:actors while changing accounts, teams or role permission templates.
export async function assertReviewersRemain(db,{patches,definitions}={}){
 const before=await reviewPeople(db),after=await reviewPeople(db,{patches,definitions});
 await assertSchedulePeopleRemain(db,before,after);
 const old=new Set((await openWorkGaps(db,before)).map(i=>i.key)),added=(await openWorkGaps(db,after)).filter(i=>!old.has(i.key));
 if(added.length)throw new AppError(`Perubahan meninggalkan pekerjaan tanpa petugas berwenang. ${added.slice(0,3).map(i=>i.message).join(' ')} Siapkan pengganti atau selesaikan pekerjaan sebelum melanjutkan.`,409);
}
export async function assertNewWorkReviewers(db,kind,record,applicantId){
 const people=await reviewPeople(db),actor=people.find(p=>p.id===applicantId);
 if(!actor||actor.deletedAt)throw new AppError('Pemohon tidak aktif; muat ulang sesi.',409);
 const permission=kind==='ORDER'?'can_create_order':'can_register_outlet';
 if(actor.permissions[permission]===false)throw new AppError('Hak mengajukan pekerjaan telah dicabut; muat ulang sesi.',403);
 const gaps=kind==='ORDER'?orderReviewerGaps(record,actor,people,{allStages:true}):registrationReviewerGaps(record,actor,people);
 if(gaps.length)throw new AppError(`Pekerjaan belum dapat diajukan: pemeriksa/aktivator aktif berizin (${gaps.join(', ')}) belum tersedia. Minta Admin memperbaiki tim atau hak akses.`,409);
}
