import 'dotenv/config';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {assertDemoDatabase,seedDate,at} from '../prisma/seeds/context.js';
assertDemoDatabase();
const server=app.listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api/v1`;
const get=async(path,user,expected=200)=>{
  const token=user?jwt.sign({id:user.id},config.jwtSecret,{expiresIn:'2m'}):null;
  const response=await fetch(base+path,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(8000)});
  const body=await response.json();assert.equal(response.status,expected,`${path}: ${body.message || ''}`);return body.data;
};
try{
  const users=await prisma.user.findMany({where:{deletedAt:null}});
  const admin=users.find(u=>u.email==='admin.demo@sinaranugrah.test');
  const member=users.find(u=>u.email==='sales-1.demo@sinaranugrah.test');
  const supervisors=users.filter(u=>u.role==='SUPERVISOR'&&(u.email.endsWith('.demo@sinaranugrah.test')||u.email==='spv@sinaranugrah.com'));
  await get('/teams',null,401);await get('/teams',member,403);
  const all=await get('/teams',admin);assert.ok(all.sales.length>=6);
  const date=seedDate();
  for(const supervisor of supervisors){
    const team=await get('/teams',supervisor);
    assert.ok(team.sales.some(s=>s.supervisorId===supervisor.id));
    assert.ok(team.sales.every(s=>s.supervisorId===supervisor.id||s.supervisorId===null),'Team data must remain scoped');
    const templates=await get('/pjp/templates',supervisor);
    assert.ok(templates.sales.every(s=>s.pjpTemplates.some(t=>t.stops.length)),'Weekly templates must be populated');
    assert.ok(templates.sales.every(s=>s.supervisorId===supervisor.id));
    const report=await get(`/daily-calls?date=${date}`,supervisor);
    assert.ok(report.rows.length>0,'Daily Call should contain seeded visits');
    assert.ok(report.summary.totalOrderAmount>0);
    const ids=new Set(team.sales.filter(s=>s.supervisorId===supervisor.id).map(s=>s.id));
    assert.ok(report.rows.every(row=>ids.has(row.salesmanId)),'Daily Call must not leak another team');
    console.log(`${supervisor.name}: ${team.sales.length} sales, ${templates.sales.reduce((n,s)=>n+s.pjpTemplates.length,0)} templates, ${report.rows.length} Daily Call rows.`);
  }
  const report=await get(`/daily-calls?date=${date}&userId=${member.id}`,admin);
  assert.equal(report.summary.totalOrderAmount,220000,'Only approved order and approved manual sales count');
  assert.equal(report.summary.totalPlanCalls,10);
  const plans=await prisma.pjp.findMany({where:{userId:member.id,date:at(date,'00:00')},include:{stops:true}});
  assert.equal(report.rows.filter(r=>r.planCall==='Y').length,plans.flatMap(p=>p.stops).length);
  const clusters=await prisma.cluster.findMany({where:{deletedAt:null},include:{outlets:{where:{deletedAt:null},select:{type:true}}}});
  assert.ok(clusters.every(c=>new Set(c.outlets.map(o=>o.type)).size<=1),'A cluster must never mix GT and MT');
  const demo=clusters.filter(c=>c.name.includes('(Demo)'));
  assert.ok(demo.some(c=>c.outlets.some(o=>o.type==='MODERN_TRADE')));
  assert.ok(demo.every(c=>c.outletCount===c.outlets.length),'Demo cluster totals must match actual outlets');
  for(const driver of users.filter(u=>u.role==='SUPIR')){const routes=await get(`/delivery/routes?date=${date}`,driver);assert.ok(routes.items.length>0,`${driver.name} must have a test delivery route`);assert.ok(routes.items.every(r=>r.driverId===driver.id));}
  console.log('Workspace API verification passed: bounded HTTP responses, role restrictions, PostgreSQL report totals, populated templates and homogeneous clusters.');
}finally{
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await prisma.$disconnect();
}
