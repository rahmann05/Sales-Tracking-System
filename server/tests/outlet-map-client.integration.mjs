import assert from 'node:assert/strict';
import {outletComparisonPoints,comparisonDistance,mountOutletComparisonMap} from '../../client/src/pages/OutletValidation/components/outletComparisonMap.js';
import {loadGoogleMapsScript} from '../../client/src/services/googleMapsLoader.js';

const original={window:globalThis.window,document:globalThis.document,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
const markers=[],mapsCreated=[],lines=[],timers=[];let attached,scriptCount=0;
class Script extends EventTarget{remove(){if(attached===this)attached=null;}}
globalThis.window=new EventTarget();
globalThis.document={createElement:tag=>tag==='script'?new Script():{className:'',textContent:''},getElementById:()=>attached,head:{appendChild:script=>{attached=script;scriptCount++;}}};
globalThis.setTimeout=fn=>{timers.push(fn);return timers.length;};globalThis.clearTimeout=()=>{};
const maps={
 Map:class {constructor(element,options){this.options=options;this.zoom=options.zoom;mapsCreated.push(this);}fitBounds(bounds,padding){this.bounds=bounds;this.padding=padding;this.zoom=22;}getZoom(){return this.zoom;}setZoom(zoom){this.zoom=zoom;}setCenter(center){this.center=center;}panTo(center){this.center=center;}},
 LatLngBounds:class {constructor(){this.points=[];}extend(p){this.points.push(p);}},
 Polyline:class {constructor(options){this.options=options;lines.push(this);}setMap(map){this.map=map;}},
 marker:{AdvancedMarkerElement:class{constructor(options){Object.assign(this,options);markers.push(this);}}},
 event:{addListenerOnce:(map,event,fn)=>fn(),clearInstanceListeners:map=>{map.cleared=true;}},
};
try{
 const old={latitude:-6.9,longitude:107.6},google={placeId:'google',latitude:-6.91,longitude:107.61},other={placeId:'other',latitude:-6.89,longitude:107.59};
 const points=outletComparisonPoints({previous:old,recommended:google,candidate:other,fieldPoints:[{latitude:null,longitude:null},{latitude:-6.92,longitude:107.6}]});
 assert.deepEqual(points.map(p=>p.label),['M','G','P','L']);assert.equal(outletComparisonPoints({previous:{},recommended:google,candidate:google}).length,1);
 assert.equal(comparisonDistance(old,old),0);assert.equal(comparisonDistance({},google),null);assert.ok(comparisonDistance(old,google)>1000);
 const controls=await mountOutletComparisonMap(maps,{},points,{mapId:'configured-map'});
 assert.equal(markers.length,4);assert.equal(mapsCreated[0].bounds.points.length,4);assert.equal(mapsCreated[0].options.mapId,'configured-map');assert.equal(mapsCreated[0].zoom,18);
 assert.deepEqual(lines[0].options.path,[{lat:old.latitude,lng:old.longitude},{lat:google.latitude,lng:google.longitude}]);
 controls.focus('selected');assert.deepEqual(mapsCreated[0].center,{lat:other.latitude,lng:other.longitude});assert.equal(mapsCreated[0].zoom,17);
 controls.destroy();assert.ok(markers.every(m=>m.map===null));assert.equal(lines[0].map,null);assert.equal(mapsCreated[0].cleared,true);
 const same=await mountOutletComparisonMap(maps,{},outletComparisonPoints({previous:old,recommended:{...old,placeId:'same'}}));
 assert.equal(markers.length,5);assert.equal(markers[4].content.textContent,'M/G');assert.equal(mapsCreated[1].zoom,16);same.destroy();
 const cancelled=await mountOutletComparisonMap(maps,{},points,{isActive:()=>false});cancelled.destroy();assert.equal(mapsCreated.length,2);
 const first=loadGoogleMapsScript('fixture-key'),second=loadGoogleMapsScript('fixture-key');assert.equal(first,second);assert.equal(scriptCount,1);
 window.google={maps};window[new URL(attached.src).searchParams.get('callback')]();assert.equal(await first,maps);assert.equal(await second,maps);
 delete window.google;attached=null;
 const failed=loadGoogleMapsScript('fixture-key');const failure=assert.rejects(failed,/failed to load/);attached.dispatchEvent(new Event('error'));await failure;assert.equal(attached,null);
 const retried=loadGoogleMapsScript('fixture-key');window.google={maps};window[new URL(attached.src).searchParams.get('callback')]();assert.equal(await retried,maps);
 delete window.google;attached=null;
 const timeout=loadGoogleMapsScript('fixture-key');const rejected=assert.rejects(timeout,/timed out/);timers.at(-1)();await rejected;assert.equal(attached,null);
 const auth=loadGoogleMapsScript('fixture-key');const denied=assert.rejects(auth,/key was rejected/);window.gm_authFailure();await denied;assert.equal(attached,null);
 console.log('Outlet map client contracts passed: M/G/P/L points, fit/focus, overlap, distance, cleanup, cancelled mount, shared script load, retry, timeout and auth failure (Google adapter mocked).');
}finally{for(const [key,value] of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
