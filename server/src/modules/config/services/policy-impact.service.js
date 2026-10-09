import {createHash} from 'node:crypto';
import {prisma} from '../../../config/prisma.js';
import {affectedSurfaces} from '../../../../../shared/policy-surfaces.mjs';
export async function policyImpact(values,db=prisma,scope='GLOBAL'){
 const people=await db.user.findMany({where:{deletedAt:null,...(scope==='GLOBAL'?{}:scope.startsWith('ROLE:')?{role:scope.slice(5)}:{OR:[{supervisorId:scope.slice(5)},{id:scope.slice(5)}]})},select:{id:true,role:true,roleCode:true,supervisorId:true,updatedAt:true},orderBy:{id:'asc'}});
 const ids=scope==='GLOBAL'?null:people.map(p=>p.id),owner=key=>ids?{[key]:{in:ids}}:{};
 const queries=[
  ['visits',db.pjpStop,{status:'PENDING',...(ids?{pjp:{userId:{in:ids}}}:{}),OR:[{attendances:{some:{type:'IN'},none:{type:'OUT'}}},{visitSession:{path:['state'],equals:'ACTIVE'}}]}],
  ['orders',db.order,{deletedAt:null,status:'PENDING_APPROVAL',...owner('createdBy')}],
  ['registrations',db.customerRegistration,{registrationStatus:{in:['SUBMITTED','SPV_APPROVED']},...owner('salesmanId')}],
  ['trips',db.deliveryRoute,{closedAt:null,cancelledAt:null,...(ids?{OR:[owner('createdById'),owner('driverId')]}:{})}],
  ['packing',db.packingList,{status:'DRAFT',...owner('createdById')}],
  ['shifts',db.staffActivity,{kind:'SHIFT',checkOutAt:null,...owner('userId')}],
  ['followUps',db.staffActivity,{AND:[{OR:['OPEN','SUBMITTED'].map(status=>({followUp:{path:['status'],equals:status}}))},...(ids?[{OR:[owner('userId'),...ids.map(id=>({followUp:{path:['ownerId'],equals:id}}))]}]:[])]}],
 ];
 const records=await Promise.all(queries.map(async([key,model,where])=>[key,(await model.findMany({where,select:key==='followUps'?{id:true,checkInAt:true,checkOutAt:true,followUp:true}:key==='shifts'?{id:true,checkInAt:true,checklist:true}:{id:true,updatedAt:true},orderBy:{id:'asc'}})).filter(row=>key!=='shifts'||row.checklist?.state!=='FINISHED')]));
 records.unshift(['users',people]);
 const counts=Object.fromEntries(records.map(([key,rows])=>[key,rows.length]));
 const fingerprint=createHash('sha256').update(JSON.stringify({scope,records,values:Object.entries(values).sort(([a],[b])=>a.localeCompare(b))})).digest('hex');
 return {counts,fingerprint,surfaces:affectedSurfaces(values),note:`Pekerjaan terbuka dalam profil ${scope==='GLOBAL'?'perusahaan':scope.startsWith('ROLE:')?'role terpilih':'tim terpilih'}. Alur baru berlaku pada pekerjaan baru. Pekerjaan berjalan mempertahankan aturan awal; akses dan penghentian berbagi GPS mengikuti aturan yang sedang efektif.`};
}

