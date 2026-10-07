import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {httpServer} from '../src/app.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const require=createRequire(new URL('../../client/package.json',import.meta.url));
const esbuild=require('esbuild');
const built=await esbuild.build({bundle:true,platform:'node',format:'cjs',write:false,stdin:{resolveDir:fileURLToPath(new URL('../../client/',import.meta.url)),contents:`export {authApi,configApi,staffAttendanceApi,reportsApi,clustersApi} from './src/services/api.js';export {setAuthToken,getAuthToken} from './src/services/httpClient.js';`}});
const module={exports:{}};new Function('module','exports',built.outputFiles[0].text)(module,module.exports);
const api=module.exports;
const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};globalThis.window=new EventTarget();
let expired=0;window.addEventListener('auth:expired',()=>expired++);
const originalFetch=globalThis.fetch;
const ids=[],password=randomUUID();let serverStarted=false;
try {
 await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));serverStarted=true;
 const base=`http://127.0.0.1:${httpServer.address().port}`;let refreshCalls=0;
 globalThis.fetch=(url,options)=>{if(url.endsWith('/auth/refresh'))refreshCalls++;return originalFetch(base+url,options);};
 const user=await prisma.user.create({data:{id:randomUUID(),name:'verify-session-reports',email:`verify-session-${randomUUID()}@example.test`,password:await bcrypt.hash(password,10),role:'ADMIN'}});ids.push(user.id);
 await api.authApi.login(user.email,password);assert.ok(storage.get('refreshToken'));
 api.setAuthToken(jwt.sign({id:user.id},config.jwtSecret,{expiresIn:-1}));
 const restored=await Promise.all([api.authApi.me(),api.configApi.getRuntime(),api.staffAttendanceApi.getToday(),api.clustersApi.getAll()]);
 assert.equal(restored[0].data.id,user.id);assert.equal(refreshCalls,1);assert.equal(expired,0);
 for(const [name,load] of [['weekly',()=>api.reportsApi.getWeekly({startDate:'2026-10-05',userId:undefined})],['mtd',()=>api.reportsApi.getMtd({month:10,year:2026,userId:undefined})]]) {
  const start=performance.now();const result=await load();assert.ok(result.data.summary);assert.ok(Array.isArray(result.data.salesmen));console.log(`${name}: actual PostgreSQL report completed in ${Math.round(performance.now()-start)} ms (${result.data.salesmen.length} sales).`);
 }
 const old=api.getAuthToken();storage.set('refreshToken','invalid');api.setAuthToken('invalid');await assert.rejects(api.authApi.me(),error=>error.status===401);assert.equal(api.getAuthToken(),'');assert.equal(storage.get('refreshToken'),undefined);assert.equal(expired,1);assert.ok(old);
 console.log('Session/report HTTP integration passed: login, one shared refresh for expired concurrent requests, actual PostgreSQL weekly/MTD response, invalid-session cleanup.');
}finally {
 globalThis.fetch=originalFetch;
 for(const id of ids)await prisma.user.delete({where:{id}});
 if(serverStarted){httpServer.closeAllConnections();await new Promise(resolve=>httpServer.close(resolve));}
 await prisma.$disconnect();
}
