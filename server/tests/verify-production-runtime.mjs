// Explicit production smoke: existing UAT accounts are read-only; socket fixtures are isolated.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import {configureSocketAdapter} from '../src/config/socket-adapter.js';
import {io as client} from '../../client/node_modules/socket.io-client/build/esm-debug/index.js';
assert.ok(process.argv.includes('--approved-production'),'Explicit production test approval required');
const env=dotenv.parse(fs.readFileSync('.env.production')),base='https://sinar-anugrah-production.up.railway.app',url=new URL(env.DIRECT_URL||env.DATABASE_URL);
assert.ok(url.hostname.endsWith('.neon.tech')&&!url.hostname.includes('-pooler'));
if(['require','prefer','verify-ca'].includes(url.searchParams.get('sslmode')))url.searchParams.set('sslmode','verify-full');
const pool=new pg.Pool({connectionString:url.toString(),max:3,connectionTimeoutMillis:15000});
const report={at:new Date().toISOString(),checks:[],scope:'Authenticated API read smoke, runtime monitoring and isolated cross-process private socket/logout; not full transaction/device/ground-truth UAT'};
const sockets=[],fixtureIds=[];let peer,closePeer,profileKey;
const check=(name,actual,expected)=>{assert.deepEqual(actual,expected,name);report.checks.push({name,status:'PASS'});};
async function request(path,token,body){const response=await fetch(base+'/api/v1'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});let data;try{data=await response.json();}catch{}return {status:response.status,data};}
async function login(email,password){const response=await request('/auth/login',null,{email,password});check('login '+email.split('@')[0],response.status,200);assert.ok(response.data.data.accessToken);return response.data.data;}
const event=(socket,name,trigger)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{socket.off(name,receive);reject(Error('Socket timeout: '+name));},15000);const receive=value=>{clearTimeout(timer);resolve(value);};socket.once(name,receive);trigger?.();});
try{
 const paths={admin:['/config/runtime','/orders','/delivery/packing-lists','/delivery/routes','/delivery/operations','/outlets/directory','/outlets/reviews','/reports/dashboard'], 'spv-1':['/pjp','/orders','/outlets/reviews','/reports/dashboard'], 'sales-1':['/pjp/today','/orders','/outlets/field-tasks'],gudang:['/delivery/packing-lists','/delivery/routes','/delivery/operations'], 'supir-1':['/delivery/routes','/delivery/my-issues']};
 let admin;
 for(const [account,endpoints] of Object.entries(paths)){
  const session=await login(account+'.demo@sinaranugrah.test',env.SEED_PASSWORD||'DemoSinar2026!');
  if(account==='admin')admin=session;
  check('identity '+account,(await request('/auth/me',session.accessToken)).data.data.id,session.user.id);
  for(const endpoint of endpoints)check(account+' GET '+endpoint,(await request(endpoint,session.accessToken)).status,200);
  if(account!=='admin')check(account+' monitoring forbidden',(await request('/health/monitoring',session.accessToken)).status,403);
 }
 const monitoring=await request('/health/monitoring',admin.accessToken);check('monitoring status',monitoring.status,200);report.monitoring=monitoring.data.data;
 check('runtime database',report.monitoring.database,'OK');check('scheduler initialized',report.monitoring.schedulerInitialized,true);check('scheduler count',report.monitoring.jobs.length,14);
 check('no failed or stalled worker',report.monitoring.jobs.filter(j=>['FAILED','STALLED','OVERDUE'].includes(j.status)).map(j=>j.id),[]);
 check('production postgres socket',report.monitoring.socket.mode,'POSTGRES');check('socket configured',report.monitoring.socket.state,'CONFIGURED');
 const password=randomUUID(),hash=await bcrypt.hash(password,10);
 for(let i=0;i<2;i++){
  const id=randomUUID(),email='matrix-socket-'+id+'@example.invalid';
  await pool.query('INSERT INTO "User" (id,name,email,password,role,"roleCode","updatedAt") VALUES ($1,$2,$3,$4,$5::text::"Role",$5::text,now())',[id,'Temporary matrix socket UAT',email,hash,i===0?'SALES':'SUPERVISOR']);fixtureIds.push(id);
  const session=await login(email,password),socket=client(base,{auth:{token:session.accessToken},transports:['websocket'],autoConnect:false,reconnection:false,extraHeaders:{origin:'https://sinar-anugrah.vercel.app'}});sockets.push(socket);
  await event(socket,'connect',()=>socket.connect());socket.testSession=session;
 }
 const http=createServer();peer=new Server(http);closePeer=await configureSocketAdapter(peer,{mode:'POSTGRES',url:url.toString()});
 await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
 const deadline=Date.now()+15000;let peers=1;
 while(peers<2&&Date.now()<deadline){peers=await peer.of('/').adapter.serverCount();if(peers<2)await new Promise(resolve=>setTimeout(resolve,250));}
 check('peer discovered production subscriber',peers>=2,true);
 check('remote private room member',(await peer.in('user:'+fixtureIds[0]).fetchSockets()).length,1);
 // The peer only publishes to temporary fixture rooms; no persisted business notification.
 let leaked=false;sockets[1].on('matrix:probe',()=>{leaked=true;});
 const payload={id:randomUUID(),text:'x'.repeat(12000)};
 const received=event(sockets[0],'matrix:probe',()=>peer.to('user:'+fixtureIds[0]).emit('matrix:probe',payload));
 check('cross-process large private payload',await received,payload);
 check('other user received no private event',leaked,false);
 const remoteDisconnected=event(sockets[0],'disconnect',()=>peer.in('user:'+fixtureIds[0]).disconnectSockets(true));
 check('cross-process socket disconnect',await remoteDisconnected,'io server disconnect');
 await event(sockets[0],'connect',()=>sockets[0].connect());
 // Only this temporary Sales/team receives the test policy. No global business setting changes.
 await pool.query('UPDATE "User" SET "supervisorId"=$2 WHERE id=$1',[fixtureIds[0],fixtureIds[1]]);
 profileKey='_POLICY_PROFILE:TEAM:'+fixtureIds[1];
 const version=(revision,mode)=>JSON.stringify({versions:[{revision,effectiveAt:new Date(0).toISOString(),values:{SALES_ATTENDANCE_MODE:mode}}]});
 await pool.query('INSERT INTO "SystemConfig" (key,value,"updatedAt") VALUES ($1,$2::jsonb,now())',[profileKey,version(1,'IN_ONLY')]);
 peer.serverSideEmit('policy:invalidate');
 const runtimeMode=async()=>(await request('/config/runtime',sockets[0].testSession.accessToken)).data.data.SALES_ATTENDANCE_MODE;
 check('temporary team policy baseline',await runtimeMode(),'IN_ONLY');
 await pool.query('UPDATE "SystemConfig" SET value=$2::jsonb WHERE key=$1',[profileKey,version(2,'IN_OUT')]);
 const invalidatedAt=Date.now();peer.serverSideEmit('policy:invalidate');
 let mode=await runtimeMode();while(mode!=='IN_OUT'&&Date.now()-invalidatedAt<3500){await new Promise(resolve=>setTimeout(resolve,100));mode=await runtimeMode();}
 check('cross-process policy cache invalidation',mode,'IN_OUT');check('invalidation precedes five-second cache expiry',Date.now()-invalidatedAt<4000,true);
 const disconnected=event(sockets[0],'disconnect');
 check('logout test account',(await request('/auth/logout',sockets[0].testSession.accessToken,{})).status,200);
 check('socket revoked on logout',await disconnected,'io server disconnect');
 check('old access token revoked',(await request('/auth/me',sockets[0].testSession.accessToken)).status,401);
 const refresh=await request('/auth/refresh',null,{refreshToken:sockets[0].testSession.refreshToken});check('old refresh revoked',refresh.status,401);
 report.success=true;
}catch(error){report.success=false;report.error=error.message;process.exitCode=1;}
finally{
 if(profileKey){await pool.query('DELETE FROM "SystemConfig" WHERE key=$1',[profileKey]);peer?.serverSideEmit('policy:invalidate');}
 sockets.forEach(socket=>socket.disconnect());if(peer)await new Promise(resolve=>peer.close(resolve));if(closePeer)await closePeer();
 if(fixtureIds.length)await pool.query('DELETE FROM "User" WHERE id=ANY($1::text[])',[fixtureIds]);
 await pool.end();report.completedAt=new Date().toISOString();const output='../docs/SYSTEM_PRODUCTION_RUNTIME_20261011.json';if(fs.existsSync(output)){const previous=JSON.parse(fs.readFileSync(output));report.previousAttempts=[...(previous.previousAttempts||[]),{at:previous.at,success:previous.success,error:previous.error,checks:previous.checks.length}];}fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({success:report.success,checks:report.checks.length,error:report.error,monitoring:report.monitoring?{database:report.monitoring.database,socket:report.monitoring.socket,jobs:report.monitoring.jobs.map(j=>({id:j.id,status:j.status,lastOutcome:j.lastOutcome}))}:undefined},null,2));
}
