import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../client/package.json',import.meta.url));
const esbuild=require('esbuild');
const built=await esbuild.build({bundle:true,platform:'node',format:'cjs',write:false,stdin:{resolveDir:fileURLToPath(new URL('../../client/',import.meta.url)),contents:`export * from './src/services/httpClient.js';export {collectPages,authApi,reportsApi} from './src/services/api.js';`}});
const module={exports:{}};new Function('module','exports',built.outputFiles[0].text)(module,module.exports);
const {request,saveSession,clearSession,getAuthToken,collectPages,authApi,reportsApi}=module.exports;
const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
globalThis.window=new EventTarget();let expired=0;window.addEventListener('auth:expired',()=>expired++);
const json=(status,data)=>({status,ok:status>=200&&status<300,json:async()=>data});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const session=()=>saveSession({accessToken:'expired',refreshToken:'refresh',user:{id:'account-a'}});
let checks=0;const check=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
session();let refreshes=0;
globalThis.fetch=async(url,options)=>{
 if(url.endsWith('/auth/refresh')){refreshes++;await delay(10);return json(200,{data:{accessToken:'fresh'}});}
 return options.headers.Authorization==='Bearer fresh'?json(200,{data:{ok:true}}):json(401,{message:'Expired'});
};
const values=await Promise.all(Array.from({length:8},(_,i)=>request(`/parallel-${i}`)));check(values.length,8);check(refreshes,1);check(getAuthToken(),'fresh');check(expired,0);
let unavailable=0;globalThis.fetch=async()=>++unavailable===1?json(503,{message:'Backend unavailable'}):json(200,{data:[]});await request('/recovering-read');check(unavailable,2);check(getAuthToken(),'fresh');
unavailable=0;globalThis.fetch=async()=>{unavailable++;return json(503,{message:'Backend unavailable'});};await assert.rejects(request('/failed-mutation',{method:'POST',body:'{}'}),error=>error.status===503);check(unavailable,1);check(getAuthToken(),'fresh');
let calls=0;globalThis.fetch=async()=>{calls++;await delay(10);return json(200,{data:[]});};await Promise.all([request('/shared'),request('/shared')]);check(calls,1);
session();globalThis.fetch=async()=>json(401,{message:'Expired'});await Promise.allSettled([request('/invalid-a'),request('/invalid-b')]);check(expired,1);check(getAuthToken(),'');check(storage.get('refreshToken'),undefined);
session();let release;globalThis.fetch=()=>new Promise(resolve=>{release=resolve;});const late=request('/late');saveSession({accessToken:'account-b-token',user:{id:'account-b'}});release(json(401,{message:'Old response'}));await assert.rejects(late,error=>error.code==='SESSION_CHANGED');check(getAuthToken(),'account-b-token');check(expired,1);
session();let oldRefresh;let refreshStarted;const started=new Promise(resolve=>{refreshStarted=resolve;});
globalThis.fetch=async(url,options)=>{
 if(url.endsWith('/auth/refresh')){const refresh=JSON.parse(options.body).refreshToken;if(refresh==='refresh'){refreshStarted();return new Promise(resolve=>{oldRefresh=resolve;});}return json(200,{data:{accessToken:'new-account-fresh'}});}
 return options.headers.Authorization==='Bearer new-account-fresh'?json(200,{data:{ok:true}}):json(401,{});
};
const oldAccount=request('/old-refresh');const oldOutcome=oldAccount.catch(error=>error);await started;
saveSession({accessToken:'new-account-expired',refreshToken:'new-account-refresh',user:{id:'new-account'}});
await request('/new-refresh');check(getAuthToken(),'new-account-fresh');oldRefresh(json(200,{data:{accessToken:'obsolete'}}));check((await oldOutcome).code,'SESSION_CHANGED');check(getAuthToken(),'new-account-fresh');check(expired,1);
let finish;globalThis.fetch=()=>new Promise(resolve=>{finish=resolve;});const loggedOut=request('/old-data');clearSession();finish(json(200,{data:{private:true}}));await assert.rejects(loggedOut,error=>error.code==='SESSION_CHANGED');checks++;
session();globalThis.fetch=async()=>json(403,{message:'Denied'});await assert.rejects(request('/forbidden'),error=>error.status===403);check(getAuthToken(),'expired');
globalThis.fetch=async()=>json(401,{message:'Wrong password'});await assert.rejects(authApi.login('x','wrong'));check(getAuthToken(),'expired');check(expired,1);
globalThis.fetch=async()=>json(200,{data:{accessToken:'login-token',refreshToken:'login-refresh',user:{id:'login'}}});await authApi.login('x','correct');check(storage.get('refreshToken'),'login-refresh');
globalThis.fetch=()=>new Promise(()=>{});await assert.rejects(request('/timeout',{timeoutMs:20}),error=>error.code==='REQUEST_TIMEOUT');checks++;
globalThis.fetch=async()=>({ok:true,status:200,json:()=>new Promise(()=>{})});await assert.rejects(request('/body-timeout',{timeoutMs:20}),error=>error.code==='REQUEST_TIMEOUT');checks++;
globalThis.fetch=async()=>({ok:true,status:200,json:async()=>{throw new SyntaxError('bad json');}});await assert.rejects(request('/invalid-json'),error=>error.code==='INVALID_RESPONSE');checks++;
globalThis.fetch=async url=>{check(url.includes('undefined'),false);return json(200,{data:{}});};await reportsApi.getWeekly({startDate:'2026-10-05',userId:undefined});
let pages=0;await assert.rejects(collectPages(async()=>{pages++;return {data:[{id:'same'}],pagination:{hasNextPage:true}};}),/Pagination/);check(pages,2);
await assert.rejects(collectPages(async()=>({data:[],pagination:{hasNextPage:true}})),/Pagination/);checks++;
const all=await collectPages(async({page})=>({data:[{id:page}],pagination:{totalPages:3}}));check(all.data.length,3);
console.log(`Client fetch verification passed: ${checks} checks for shared refresh, deduplication, session races, timeout including stalled JSON, authorization errors, login refresh storage, clean filters and bounded pagination.`);
