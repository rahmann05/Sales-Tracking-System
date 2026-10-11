import {outletOperationalPoint} from './outlet-location.mjs';
export function preferredTrip(routes,id){return routes.find(r=>r.id===id)||routes.find(r=>r.status==='IN_TRANSIT'&&!r.returnedAt&&!r.onHold)||routes.find(r=>r.status==='READY'&&!r.onHold)||routes[0];}
export const orderedStops=route=>[...(route?.stops||[])].sort((a,b)=>(a.sequence??0)-(b.sequence??0));
export function deliveryVisitGroups(stops){
 const groups=[];
 for(const stop of orderedStops({stops})){
  const point=outletOperationalPoint(stopDestinationOutlet(stop));
  const key=validOutletPoint(point)?`${stop.outletId}:${Number(point.latitude).toFixed(6)},${Number(point.longitude).toFixed(6)}`:`missing:${stop.id}`;
  const previous=groups.at(-1);
  if(previous?.key===key)previous.stops.push(stop);else groups.push({key,stops:[stop]});
 }
 return groups;
}
export function stopDestinationOutlet(stop){
 if(!stop?.outlet)return null;
 if(stop.targetLatitude!=null&&stop.targetLongitude!=null&&Number.isFinite(Number(stop.targetLatitude))&&Number.isFinite(Number(stop.targetLongitude))){
  return {...stop.outlet,googleLocation:null,nativeLocation:{latitude:Number(stop.targetLatitude),longitude:Number(stop.targetLongitude)},latitude:Number(stop.targetLatitude),longitude:Number(stop.targetLongitude),googleMapsOnly:stop.targetPointSource==='GOOGLE'};
 }
 const op=outletOperationalPoint(stop.outlet);
 if(op.latitude!=null&&op.longitude!=null)return stop.outlet;
 const lat=stop.outlet.deliveryLatitude??stop.outlet.latitude??stop.outlet.nativeLocation?.latitude;
 const lng=stop.outlet.deliveryLongitude??stop.outlet.longitude??stop.outlet.nativeLocation?.longitude;
 if(lat==null||lng==null||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng)))return stop.outlet;
 return {...stop.outlet,googleLocation:null,nativeLocation:{latitude:Number(lat),longitude:Number(lng)},latitude:Number(lat),longitude:Number(lng),googleMapsOnly:false};
}
export const nextDeliveryStop=stops=>stops.find(s=>s.status==='PENDING'&&s.arrivedAt)||stops.find(s=>s.status==='PENDING');
export function validOutletPoint(outlet){outlet=outletOperationalPoint(outlet);return outlet?.latitude!=null&&outlet?.longitude!=null&&Number.isFinite(Number(outlet.latitude))&&Number.isFinite(Number(outlet.longitude))&&Math.abs(Number(outlet.latitude))<=90&&Math.abs(Number(outlet.longitude))<=180;}
export const deliveryNavigationUrl=outlet=>{outlet=outletOperationalPoint(outlet);return validOutletPoint(outlet)?`https://www.google.com/maps/dir/?api=1&destination=${Number(outlet.latitude)},${Number(outlet.longitude)}&travelmode=driving`:null;};

// Starting another destination never finishes an earlier one or creates attendance evidence.
export function deliveryStopGate(stops,stopId,values={}){
 const target=stops.find(s=>s.id===stopId),arrived=s=>!!s.arrivedAt||s.attendances?.some(a=>a.type==='IN');
 if(!target||target.status!=='PENDING'||arrived(target))return {blocked:false,reason:'',incomplete:[]};
 const pending=orderedStops({stops}).filter(s=>s.id!==stopId&&s.status==='PENDING');
 const earlier=pending.find(s=>(s.sequence??0)<(target.sequence??0));
 if(values.DELIVERY_STOP_ORDER==='SEQUENTIAL'&&earlier)return {blocked:true,reason:`Selesaikan hasil tujuan ${earlier.outlet?.name||earlier.sequence} sebelum memulai tujuan ini.`,incomplete:[]};
 const incomplete=pending.filter(arrived);
 if(values.DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT===false&&incomplete.length)return {blocked:true,reason:`Hasil tujuan ${incomplete[0].outlet?.name||incomplete[0].sequence} belum dicatat. Selesaikan sebelum lanjut.`,incomplete:[]};
 return {blocked:false,reason:incomplete.length?'Tujuan sebelumnya belum memiliki hasil. Melanjutkan akan membuat flag pemeriksaan gudang; hasil barang tetap harus dilengkapi.':'',incomplete};
}
