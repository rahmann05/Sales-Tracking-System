import {knownPoint} from '../../../../../shared/outlet-validation.mjs';
export function comparisonDistance(a,b){
 if(!knownPoint(a)||!knownPoint(b))return null;
 const rad=value=>value*Math.PI/180,dLat=rad(b.latitude-a.latitude),dLng=rad(b.longitude-a.longitude);
 const h=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLng/2)**2;
 return Math.round(6371000*2*Math.asin(Math.sqrt(Math.min(1,h))));
}

export function outletComparisonPoints({previous,recommended,candidate,fieldPoints=[]}) {
 const points=[{...previous,key:'previous',label:'M',title:'Titik master sebelumnya',kind:'previous'},
  {...recommended,key:'recommended',label:'G',title:'Rekomendasi Google terkuat',kind:'recommended'}];
 if(candidate&&candidate.placeId!==recommended?.placeId)points.push({...candidate,key:'selected',label:'P',title:'Kandidat yang sedang ditinjau',kind:'selected'});
 fieldPoints.forEach((point,index)=>points.push({...point,key:`field-${index}`,label:'L',title:'GPS pemeriksaan lapangan',kind:'field'}));
 return points.filter(knownPoint).map(({key,label,title,kind,latitude,longitude})=>({key,label,title,kind,latitude,longitude}));
}

export async function mountOutletComparisonMap(maps,element,points,{mapId='DEMO_MAP_ID',isActive=()=>true}={}) {
 const markerLibrary=maps.marker?.AdvancedMarkerElement?maps.marker:await maps.importLibrary('marker');
 if(!isActive())return {destroy:()=>{}};
 const center={lat:points[0].latitude,lng:points[0].longitude};
 const map=new maps.Map(element,{center,zoom:16,mapId:mapId||'DEMO_MAP_ID',streetViewControl:false,mapTypeControl:true,fullscreenControl:true,gestureHandling:'cooperative'});
 const bounds=new maps.LatLngBounds(),groups=new Map(),markers=[];
 for(const point of points){const key=`${point.latitude},${point.longitude}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(point);}
 for(const group of groups.values()){
  const p=group[0],position={lat:p.latitude,lng:p.longitude};bounds.extend(position);
  const label=document.createElement('span');label.className=`ov-map-pin is-${p.kind}`;label.textContent=group.map(p=>p.label).join('/');
  markers.push(new markerLibrary.AdvancedMarkerElement({map,position,content:label,title:group.map(p=>p.title).join(' · ')}));
 }
 const previous=points.find(p=>p.key==='previous'),recommended=points.find(p=>p.key==='recommended');
 const line=previous&&recommended?new maps.Polyline({map,path:[previous,recommended].map(p=>({lat:p.latitude,lng:p.longitude})),strokeColor:'#1769aa',strokeWeight:2,strokeOpacity:0.7,clickable:false}):null;
 const fit=()=>{if(groups.size>1){map.fitBounds(bounds,64);maps.event.addListenerOnce(map,'idle',()=>{if(map.getZoom()>18)map.setZoom(18);});}else{map.setCenter(center);map.setZoom(16);}};
 fit();
 return {fit,focus:key=>{const p=points.find(p=>p.key===key);if(p){map.panTo({lat:p.latitude,lng:p.longitude});map.setZoom(17);}},destroy:()=>{markers.forEach(m=>{m.map=null;});line?.setMap(null);maps.event.clearInstanceListeners(map);}};
}
