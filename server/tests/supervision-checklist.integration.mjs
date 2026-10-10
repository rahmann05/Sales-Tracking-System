import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {recordSupervisorVisit} from '../src/modules/staff-attendance/supervisor-visit.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='typed-audit-'+randomUUID(),users=[];let cluster,outlet,pjp,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 for(const role of ['SUPERVISOR','SALES'])users.push(await prisma.user.create({data:{name:tag,role,email:randomUUID()+'@example.invalid',password:'unused'}}));
 const [spv,sales]=users;await prisma.user.update({where:{id:sales.id},data:{supervisorId:spv.id}});
 cluster=await prisma.cluster.create({data:{name:tag,region:tag,supervisorId:spv.id,assignedSalesId:sales.id}});
 outlet=await prisma.outlet.create({data:{name:tag,address:tag,latitude:-6.9,longitude:107.6,clusterId:cluster.id}});
 pjp=await prisma.pjp.create({data:{userId:sales.id,type:'SALES',date:new Date(`${wibDateKey()}T05:00:00Z`),stops:{create:{outletId:outlet.id,sequence:1}}},include:{stops:true}});
 const stopId=pjp.stops[0].id;
 const items=[{key:'condition',label:'Kondisi outlet',type:'SELECT',options:['Baik','Perlu perbaikan'],failedValues:['Perlu perbaikan'],required:true,requireFailureReason:true,requireFailurePhoto:true},{key:'measure',label:'Nilai ukur',type:'NUMBER',required:true,min:0,max:10},{key:'notes',label:'Catatan inspeksi',type:'TEXT',required:true}];
 let policy={values:{...CONFIG_DEFAULTS,SPV_ATTENDANCE_MODE:'OPTIONAL',SPV_AUDIT_ITEMS:items,ATTENDANCE_REQUIRE_ACTIVE_SHIFT:false,SPV_ENFORCE_VISIT_LIMIT:false},versions:[],at:new Date().toISOString()};
 const record=data=>withPolicy(policy,()=>recordSupervisorVisit(spv,{stopId,...data}));
 const started=await record({action:'VISIT_IN'});eq(started.policySnapshot.values.SPV_AUDIT_ITEMS,items);
 policy={...policy,values:{...policy.values,SPV_AUDIT_ITEMS:[]}};
 for(const body of [{action:'VISIT_OUT'},{action:'AUDIT',checklist:{condition:'Perlu perbaikan',measure:0,notes:'Temuan lapangan'}},{action:'AUDIT',checklist:{condition:'Baik',measure:11,notes:'Temuan'}}]){await assert.rejects(()=>record(body),e=>e.statusCode===422);checks++;}
 const checklist={condition:'Perlu perbaikan',measure:0,notes:'Tindak lanjut display'};
 const auditEvidence={condition:{reason:'Pajangan belum rapi',photoUrl:'data:image/jpeg;base64,/9j/2Q=='}};
 const saved=await record({action:'AUDIT',checklist,auditEvidence});eq(saved.checklist.measure,0);eq(saved.checklist._evidence,auditEvidence);
 // Editing the answer removes obsolete proof only when explicitly omitted; completion rechecks frozen rules.
 await assert.rejects(()=>record({action:'AUDIT',checklist}),e=>e.statusCode===422);checks++;
 eq((await prisma.staffActivity.findUnique({where:{id:started.id}})).checklist._evidence,auditEvidence);
 const finished=await record({action:'VISIT_OUT'});eq(finished.checkOutAt,null);eq(finished.checklist.state,'FINISHED');eq(finished.checklist._evidence,auditEvidence);
 await assert.rejects(()=>record({action:'AUDIT',checklist,auditEvidence}),e=>e.statusCode===409);checks++;
 console.log(`Typed supervision checklist passed: ${checks} assertions; snapshot, conditional proof, rollback, zero and completion.`);
}finally{
 await prisma.staffActivity.deleteMany({where:{userId:{in:users.map(u=>u.id)}}});
 if(pjp)await prisma.pjp.delete({where:{id:pjp.id}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 await prisma.user.deleteMany({where:{id:{in:users.map(u=>u.id)}}});await prisma.$disconnect();
}
