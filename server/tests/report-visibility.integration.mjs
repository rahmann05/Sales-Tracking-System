import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {invalidatePolicyCache} from '../src/modules/config/services/policy-resolver.service.js';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='report-visibility-'+randomUUID(),users=[];let c,o,pjp,profile,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
const api=async(user,path)=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/${path}`,{headers:{Authorization:`Bearer ${jwt.sign({id:user.id},config.jwtSecret)}`}});const b=await r.json();eq(r.status,200);return b.data;};
try{
 const person=async(role,extra={})=>{const u=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'unused',role,...extra}});users.push(u.id);return u;};
 const spv=await person('SUPERVISOR'),sales=await person('SALES',{supervisorId:spv.id,permissions:{can_view_reports:true}});
 c=await prisma.cluster.create({data:{name:tag,region:'Bandung',supervisorId:spv.id,assignedSalesId:sales.id}});
 o=await prisma.outlet.create({data:{name:tag,address:'Alamat rahasia fixture',latitude:-6.934567,longitude:107.634567,clusterId:c.id}});
 pjp=await prisma.pjp.create({data:{userId:sales.id,type:'SALES',date:new Date(`${wibDateKey()}T05:00:00Z`),stops:{create:{outletId:o.id,sequence:1}}}});
 profile='_POLICY_PROFILE:TEAM:'+spv.id;
 await prisma.systemConfig.create({data:{key:profile,value:{versions:[{revision:1,effectiveAt:new Date(Date.now()-60000).toISOString(),values:{REPORT_SHOW_COMMERCIAL:false,REPORT_SHOW_CONTACT:false,REPORT_SHOW_LOCATION:false,REPORT_SHOW_EVIDENCE:false}}]}}});invalidatePolicyCache();
 for(const actor of [spv,sales]){
  const daily=await api(actor,`daily-calls?date=${wibDateKey()}`);
  eq(daily.summary.totalOrderAmount,null);eq(daily.rows[0].customerLat,null);eq(daily.rows[0].customerAddress,null);eq(daily.rows[0].photoIn,null);assert.ok(daily.basis.restrictionNote);checks++;
  const week=await api(actor,'reports/weekly');eq(week.summary.totalOrderAmount,null);
  const mtd=await api(actor,'reports/mtd');eq(mtd.summary.mtdActualAmount,null);eq(mtd.salesmen[0].target.status,'RESTRICTED');
 }
 await prisma.systemConfig.delete({where:{key:profile}});profile=null;invalidatePolicyCache();
 const visible=await api(spv,`daily-calls?date=${wibDateKey()}`);eq(visible.rows[0].customerLat,-6.934567);eq(visible.summary.totalOrderAmount,0);
 console.log(`Report visibility passed: ${checks} assertions; server response restrictions for Sales and SPV, restored data and zero distinction.`);
}finally{
 if(profile)await prisma.systemConfig.deleteMany({where:{key:profile}});invalidatePolicyCache();
 if(pjp)await prisma.pjp.delete({where:{id:pjp.id}});if(o)await prisma.outlet.delete({where:{id:o.id}});if(c)await prisma.cluster.delete({where:{id:c.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});await new Promise(resolve=>server.close(resolve));await prisma.$disconnect();
}
