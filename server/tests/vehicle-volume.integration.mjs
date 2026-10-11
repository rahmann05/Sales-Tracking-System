import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {vehicleVolume} from '../../shared/vehicle-volume.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='volume-'+randomUUID(),people=[];let vehicle,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
try{
 for(const role of ['ADMIN','SUPERVISOR'])people.push(await prisma.user.create({data:{name:tag,role,email:randomUUID()+'@example.invalid',password:'unused'}}));
 vehicle=await prisma.vehicle.create({data:{name:tag,code:tag,maxCartons:0,maxWeightKg:0,fuelKmPerLiter:10,fuelType:'SOLAR',fuelPricePerLiter:10000}});
 const send=async(data,user=people[0])=>{
  const token=jwt.sign({id:user.id,tokenVersion:0},config.jwtSecret,{expiresIn:'5m'});
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/vehicles/${vehicle.id}/capacity`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({maxCartons:40,maxWeightKg:0,status:'ESTIMATED',notes:'Patokan karton campuran',reason:'Uji volume lokal',updatedAt:vehicle.updatedAt.toISOString(),...data})});
  const body=await response.json();if(response.ok)vehicle={...body.data,updatedAt:new Date(body.data.updatedAt)};return {status:response.status,body};
 };
 eq(vehicleVolume(40,{}).liters,null);
 eq((await send({litersPerCarton:15,maxVolumeLiters:999,independentVolume:false})).status,200);eq(vehicle.capacityProfile.maxVolumeLiters,600);eq(vehicle.capacityProfile.independentVolume,false);
 eq((await send({litersPerCarton:15,maxVolumeLiters:750,independentVolume:true})).status,200);eq(vehicle.maxCartons,40);eq(vehicle.capacityProfile.maxVolumeLiters,750);
 eq((await send({maxCartons:30,litersPerCarton:15,maxVolumeLiters:999,independentVolume:false})).status,200);eq(vehicle.capacityProfile.maxVolumeLiters,450);
 eq((await send({maxVolumeLiters:500,litersPerCarton:null,independentVolume:false})).status,422);
 eq((await send({maxVolumeLiters:500,independentVolume:true},people[1])).status,403);
 eq((await send({litersPerCarton:-1})).status,400);
 eq((await send({litersPerCarton:15,updatedAt:'2000-01-01T00:00:00.000Z'})).status,409);
 eq((await send({maxCartons:100000,litersPerCarton:100000,maxVolumeLiters:0,independentVolume:false})).status,422);
 eq((await send({maxCartons:0,maxVolumeLiters:500,litersPerCarton:null,independentVolume:true})).status,200);eq(vehicle.capacityProfile.maxVolumeLiters,500);
 eq((await prisma.auditEvent.count({where:{entityId:vehicle.id,action:'VEHICLE_CAPACITY_UPDATED'}})),4);
 console.log(`PASS: ${checks} volume checks: canonical conversion, independent Admin values, no invented ratio, validation, stale-write prevention, audit trail.`);
}finally{
 if(vehicle){await prisma.auditEvent.deleteMany({where:{entityId:vehicle.id}});await prisma.vehicle.delete({where:{id:vehicle.id}});}await prisma.user.deleteMany({where:{id:{in:people.map(p=>p.id)}}});await new Promise(r=>server.close(r));await prisma.$disconnect();
}
