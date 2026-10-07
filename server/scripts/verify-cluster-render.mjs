import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const client=fileURLToPath(new URL('../../client/',import.meta.url));
const require=createRequire(new URL('../../client/package.json',import.meta.url));
const esbuild=require('esbuild');
const mocks={
 react:`export const useMemo=(fn,deps)=>globalThis.hookHarness.memo(fn,deps);export const useCallback=(fn,deps)=>useMemo(()=>fn,deps);export const useEffect=(fn,deps)=>globalThis.hookHarness.effect(fn,deps);export default {createElement:()=>null};`,
 app:`export const useApp=()=>globalThis.fixture.app;`,
 data:`export const useMapData=()=>globalThis.fixture.data;`,
 map:`export const useMap=()=>globalThis.fixture.map;`,
 builder:`export const useClusterBuilder=()=>globalThis.fixture.builder;`,
 panel:`export const ClusterControlPanel=()=>null;`,
 navigation:`export const TAB_IDS={MASTER_CLUSTERS:'master-clusters'};`,
 routing:`export const routingService={fetchRoadRoute:async()=>({legs:[]})};`,
};
const bundle=await esbuild.build({bundle:true,platform:'node',format:'cjs',write:false,absWorkingDir:client,entryPoints:['src/pages/RoutePlanning/CreateClusterPage.jsx'],loader:{'.css':'empty'},plugins:[{name:'render-fixture',setup(build){build.onResolve({filter:/.*/},args=>{
 let key;if(args.path==='react')key='react';
 else if(args.path.endsWith('/AppContext'))key='app';else if(args.path.endsWith('/MapDataContext'))key='data';else if(args.path.endsWith('/MapContext'))key='map';
 else if(args.path.endsWith('/useClusterBuilder'))key='builder';else if(args.path.endsWith('/ClusterControlPanel'))key='panel';else if(args.path.endsWith('/navigation'))key='navigation';else if(args.path.endsWith('/routingService'))key='routing';
 if(key)return {path:key,namespace:'fixture'};
 });build.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:mocks[args.path],loader:'js'}));}}]});
const slots=[];let cursor=0,pending=[],rerender=false,renders=0,markerWrites=0,lastMarkers=[];
const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((item,index)=>Object.is(item,b[index]));
globalThis.hookHarness={memo(fn,deps){const index=cursor++;if(!equal(slots[index]?.deps,deps))slots[index]={deps,value:fn()};return slots[index].value;},effect(fn,deps){const index=cursor++;if(!equal(slots[index]?.deps,deps)){const previous=slots[index];slots[index]={deps,cleanup:previous?.cleanup};pending.push(()=>{previous?.cleanup?.();slots[index].cleanup=fn();});}}};
const update=()=>{rerender=true;};const noop=()=>{};
globalThis.fixture={app:{user:{role:'ADMIN'},setActiveTab:noop},data:{outlets:[{id:'gt',name:'GT',type:'GENERAL_TRADE',latitude:-6.9,longitude:107.6},{id:'mt',name:'MT',type:'MODERN_TRADE',latitude:-6.91,longitude:107.61}],invalidate:noop,refetchAll:noop},builder:{step:2,selectedOutlets:[],routes:[],activeRouteIndex:0,draft:{tradeType:'GENERAL_TRADE',colorHex:'#111111'},selectCenter:noop,busy:false,saving:false},map:{isMapReady:true,setMapMode:update,setMarkers:markers=>{markerWrites++;lastMarkers=markers;update();},clearMarkers:update,setPolylines:update,clearPolylines:update,addClickListener:noop,removeClickListener:noop,panTo:noop}};
const module={exports:{}};new Function('module','exports',bundle.outputFiles[0].text)(module,module.exports);
const settle=()=>{let passes=0;do{assert.ok(++passes<12,'Cluster map effects keep rendering indefinitely');rerender=false;cursor=0;pending=[];module.exports.CreateClusterPage();renders++;pending.forEach(run=>run());}while(rerender);};
settle();assert.equal(markerWrites,1);assert.deepEqual(lastMarkers.map(marker=>marker.id),['gt']);
for(let i=0;i<5;i++)settle();assert.equal(markerWrites,1,'Unrelated context renders must not rebuild markers');
fixture.builder={...fixture.builder,draft:{...fixture.builder.draft,tradeType:'MODERN_TRADE'}};settle();assert.equal(markerWrites,2);assert.deepEqual(lastMarkers.map(marker=>marker.id),['mt']);
fixture.data={...fixture.data,outlets:[...fixture.data.outlets,{id:'mt2',type:'MODERN_TRADE',latitude:-6.92,longitude:107.62}]};settle();assert.equal(markerWrites,3);assert.equal(lastMarkers.length,2);
fixture.builder={...fixture.builder,busy:true};settle();assert.equal(markerWrites,4);assert.ok(lastMarkers.every(marker=>!marker.onClick));
slots.forEach(slot=>slot.cleanup?.());
console.log(`Cluster render regression passed: ${renders} bounded renders, stable marker effects, GT/MT changes, live outlet updates and cleanup.`);
