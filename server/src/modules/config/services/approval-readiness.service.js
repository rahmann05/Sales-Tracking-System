import {BUILT_IN_ROLES} from '../../roles/roles.constants.js';
import {CONFIG_DEFAULTS} from '../../../../../shared/config.mjs';
import {orderReviewerGaps,registrationReviewerGaps} from '../../../../../shared/approval-readiness.mjs';
import {warehouseAssignmentGaps} from '../../../../../shared/warehouse-assignment-readiness.mjs';
import {effectivePolicy} from './policy-resolver.service.js';
import {AppError} from '../../../utils/errors.js';
export const approvalReadinessDomains=values=>({
 order:Object.keys(values).some(k=>k.startsWith('ORDER_APPROVAL_')||['ORDER_PRICE_OVERRIDE_APPROVAL_MODE','SALES_ALLOW_PRICE_OVERRIDE','FEATURE_ORDERS_MODE'].includes(k)),
 registration:Object.keys(values).some(k=>['REGISTRATION_APPROVAL_MODE','REGISTRATION_ACTIVATOR','FEATURE_REGISTRATION_MODE'].includes(k)),
});
export function reviewIdentity(p,definitions=[]){
 const role=(Array.isArray(definitions)?definitions:[]).find(r=>r.code===(p.roleCode||p.role))||BUILT_IN_ROLES.find(r=>r.code===p.role);
 return {...p,role:role?.isSystem?role.code:role?.baseRole||p.role,permissions:{...role?.defaultPermissions,...p.permissions}};
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
 for(const [kind,rows,owner,check] of [['ORDER',orders,'createdBy',orderReviewerGaps],['REGISTRATION',registrations,'salesmanId',registrationReviewerGaps]])for(const record of rows){
  const applicant=people.find(p=>p.id===record[owner]),normalized={...record,policySnapshot:{...record.policySnapshot,values:{...CONFIG_DEFAULTS,...record.policySnapshot?.values}}};
  for(const role of check(normalized,applicant,people))issues.push({key:`${kind}:${record.id}:${role}`,message:`${kind==='ORDER'?'Order':'Pengajuan outlet'} ${record.code||record.name||record.id} memerlukan ${role} aktif dengan izin yang sesuai.`});
 }
 for(const trip of trips.filter(r=>!r.returnedAt&&!r.closedAt)){const driver=people.find(p=>p.id===trip.driverId);if(!driver||driver.deletedAt||driver.role!=='SUPIR'||driver.permissions.can_access_driver_map===false)issues.push({key:`TRIP:${trip.id}:DRIVER`,message:`Trip ${trip.code} memerlukan Driver aktif dengan akses tugas. ${trip.departedAt?'Selesaikan perjalanan terlebih dahulu.':'Alihkan Driver sebelum menonaktifkan akun.'}`});}
 issues.push(...warehouseAssignmentGaps(trips,people));
 return issues;
}
// Must hold approval:actors while changing accounts, teams or role permission templates.
export async function assertReviewersRemain(db,{patches,definitions}={}){
 const before=await reviewPeople(db),after=await reviewPeople(db,{patches,definitions});
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
