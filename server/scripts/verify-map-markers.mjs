import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../client/package.json',import.meta.url));
const built=await require('esbuild').build({bundle:true,platform:'node',format:'cjs',write:false,entryPoints:[fileURLToPath(new URL('../../client/src/services/mapMarkerService.js',import.meta.url))]});
const module={exports:{}};new Function('module','exports',built.outputFiles[0].text)(module,module.exports);
let advanced;
class AdvancedMarker {constructor(options){Object.assign(this,options);advanced=this;}addListener(event,handler){return {event,handler,removed:false,remove(){this.removed=true;}};}}
class LatLng {constructor(position){this.position=position;}lat(){return this.position.lat;}lng(){return this.position.lng;}}
globalThis.window={google:{maps:{marker:{AdvancedMarkerElement:AdvancedMarker},LatLng,Marker:class {constructor(){throw new Error('Legacy marker must not be created');}}}}};
globalThis.document={createElement:tag=>({tag,style:{},children:[],appendChild(child){this.children.push(child);}})};
const map={id:'map'};const marker=module.exports.createMapMarker({map,position:{lat:-6,lng:107},title:'Outlet',icon:{url:'data:image/svg+xml,svg',scaledSize:{width:32,height:40},anchor:{x:16,y:40}},label:{text:'1',color:'black'},zIndex:8});
assert.equal(marker.getMap(),map);assert.equal(marker.getPosition().lat(),-6);assert.equal(advanced.anchorTop,'-40px');assert.equal(advanced.content.children[0].width,32);assert.equal(advanced.content.children[1].textContent,'1');
marker.setPosition({lat:-7,lng:108});assert.equal(marker.getPosition().lng(),108);
marker.setTitle('Nama lengkap');marker.setZIndex(1000);assert.equal(advanced.title,'Nama lengkap');assert.equal(advanced.zIndex,1000);
const listener=marker.addListener('click',()=>{});marker.clearClickListeners();assert.equal(listener.removed,true);
marker.setMap(null);assert.equal(marker.getMap(),null);marker.setMap(map);
marker.setIcon({path:0,scale:10,fillColor:'#123456'});assert.equal(advanced.content.style.width,'20px');assert.equal(advanced.anchorTop,'-50%');marker.setLabel('2');assert.equal(advanced.content.children[0].textContent,'2');
console.log('Advanced marker contract passed: graphic/circle content, label updates, anchors, position, title, layer order, click cleanup and viewport detach/attach without legacy Marker.');
