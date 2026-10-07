import { useEffect } from 'react';
import { useMap } from '../../../context/MapContext';
import { routingService } from '../../../services/routingService';

const coordinates=outlet=>({lat:Number(outlet.latitude),lng:Number(outlet.longitude)});
export function useClusterMap({step,allOutlets,selectedOutlets,centerPoint,routes,activeRouteIndex,draft,selectCenter,busy,saving}) {
  const {setMapMode,setMarkers,clearMarkers,setPolylines,clearPolylines,addClickListener,removeClickListener,isMapReady,panTo}=useMap();
  useEffect(()=>{setMapMode('create-cluster');return()=>{setMapMode('hidden');clearMarkers();clearPolylines();removeClickListener();};},[setMapMode,clearMarkers,clearPolylines,removeClickListener]);
  useEffect(()=>{
    if(step===2&&isMapReady&&!busy&&!saving)addClickListener(selectCenter);
    else removeClickListener();
    return removeClickListener;
  },[step,isMapReady,busy,saving,selectCenter,addClickListener,removeClickListener]);
  useEffect(()=>{if(centerPoint&&isMapReady)panTo(centerPoint.lat,centerPoint.lng);},[centerPoint,isMapReady,panTo]);
  useEffect(()=>{
    if(!isMapReady)return;
    const order=routes[activeRouteIndex]?.outletOrder || selectedOutlets.map((outlet,index)=>({id:outlet.id,sequence:index+1}));
    const selected=new Map(order.map(item=>[item.id,item.sequence]));
    const outlets=new Map([...allOutlets,...selectedOutlets].map(outlet=>[outlet.id,outlet]));
    const markers=[...outlets.values()].filter(outlet=>outlet.latitude!=null&&outlet.longitude!=null).map(outlet=>({id:outlet.id,...coordinates(outlet),title:outlet.name,label:selected.has(outlet.id)?String(selected.get(outlet.id)):null,icon:{path:0,scale:selected.has(outlet.id)?11:6,fillColor:selected.has(outlet.id)?draft.colorHex:'#9ca3af',strokeColor:'#fff',strokeWeight:2},onClick:step===2&&!busy&&!saving?()=>selectCenter(coordinates(outlet)):undefined}));
    if(centerPoint)markers.push({id:'cluster-center',...centerPoint,title:'Titik pusat kluster',icon:{path:0,scale:8,fillColor:'#111827',strokeColor:'#fff',strokeWeight:3},zIndex:999});
    setMarkers(markers);
  },[step,isMapReady,allOutlets,selectedOutlets,centerPoint,routes,activeRouteIndex,draft.colorHex,selectCenter,busy,saving,setMarkers]);
  useEffect(()=>{
    let current=true;clearPolylines();
    const route=routes[activeRouteIndex];if(!route||!isMapReady)return;
    const outlets=new Map(selectedOutlets.map(outlet=>[outlet.id,outlet]));
    const points=route.outletOrder.map(item=>outlets.get(item.id)).filter(Boolean).map(coordinates);
    if(points.length<2)return;
    const draw=path=>setPolylines([{id:'cluster-preview',path,color:draft.colorHex,isActive:true}]);
    draw(points);
    routingService.fetchRoadRoute(points).then(result=>{if(current){const path=result.legs.flatMap(leg=>leg.path || []);if(path.length)draw(path);}}).catch(()=>{});
    return()=>{current=false;};
  },[routes,activeRouteIndex,selectedOutlets,draft.colorHex,isMapReady,setPolylines,clearPolylines]);
}
