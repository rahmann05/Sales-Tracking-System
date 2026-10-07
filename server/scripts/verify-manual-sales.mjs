// Explicit local DB integration check; fixtures are removed in finally.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import { resolveSalesResult } from '../src/modules/absensi/services/resolve-sales-result.service.js';
import { listManualSales, reviewManualSales } from '../src/modules/absensi/services/manual-sales-review.service.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { visitSalesResult, offPjpSalesResult } from '../../shared/visit-metrics.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const original=prisma.systemConfig.findMany;
let policy={MANUAL_SALES_REPORT_MODE:'REQUIRE_APPROVAL'};
prisma.systemConfig.findMany=async()=>Object.entries(policy).map(([key,value])=>({key,value}));
const offIds=[];let pjpId;let checks=0;
const check=(a,b)=>{assert.deepEqual(a,b);checks++;};
const rejects=async fn=>{await assert.rejects(fn);checks++;};
try {
 const admin=await prisma.user.findFirst({where:{role:'ADMIN',deletedAt:null}});
 const sales=await prisma.user.findFirst({where:{role:'SALES',deletedAt:null},include:{cluster:true}});
 const outlet=await prisma.outlet.findFirst({where:{deletedAt:null}});
 assert.ok(admin && sales && outlet);
 const result=await resolveSalesResult({orderAmount:100,skuSold:2});check(result.manualSalesStatus,'PENDING');
 const pjp=await prisma.pjp.create({data:{type:'SALES',userId:sales.id,date:new Date('2050-01-01T00:00:00+07:00'),stops:{create:{outletId:outlet.id,sequence:1}}},include:{stops:true}});pjpId=pjp.id;
 const out=await prisma.attendance.create({data:{...result,type:'OUT',pjpStopId:pjp.stops[0].id,userId:sales.id,latitude:-6,longitude:107}});
 const reviewer={id:admin.id,role:'ADMIN'};
 check((await listManualSales(reviewer)).data.some(r=>r.id===out.id),true);
 await rejects(()=>reviewManualSales({id:sales.id,role:'SALES'},'PJP',out.id,'APPROVED'));
 await rejects(()=>reviewManualSales({id:'unrelated-spv',role:'SUPERVISOR'},'PJP',out.id,'APPROVED'));
 const decisions=await Promise.allSettled([reviewManualSales(reviewer,'PJP',out.id,'APPROVED'),reviewManualSales(reviewer,'PJP',out.id,'APPROVED')]);check(decisions.filter(r=>r.status==='fulfilled').length,1);
 const saved=await prisma.attendance.findUnique({where:{id:out.id}});check(saved.manualSalesReviewedBy,admin.id);check(visitSalesResult({attendances:[saved],orders:[]}).orderAmount,100);
 policy={MANUAL_SALES_REPORT_MODE:'NOTES_ONLY'};invalidateConfigCache();
 const notes=await resolveSalesResult({orderAmount:500});check(notes.manualSalesStatus,'NOTES_ONLY');check(visitSalesResult({attendances:[saved],orders:[]},{manualSalesMode:'NOTES_ONLY'}).orderAmount,100);
 const off=await prisma.offPjpAttendance.create({data:{...result,userId:sales.id,outletName:'Temporary manual fixture',address:'Temporary address',reason:'Integration test',latitude:-6,longitude:107}});offIds.push(off.id);
 await rejects(()=>reviewManualSales(reviewer,'OFF_PJP',off.id,'APPROVED'));
 await prisma.offPjpAttendance.update({where:{id:off.id},data:{status:'APPROVED'}});
 const validated=await prisma.offPjpAttendance.findUnique({where:{id:off.id}});check(offPjpSalesResult(validated).orderAmount,0);
 await rejects(()=>reviewManualSales(reviewer,'OFF_PJP',off.id,'REJECTED',''));
 await reviewManualSales(reviewer,'OFF_PJP',off.id,'APPROVED','Validated amount');
 check(offPjpSalesResult(await prisma.offPjpAttendance.findUnique({where:{id:off.id}})).orderAmount,100);
 const notesOff=await prisma.offPjpAttendance.create({data:{...notes,userId:sales.id,outletName:'Temporary notes fixture',address:'Temporary address',reason:'Integration test',latitude:-6,longitude:107,status:'APPROVED'}});offIds.push(notesOff.id);
 await rejects(()=>reviewManualSales(reviewer,'OFF_PJP',notesOff.id,'APPROVED'));
 console.log(`Manual sales integration passed: ${checks} checks, including role/team scope and concurrent approval.`);
} finally {
 if(pjpId)await prisma.pjp.delete({where:{id:pjpId}});
 await prisma.offPjpAttendance.deleteMany({where:{id:{in:offIds}}});
 prisma.systemConfig.findMany=original;invalidateConfigCache();await prisma.$disconnect();
}
