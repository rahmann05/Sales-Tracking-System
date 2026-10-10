import 'dotenv/config';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import {io as client} from '../../client/node_modules/socket.io-client/build/esm-debug/index.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {createSocketServer} from '../src/config/socket.js';
import {configureSocketAdapter,socketAdapterOptions,socketAdapterStatus} from '../src/config/socket-adapter.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const suffix=randomUUID().replaceAll('-',''),tableName='socket_test_'+suffix,channelPrefix='test.'+suffix,servers=[],sockets=[],clients=[],closers=[],users=[];
let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const event=(emitter,name,trigger)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{emitter.off(name,done);reject(new Error('Timeout '+name));},10000);const done=data=>{clearTimeout(timer);resolve(data);};emitter.once(name,done);trigger?.();});
try{
 assert.throws(()=>socketAdapterOptions({SOCKET_ADAPTER:'POSTGRES',DIRECT_URL:'postgresql://u:p@ep-abc-pooler.example/db'}),/pooler/);checks++;
 assert.throws(()=>socketAdapterOptions({SOCKET_ADAPTER:'POSTGRES'}),/memerlukan/);checks++;
 await prisma.$executeRawUnsafe(`CREATE TABLE ${tableName} (id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(), payload bytea)`);
 for(let n=0;n<2;n++){
  const server=createServer(),socket=createSocketServer(server);servers.push(server);sockets.push(socket);
  closers.push(await configureSocketAdapter(socket,{mode:'POSTGRES',url:process.env.DATABASE_URL,tableName,channelPrefix}));
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
 }
 const user=await prisma.user.create({data:{name:'Socket adapter test',email:suffix+'@example.invalid',password:'unused',role:'SALES'}});users.push(user.id);
 const other=await prisma.user.create({data:{name:'Other socket test',email:'other'+suffix+'@example.invalid',password:'unused',role:'SALES'}});users.push(other.id);
 for(const [index,actor] of [[0,user],[1,user],[1,other]]){
  const c=client(`http://127.0.0.1:${servers[index].address().port}`,{auth:{token:jwt.sign({id:actor.id},config.jwtSecret)},transports:['websocket'],autoConnect:false,reconnection:false});clients.push(c);await event(c,'connect',()=>c.connect());
 }
 // Round trip proves the two LISTEN subscribers are ready; no fixed timing assumption.
 sockets[1].on('test:probe',ack=>ack('replica-two'));
 let replies=[];const deadline=Date.now()+10000;
 while(!replies.includes('replica-two')&&Date.now()<deadline){replies=await sockets[0].serverSideEmitWithAck('test:probe');if(!replies.length)await new Promise(r=>setTimeout(r,100));}
 eq(replies,['replica-two']);eq(socketAdapterStatus(sockets[0]).mode,'POSTGRES');
 const delivered=[];clients[2].on('notification',data=>delivered.push(data));
 const message=event(clients[1],'notification',()=>sockets[0].to(`user:${user.id}`).emit('notification',{id:'small'}));eq(await message,{id:'small'});
 const payload={id:'large',body:'x'.repeat(12000)};
 eq(await event(clients[1],'notification',()=>sockets[0].to(`user:${user.id}`).emit('notification',payload)),payload);
 eq(delivered,[]);
 eq(await event(clients[1],'cache:invalidate',()=>sockets[0].emit('cache:invalidate',{dataType:'policies'})),{dataType:'policies'});
 const disconnected=event(clients[1],'disconnect',()=>sockets[0].in(`user:${user.id}`).disconnectSockets(true));eq(await disconnected,'io server disconnect');eq(clients[2].connected,true);
 console.log(`Socket adapter passed: ${checks} assertions; two HTTP/Socket.IO instances, PostgreSQL pub/sub, private rooms, large payload, invalidation and remote session revocation.`);
}finally{
 clients.forEach(c=>c.disconnect());
 for(const socket of sockets)await new Promise(r=>socket.close(r));
 for(const close of closers)await close();
 await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS ${tableName}`);
 await prisma.user.deleteMany({where:{id:{in:users}}});await prisma.$disconnect();
}
