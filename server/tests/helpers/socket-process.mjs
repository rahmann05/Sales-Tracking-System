import 'dotenv/config';
import {createServer} from 'node:http';
import {prisma} from '../../src/config/prisma.js';
import {initSocket,broadcastCacheInvalidation} from '../../src/config/socket.js';
import {configureSocketAdapter} from '../../src/config/socket-adapter.js';
import {effectivePolicy} from '../../src/modules/config/services/policy-resolver.service.js';
if(!['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname))throw Error('Local database only');
const server=createServer(),io=initSocket(server);
const close=await configureSocketAdapter(io,{mode:'POSTGRES',url:process.env.DATABASE_URL,tableName:process.env.TEST_SOCKET_TABLE,channelPrefix:process.env.TEST_SOCKET_CHANNEL});
io.on('test:probe',ack=>ack('ready'));
io.on('policy:invalidate',()=>process.send({event:'policy:invalidate'}));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
process.send({event:'ready',port:server.address().port});
process.on('message',async({id,command,...data})=>{
 try{
  let result;
  if(command==='probe')result=await io.serverSideEmitWithAck('test:probe');
  else if(command==='notify')io.to(`user:${data.userId}`).emit('notification',data.payload);
  else if(command==='invalidate')broadcastCacheInvalidation('policies');
  else if(command==='snapshot')result=(await effectivePolicy(data.actor)).values.SALES_ATTENDANCE_MODE;
  else if(command==='revoke')io.in(`user:${data.userId}`).disconnectSockets(true);
  else if(command==='close'){
   await new Promise(r=>io.close(r));await close();await prisma.$disconnect();process.send({id,result:'closed'},()=>process.exit(0));return;
  }else throw Error('Unknown test command');
  process.send({id,result});
 }catch{process.send({id,error:'Worker operation failed'});}
});
