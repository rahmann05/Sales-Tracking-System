import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(new URL('../../client/package.json',import.meta.url));
const esbuild=require('esbuild');
const mocks={
  react:`export const useState=value=>globalThis.countHarness.state(value);export const useRef=value=>globalThis.countHarness.ref(value);export const useCallback=(fn,deps)=>globalThis.countHarness.memo(()=>fn,deps);export const useEffect=(fn,deps)=>globalThis.countHarness.effect(fn,deps);`,
  api:`export const clustersApi=globalThis.countApi;export const teamsApi={getAll:async()=>({data:{sales:[],supervisors:[]}})};`,
};
const bundle=await esbuild.build({bundle:true,platform:'node',format:'cjs',write:false,absWorkingDir:fileURLToPath(new URL('../../client/',import.meta.url)),entryPoints:['src/pages/RoutePlanning/hooks/useClusterBuilder.js'],plugins:[{name:'count-fixture',setup(build){
  build.onResolve({filter:/^(react|.*\/services\/api)$/},args=>({path:args.path==='react'?'react':'api',namespace:'fixture'}));
  build.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:mocks[args.path],loader:'js'}));
}}]});
const slots=[],timers=new Map(),calls=[];
let cursor=0,pending=[],dirty=false,builder,timerId=0,now=0,deferredNearest=null,deferredRoute=null;
const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
globalThis.countHarness={
  state(initial){const index=cursor++;if(!slots[index])slots[index]={value:initial};return [slots[index].value,value=>{const next=typeof value==='function'?value(slots[index].value):value;if(!Object.is(next,slots[index].value)){slots[index].value=next;dirty=true;}}];},
  ref(value){const index=cursor++;if(!slots[index])slots[index]={current:value};return slots[index];},
  memo(fn,deps){const index=cursor++;if(!equal(slots[index]?.deps,deps))slots[index]={deps,value:fn()};return slots[index].value;},
  effect(fn,deps){const index=cursor++;if(!equal(slots[index]?.deps,deps)){const previous=slots[index];slots[index]={deps,cleanup:previous?.cleanup};pending.push(()=>{previous?.cleanup?.();slots[index].cleanup=fn();});}},
};
const outlets=count=>Array.from({length:count},(_,index)=>({id:`outlet-${index}`,type:'GENERAL_TRADE'}));
globalThis.countApi={
  getNearestOutlets:async(lat,lng,count,type)=>{calls.push({lat,lng,count,type});if(deferredNearest)return deferredNearest.promise;return {data:outlets(count)};},
  generateRoutes:async(ids)=>{if(deferredRoute)return deferredRoute.promise;return {data:[{outletIds:ids}]};},
};
const module={exports:{}};
new Function('module','exports','setTimeout','clearTimeout',bundle.outputFiles[0].text)(module,module.exports,(fn,delay)=>{const id=++timerId;timers.set(id,{fn,at:now+delay});return id;},id=>timers.delete(id));
const render=()=>{let passes=0;do{assert.ok(++passes<12,'Hook did not settle');dirty=false;cursor=0;pending=[];builder=module.exports.useClusterBuilder({user:{id:'admin',role:'ADMIN'},onSaved:()=>{}});pending.forEach(run=>run());}while(dirty);};
const flush=async()=>{for(let index=0;index<12;index++){await Promise.resolve();if(dirty)render();}};
const advance=async(ms)=>{now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}await flush();};
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
render();await flush();
builder.setOutletCount(6);render();await advance(300);
assert.equal(calls.length,0,'Typing before choosing a center must not fetch');
const center={lat:-6.9,lng:107.6};
await builder.selectCenter(center,10);render();
assert.equal(builder.selectedOutlets.length,10);
builder.setOutletCount(6);render();
assert.equal(builder.busy,true);assert.equal(builder.selectedOutlets.length,0);assert.equal(builder.routes.length,0);
await advance(249);assert.equal(calls.length,1);
await advance(1);
assert.equal(calls.at(-1).count,6);assert.equal(builder.selectedOutlets.length,6);assert.equal(builder.routes[0].outletIds.length,6);assert.equal(builder.busy,false);
builder.setOutletCount(7);render();builder.setOutletCount(3);render();
await advance(250);assert.equal(calls.length,3);assert.equal(calls.at(-1).count,3);assert.equal(builder.selectedOutlets.length,3);
deferredNearest=deferred();const oldNearest=deferredNearest;
builder.setOutletCount(8);render();await advance(250);
deferredNearest=null;builder.setOutletCount(2);render();await advance(250);
oldNearest.resolve({data:outlets(8)});await flush();
assert.equal(builder.selectedOutlets.length,2);assert.equal(builder.routes[0].outletIds.length,2);
deferredRoute=deferred();const oldRoute=deferredRoute;
builder.setOutletCount(9);render();await advance(250);
deferredRoute=null;builder.setOutletCount(4);render();await advance(250);
oldRoute.resolve({data:[{outletIds:outlets(9).map(outlet=>outlet.id)}]});await flush();
assert.equal(builder.selectedOutlets.length,4);assert.equal(builder.routes[0].outletIds.length,4);
const beforeInvalid=calls.length;
for(const count of [0,101,1.5]){builder.setOutletCount(count);render();await advance(250);assert.equal(builder.busy,false);assert.match(builder.error,/antara 1 dan 100/);assert.equal(builder.selectedOutlets.length,0);}
assert.equal(calls.length,beforeInvalid);
builder.setOutletCount(5);render();builder.field('tradeType','MODERN_TRADE');render();await advance(250);
assert.equal(calls.length,beforeInvalid);assert.equal(builder.centerPoint,null);
await builder.selectCenter(center,2);render();
builder.setOutletCount(6);render();const beforeUnmount=calls.length;
slots.forEach(slot=>slot.cleanup?.());await advance(250);assert.equal(calls.length,beforeUnmount);
delete globalThis.countHarness;delete globalThis.countApi;
console.log('Cluster count regression passed: automatic 10 → 6 update, debounce, stale nearest/route responses, validation, trade change and unmount cancellation.');
