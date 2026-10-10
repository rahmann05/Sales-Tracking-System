import {outletOperationalPoint} from './outlet-location.mjs';
export function preferredTrip(routes,id){return routes.find(r=>r.id===id)||routes.find(r=>r.status==='IN_TRANSIT'&&!r.returnedAt&&!r.onHold)||routes.find(r=>r.status==='READY'&&!r.onHold)||routes[0];}
export const orderedStops=route=>[...(route?.stops||[])].sort((a,b)=>(a.sequence??0)-(b.sequence??0));
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
