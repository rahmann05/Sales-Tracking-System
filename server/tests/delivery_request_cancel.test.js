import test from 'node:test';
import assert from 'node:assert/strict';
import {prisma} from '../src/config/prisma.js';
import {cancelDeliveryRequest,deliveryRequest,findDeliveryRequest} from '../src/modules/delivery/services/delivery-request.service.js';

test('Cancelled delivery identities cannot execute evidence writes; confirmed receipts cannot be erased',async t=>{
 const saved=new Map(),audits=[],id='11111111-1111-4111-8111-111111111111',actor={id:'driver',name:'Driver'},key=`_DELIVERY_REQUEST:driver:${id}`;
 let owner='driver',stopExists=true,writes=0;
 const db={
  $executeRaw:async()=>{},
  deliveryStop:{findUnique:async()=>stopExists?{id:'stop',deliveryRouteId:'route',deliveryRoute:{driverId:owner}}:null},
  deliveryAttendance:{findUnique:async()=>({id:'attendance',type:'IN'})},
  systemConfig:{findUnique:async({where})=>saved.get(where.key)||null,create:async({data})=>{saved.set(data.key,data);return data;}},
  auditEvent:{create:async({data})=>{audits.push(data);return data;}},
 };
 const originals={transaction:prisma.$transaction,stop:prisma.deliveryStop.findUnique,config:prisma.systemConfig.findUnique,attendance:prisma.deliveryAttendance.findUnique};
 prisma.$transaction=async fn=>fn(db);prisma.deliveryStop.findUnique=db.deliveryStop.findUnique;prisma.systemConfig.findUnique=db.systemConfig.findUnique;prisma.deliveryAttendance.findUnique=db.deliveryAttendance.findUnique;
 t.after(()=>{prisma.$transaction=originals.transaction;prisma.deliveryStop.findUnique=originals.stop;prisma.systemConfig.findUnique=originals.config;prisma.deliveryAttendance.findUnique=originals.attendance;});
 await assert.rejects(cancelDeliveryRequest('stop','invalid',actor),error=>error.statusCode===400);
 owner='other';await assert.rejects(cancelDeliveryRequest('stop',id,actor),error=>error.statusCode===404);assert.equal(saved.size,0);
 owner='driver';stopExists=false;await assert.rejects(cancelDeliveryRequest('stop',id,actor),error=>error.statusCode===404);stopExists=true;
 assert.deepEqual(await cancelDeliveryRequest('stop',id,actor),{confirmed:false,cancelled:true});
 assert.deepEqual(await cancelDeliveryRequest('stop',id,actor),{confirmed:false,cancelled:true});assert.equal(audits.length,1);
 await assert.rejects(deliveryRequest(db,{stopId:'stop',driverId:'driver',kind:'ATTENDANCE',data:{requestId:id}},()=>{writes++;}),error=>error.statusCode===409);
 assert.equal(writes,0);assert.deepEqual(await findDeliveryRequest('stop',id,actor),{confirmed:false,cancelled:true});
 saved.set(key,{key,value:{stopId:'stop',kind:'ATTENDANCE',resultId:'attendance',hash:'original'}});
 const confirmed=await cancelDeliveryRequest('stop',id,actor);
 assert.equal(confirmed.confirmed,true);assert.equal(confirmed.result.id,'attendance');assert.equal(audits.length,1);assert.equal(saved.get(key).value.hash,'original');
 saved.set(key,{key,value:{stopId:'foreign',cancelled:true}});
 await assert.rejects(cancelDeliveryRequest('stop',id,actor),error=>error.statusCode===409);
 await assert.rejects(findDeliveryRequest('stop',id,actor),error=>error.statusCode===409);
});
