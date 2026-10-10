import 'dotenv/config';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import {io as client} from '../../client/node_modules/socket.io-client/build/esm-debug/index.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {profileKey} from '../src/modules/config/services/policy-resolver.service.js';
assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname),'Local database only');
const suffix=randomUUID().replaceAll('-',''),table='socket_process_'+suffix,channel='process.'+suffix,workers=[],clients=[],users=[];
let key,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
function message(worker,predicate,trigger){return new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>finish(new Error('Worker timed out')),10000);
 const receive=data=>{if(predicate(data))finish(null,data);},exited=()=>finish(new Error('Worker exited'));
 const finish=(error,data)=>{clearTimeout(timeout);worker.off('message',receive);worker.off('exit',exited);error?reject(error):resolve(data);};
 worker.on('message',receive);worker.once('exit',exited);trigger?.();
});}
async function rpc(worker,command,data={}){const id=randomUUID(),response=await message(worker,m=>m.id===id,()=>worker.send({id,command,...data}));if(response.error)throw Error(response.error);return response.result;}
const event=(socket,name,trigger)=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Socket timeout '+name)),10000);socket.once(name,data=>{clearTimeout(timeout);resolve(data);});trigger?.();});
try{
 await prisma.$executeRawUnsafe(`CREATE TABLE ${table} (id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(), payload bytea)`);
 const spv=await prisma.user.create({data:{name:'Socket process fixture',email:suffix+'spv@example.invalid',password:'fixture',role:'SUPERVISOR'}});users.push(spv.id);
 const sales=await prisma.user.create({data:{name:'Socket process fixture',email:suffix+'sales@example.invalid',password:'fixture',role:'SALES',supervisorId:spv.id}});users.push(sales.id);
 key=profileKey('TEAM:'+spv.id);const version=(revision,mode)=>({versions:[{revision,effectiveAt:new Date(0).toISOString(),values:{SALES_ATTENDANCE_MODE:mode}}]});
 await prisma.systemConfig.create({data:{key,value:version(1,'IN_OUT')}});
 for(let i=0;i<2;i++){
  const worker=fork(new URL('./helpers/socket-process.mjs',import.meta.url),[],{env:{...process.env,TEST_SOCKET_TABLE:table,TEST_SOCKET_CHANNEL:channel},stdio:['ignore','ignore','ignore','ipc']});workers.push(worker);
  worker.port=(await message(worker,m=>m.event==='ready')).port;
 }
 let ready=[];const deadline=Date.now()+10000;
 while(!ready.length&&Date.now()<deadline){ready=await rpc(workers[0],'probe');if(!ready.length)await new Promise(r=>setTimeout(r,100));}eq(ready,['ready']);
 for(const worker of workers){const socket=client(`http://127.0.0.1:${worker.port}`,{auth:{token:jwt.sign({id:sales.id},config.jwtSecret)},transports:['websocket'],autoConnect:false,reconnection:false});clients.push(socket);await event(socket,'connect',()=>socket.connect());}
 const payload={id:'cross-process',text:'x'.repeat(12000)};
 eq(await event(clients[1],'notification',()=>rpc(workers[0],'notify',{userId:sales.id,payload})),payload);
 const actor={id:sales.id,role:'SALES',supervisorId:spv.id};
 eq(await rpc(workers[1],'snapshot',{actor}),'IN_OUT');
 await prisma.systemConfig.update({where:{key},data:{value:version(2,'IN_ONLY')}});
 await message(workers[1],m=>m.event==='policy:invalidate',()=>rpc(workers[0],'invalidate'));
 eq(await rpc(workers[1],'snapshot',{actor}),'IN_ONLY');
 eq(await event(clients[1],'disconnect',()=>rpc(workers[0],'revoke',{userId:sales.id})),'io server disconnect');
 console.log(`Socket processes passed: ${checks} assertions; real separate Node processes, large private notification, cross-process policy-cache refresh and remote revocation.`);
}finally{
 clients.forEach(socket=>socket.disconnect());
 for(const worker of workers)if(worker.exitCode===null){try{await rpc(worker,'close');}catch{worker.kill();}}
 if(key)await prisma.systemConfig.deleteMany({where:{key}});await prisma.user.deleteMany({where:{id:{in:users}}});
 await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS ${table}`);await prisma.$disconnect();
}
