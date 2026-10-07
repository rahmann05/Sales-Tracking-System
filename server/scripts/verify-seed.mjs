import 'dotenv/config';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PrismaClient,Prisma} from '@prisma/client';
import {CONFIG_DEFINITIONS} from '../../shared/config.mjs';
import {packingBalance} from '../../shared/packing.mjs';
import {visitSalesResult} from '../../shared/visit-metrics.mjs';
import {assertDemoDatabase,seedDate,at,seedId} from '../prisma/seeds/context.js';
assertDemoDatabase();
const prisma=new PrismaClient();
const models=Prisma.dmmf.datamodel.models.map(model=>({model:model.name[0].toLowerCase()+model.name.slice(1),key:model.fields.find(field=>field.isId).name}));
const snapshot=async()=>Object.fromEntries(await Promise.all(models.map(async({model,key})=>[model,(await prisma[model].findMany()).sort((a,b)=>String(a[key]).localeCompare(String(b[key])))])));
const run=()=>{const result=spawnSync(process.execPath,['prisma/seed.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',timeout:120000});if(result.status!==0)throw new Error(result.stderr||result.stdout||'Seed gagal');console.log(result.stdout.trim());};
try {
 const before=await snapshot();run();const first=await snapshot();run();const second=await snapshot();
 assert.deepEqual(second,first,'Seed kedua tidak boleh mengubah data, timestamp, sandi, status, jumlah, atau riwayat');
 const legacyEmails=new Set(['sales@sinaranugrah.com','siti@sinaranugrah.com','agus@sinaranugrah.com','dedi@sinaranugrah.com','rina@sinaranugrah.com']);
 for(const {model,key} of models)for(const original of before[model]){
  const actual=first[model].find(row=>row[key]===original[key]);assert.ok(actual,`Seed tidak boleh menghapus ${model}`);
  const expected={...original};
  if(model==='user'&&legacyEmails.has(original.email)&&original.role==='SALES'&&!original.deletedAt&&!original.supervisorId&&actual.supervisorId){expected.supervisorId=actual.supervisorId;expected.updatedAt=actual.updatedAt;}
  if(model==='cluster'&&!original.supervisorId&&actual.supervisorId&&before.user.some(user=>legacyEmails.has(user.email)&&user.clusterId===original.id)){expected.supervisorId=actual.supervisorId;expected.updatedAt=actual.updatedAt;}
  if(model==='cluster'&&Array.from({length:5},(_,i)=>seedId(`cluster-${i}`)).includes(original.id)){expected.outletCount=await prisma.outlet.count({where:{clusterId:original.id,deletedAt:null}});if(expected.outletCount!==original.outletCount)expected.updatedAt=actual.updatedAt;}
  if(model==='user'&&legacyEmails.has(original.email)&&original.clusterId!==actual.clusterId&&before.cluster.some(c=>c.id===original.clusterId&&c.deletedAt)&&actual.clusterId===seedId(`recovery-${original.id}`)){expected.clusterId=actual.clusterId;expected.updatedAt=actual.updatedAt;}
  if(model==='systemConfig'&&original.key==='ROLE_DEFINITIONS'){for(const role of original.value)assert.deepEqual(actual.value.find(row=>row.code===role.code),role,'Template role lama tetap utuh');continue;}
  assert.deepEqual(actual,expected,`Data lama ${model} ${original[key]} harus dipertahankan`);
 }
 for(const p of CONFIG_DEFINITIONS.flatMap(g=>g.params))assert.ok(await prisma.systemConfig.findUnique({where:{key:p.key}}),`Parameter ${p.key}`);
 const users=await prisma.user.findMany({where:{email:{endsWith:'.demo@sinaranugrah.test'}}});
 for(const role of ['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'])assert.ok(users.some(user=>user.role===role),role);
 const members=users.filter(user=>/^sales-[1-5]\.demo@/.test(user.email));assert.equal(members.length,5);assert.ok(members.every(user=>user.supervisorId&&user.clusterId));
 assert.ok(await prisma.outlet.count({where:{outletCode:{startsWith:'DEMO-'}}})>=66);
 for(const member of members)assert.equal(await prisma.pjpTemplate.count({where:{userId:member.id}}),12);
 const today=seedDate();
 const plans=await prisma.pjp.findMany({where:{userId:{in:members.map(user=>user.id)},date:at(today,'00:00')},include:{stops:{include:{attendances:true,orders:{include:{items:true}}},orderBy:{sequence:'asc'}}}});
 assert.equal(plans.length,5);
 for(const plan of plans){assert.equal(plan.stops.length,10);assert.equal(visitSalesResult(plan.stops[0]).orderAmount,70000);assert.equal(visitSalesResult(plan.stops[1]).orderAmount,0);assert.equal(visitSalesResult(plan.stops[2]).orderAmount,0);assert.equal(visitSalesResult(plan.stops[4]).orderAmount,0);assert.equal(visitSalesResult(plan.stops[5]).orderAmount,150000);}
 const packings=await prisma.packingList.findMany({where:{code:{startsWith:'DEMO-PL-',endsWith:today}},include:{invoices:true,deliveryStops:true}});
 assert.equal(packings.length,8);
 const split=packings.find(p=>p.code.includes('-split-'));assert.equal(split.deliveryStops.length,2);assert.equal(packingBalance(split).remainingCartons,0);assert.ok(split.deliveryStops.every(stop=>stop.allocatedItems[0].quantity===12));
 const reference=packings.find(p=>p.code.includes('-reference-'));const order=await prisma.order.findUnique({where:{id:reference.sourceOrderId},include:{pjpStop:true}});assert.equal(reference.outletId,order.pjpStop.outletId);assert.equal(order.status,'APPROVED');
 const returned=packings.find(p=>p.code.includes('-return-received-'));assert.equal(packingBalance(returned).remainingCartons,2);assert.equal(packingBalance(returned).remainingItems[0].remaining,4);
 const pending=packings.find(p=>p.code.includes('-return-pending-'));assert.equal(packingBalance(pending).remainingCartons,0);
 const registrations=await prisma.customerRegistration.findMany({where:{name:{endsWith:'(Demo)'}}});for(const status of ['DRAFT','SUBMITTED','SPV_APPROVED','REGISTERED_ACTIVE','REJECTED'])assert.ok(registrations.some(row=>row.registrationStatus===status));
 const registered=await prisma.customerRegistration.findMany({where:{name:{endsWith:'(Demo)'},clusterId:{not:null}},include:{cluster:{include:{outlets:{where:{deletedAt:null},select:{type:true}}}}}});assert.ok(registered.every(r=>r.cluster.outlets.every(o=>o.type===r.channel)),'Registrasi demo harus sesuai jenis perdagangan kluster');
 console.log('Seed verification passed: full role/configuration/workflow coverage, approved-only reporting, split allocations, return balances, two identical runs and preservation of existing data.');
}finally{await prisma.$disconnect();}
