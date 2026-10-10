import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {routeAction} from '../src/modules/delivery/services/operations.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag=`departure-${randomUUID()}`,users=[],routes=[];let vehicle;let checks=0;
const items=[{key:'safe',label:'Kendaraan siap berangkat',type:'BOOLEAN',required:true,requireFailureReason:true}];
const values={...CONFIG_DEFAULTS,WAREHOUSE_REQUIRE_PICK:false,WAREHOUSE_REQUIRE_CHECK:false,WAREHOUSE_REQUIRE_LOAD:false,TRIP_REQUIRE_ODOMETER:false,TRIP_DEPARTURE_CHECKLIST:items};
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},reject=async fn=>{await assert.rejects(fn,e=>e.statusCode===422);checks++;};
try{
 for(const role of ['ADMIN','SUPIR']){const u=await prisma.user.create({data:{name:tag,email:`${randomUUID()}@example.invalid`,role,password:'unused'}});users.push(u.id);}
 const actor={id:users[0],name:tag,role:'ADMIN'};
 vehicle=await prisma.vehicle.create({data:{name:tag,code:tag,maxCartons:10,maxWeightKg:100,fuelKmPerLiter:10,fuelType:'SOLAR',fuelPricePerLiter:0}});
 const create=async v=>{const p=await prisma.deliveryRoute.create({data:{code:`${tag}-${routes.length}`,date:new Date(),status:'READY',vehicleId:vehicle.id,driverId:users[1],createdById:users[0],policySnapshot:{values:v,versions:[],at:new Date().toISOString()}}});routes.push(p.id);return p;};
 const start=(p,departureAnswers)=>withPolicy({values,versions:[]},()=>routeAction(p.id,{action:'START',note:'Pemeriksaan keberangkatan uji',...(departureAnswers?{departureAnswers}:{})},actor));
 let p=await create(values);
 await reject(()=>start(p));await reject(()=>start(p,{safe:false}));
 await reject(()=>start(p,{safe:false,_evidence:{safe:{reason:'Ban perlu diperbaiki'}}}));
 eq((await prisma.deliveryRoute.findUnique({where:{id:p.id}})).departedAt,null);
 let started=await start(p,{safe:true});eq(started.status,'IN_TRANSIT');eq(started.preparation.DEPARTURE.answers.safe,true);eq(started.preparation.DEPARTURE.actorId,actor.id);
 await prisma.deliveryRoute.update({where:{id:p.id},data:{closedAt:new Date()}});
 p=await create({...values,TRIP_BLOCK_FAILED_DEPARTURE_CHECKLIST:false});
 started=await start(p,{safe:false,_evidence:{safe:{reason:'Ban cadangan tidak tersedia; telah dicatat'}}});eq(started.preparation.DEPARTURE.failures[0].key,'safe');eq(started.preparation.DEPARTURE.answers._evidence.safe.reason,'Ban cadangan tidak tersedia; telah dicatat');
 await prisma.deliveryRoute.update({where:{id:p.id},data:{closedAt:new Date()}});
 const legacy={...values};delete legacy.TRIP_DEPARTURE_CHECKLIST;delete legacy.TRIP_BLOCK_FAILED_DEPARTURE_CHECKLIST;
 p=await create(legacy);started=await start(p);eq(started.preparation.DEPARTURE.items,[]);eq(started.status,'IN_TRANSIT');
 console.log(`Departure checklist integration passed: ${checks} assertions, block/allow, audit evidence, rollback, and legacy snapshots.`);
}finally{
 await prisma.deliveryRoute.deleteMany({where:{id:{in:routes}}});if(vehicle)await prisma.vehicle.delete({where:{id:vehicle.id}});await prisma.user.deleteMany({where:{id:{in:users}}});await prisma.$disconnect();
}
