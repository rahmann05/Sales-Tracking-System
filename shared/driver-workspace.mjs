export function preferredTrip(routes,id){return routes.find(r=>r.id===id)||routes.find(r=>r.status==='IN_TRANSIT'&&!r.returnedAt&&!r.onHold)||routes.find(r=>r.status==='READY'&&!r.onHold)||routes[0];}
export const orderedStops=route=>[...(route?.stops||[])].sort((a,b)=>(a.sequence??0)-(b.sequence??0));
export const nextDeliveryStop=stops=>stops.find(s=>s.status==='PENDING'&&s.arrivedAt)||stops.find(s=>s.status==='PENDING');
export function validOutletPoint(outlet){return outlet?.latitude!=null&&outlet?.longitude!=null&&Number.isFinite(Number(outlet.latitude))&&Number.isFinite(Number(outlet.longitude))&&Math.abs(Number(outlet.latitude))<=90&&Math.abs(Number(outlet.longitude))<=180;}
export const deliveryNavigationUrl=outlet=>validOutletPoint(outlet)?`https://www.google.com/maps/dir/?api=1&destination=${Number(outlet.latitude)},${Number(outlet.longitude)}&travelmode=driving`:null;
