export const terminalStop = status => ['DELIVERED', 'REJECTED', 'PARTIAL_REJECT'].includes(status);
export const acceptedQuantity = (stop, lineId) => terminalStop(stop.status)
  ? Math.max(0, (stop.allocatedItems || []).filter(i => i.lineId === lineId).reduce((n, i) => n + i.quantity, 0) - (stop.rejectedItems || []).filter(i => i.lineId === lineId).reduce((n, i) => n + i.quantity, 0)) : 0;

export function fulfillment(order, packings) {
  const lines = order.items.map(item => {
    let prepared = 0, accepted = 0;
    for (const packing of packings.filter(p => p.sourceOrderId === order.id)) {
      for (const line of packing.items || []) {
        if ((line.sourceOrderItemId || line.lineId) !== item.id) continue;
        const unavailable = (packing.deliveryStops || []).filter(s=>s.returnInspection).reduce((n,s)=>n+(s.rejectedItems||[]).filter(i=>i.lineId===line.lineId).reduce((a,i)=>a+i.quantity,0)-(s.reusableItems||[]).filter(i=>i.lineId===line.lineId).reduce((a,i)=>a+i.quantity,0),0);
        prepared += Math.max(0,line.quantity-unavailable);
        accepted += (packing.deliveryStops || []).reduce((n, stop) => n + acceptedQuantity(stop, line.lineId), 0);
      }
    }
    const cancelled=item.cancelledQuantity||0;
    return { ...item, prepared, accepted, cancelled, remaining: Math.max(0, item.quantity - accepted - cancelled), unpacked: Math.max(0, item.quantity - prepared - cancelled) };
  });
  return { ...order, fulfillmentLines: lines, fulfillmentStatus: lines.every(i => i.remaining === 0) ? (lines.some(i=>i.cancelled>0)?'CLOSED_WITH_CANCELLATION':'FULFILLED') : lines.some(i => i.accepted > 0) ? 'PARTIAL' : 'OPEN' };
}

export function routeProgress(route) {
  const stops = route.stops || [];
  const resolved = stops.filter(s => terminalStop(s.status)).length;
  const delivered = stops.filter(s => s.status === 'DELIVERED').length;
  return { resolved, delivered, total: stops.length, completionPercent: stops.length ? Math.round(resolved * 100 / stops.length) : 0, successPercent: stops.length ? Math.round(delivered * 100 / stops.length) : 0 };
}

export function routeLocation(route, now = Date.now(),options={}) {
  const attendances = (route.stops || []).flatMap(stop => (stop.attendances || []).map(a => ({ ...a, outletName: stop.outlet?.name, source: 'ATTENDANCE', observedAt: a.timestamp })))
    .filter(a => Number.isFinite(a.latitude) && Number.isFinite(a.longitude)).sort((a, b) => new Date(b.observedAt) - new Date(a.observedAt));
  const live = route.position;
  const liveNewer = live && (!attendances[0] || new Date(live.observedAt) > new Date(attendances[0].observedAt));
  const location = liveNewer ? { ...live, source: 'GPS' } : attendances[0];
  if (!location) return null;
  const ageSeconds = Math.max(0, Math.floor((now - new Date(location.observedAt).getTime()) / 1000));
  return { ...location, ageSeconds, isLive: options.enabled!==false && location.source === 'GPS' && ageSeconds <= (options.liveSeconds||120) && !route.closedAt && !route.cancelledAt && !route.returnedAt };
}

export function scheduleWindow(route) {
  // Unscheduled legacy trips reserve the whole WIB day until explicitly rescheduled.
  const date = new Date(route.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  return { start: new Date(route.plannedStartAt || `${date}T00:00:00+07:00`), end: new Date(route.plannedEndAt || `${date}T23:59:59.999+07:00`) };
}
