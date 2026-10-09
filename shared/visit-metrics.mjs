// One status definition for cards, PJP counters, and attendance reports.
export function visitState(stop) {
  if(stop.visitSession?.state==='INCOMPLETE')return 'EXCEPTION';
  if(stop.visitSession?.state==='FINISHED')return 'COMPLETED';
  const out = stop.attendances?.some(a => a.type === 'OUT');
  const entered = stop.attendances?.some(a => a.type === 'IN');
  if (out || stop.outTimestamp || stop.checkOutTime || ['VISITED', 'COMPLETED'].includes(stop.status)) return 'COMPLETED';
  if (['SKIPPED', 'CLOSED', 'CLOSED_REPORTED'].includes(stop.status)) return 'EXCEPTION';
  if (stop.visitSession?.state==='ACTIVE' || entered || stop.inTimestamp || stop.checkInTime || ['ARRIVED', 'IN_VISIT', 'ORDERED'].includes(stop.status)) return 'IN_PROGRESS';
  return 'PENDING';
}

export function summarizeVisits(stops = []) {
  const states = stops.map(visitState);
  const completed = states.filter(s => s === 'COMPLETED').length;
  const inProgress = states.filter(s => s === 'IN_PROGRESS').length;
  const pending = states.filter(s => s === 'PENDING').length;
  const exceptions = states.filter(s => s === 'EXCEPTION').length;
  return { total: stops.length, completed, inProgress, pending, exceptions,
    remaining: pending + inProgress, resolved: completed + exceptions,
    notCheckedIn: stops.filter(s => !s.inTimestamp && !s.checkInTime && !s.attendances?.some(a => a.type === 'IN') && !['COMPLETED', 'IN_PROGRESS'].includes(visitState(s))).length };
}

export function visitSalesResult(stop, options = {}) {
  const { manualSalesMode = 'NOTES_ONLY' } = options;
  const checkIn = stop.attendances?.find(a => a.type === 'IN');
  const checkOut = stop.attendances?.find(a => a.type === 'OUT');
  const salesEvidence=checkOut||stop.visitSession?.result;
  // Aturan bisnis: Hanya order yang sudah disetujui (APPROVED) yang masuk nominal dan SKU laporan.
  const hasRecordedOrder = (stop.orders || []).some(o => !o.deletedAt);
  const approvedOrders = (stop.orders || []).filter(o => o.status === 'APPROVED' && !o.deletedAt);
  
  // Hasil manual absensi: NOTES_ONLY (default) hanya sebagai catatan; REQUIRE_APPROVAL wajib disetujui.
  const allowManual = !hasRecordedOrder && (
    (salesEvidence?.manualSalesMode ?? manualSalesMode) === 'REQUIRE_APPROVAL' && Boolean(salesEvidence?.isManualSalesApproved)
  );

  const orderAmount = approvedOrders.length > 0
    ? approvedOrders.reduce((sum, o) => sum + Number(o.totalValue), 0)
    : (allowManual ? Number(salesEvidence?.orderAmount || 0) : 0);

  const skuSold = approvedOrders.length > 0
    ? new Set(approvedOrders.flatMap(o => (o.items || []).map(i => i.productId))).size
    : (allowManual ? Number(salesEvidence?.skuSold || 0) : 0);

  const actual = Boolean(checkIn || checkOut) || visitState(stop) === 'COMPLETED';
  return {
    checkIn,
    checkOut,
    actual,
    orderAmount,
    skuSold,
    effective: actual && Boolean(orderAmount > 0 || skuSold > 0),
  };
}

export const wibDateKey = (date = new Date()) => new Date(new Date(date).getTime() + 7 * 3600000).toISOString().slice(0, 10);
export const wibDayRange = (date = new Date()) => {
  const key = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : wibDateKey(date);
  return { gte: new Date(`${key}T00:00:00+07:00`), lte: new Date(`${key}T23:59:59.999+07:00`) };
};

// Visit validation and manual transaction approval are independent decisions.
export function offPjpSalesResult(record, options = {}) {
  const actual = record.status === 'APPROVED';
  const approved = actual && (record.manualSalesMode ?? options.manualSalesMode ?? 'NOTES_ONLY') === 'REQUIRE_APPROVAL' && record.isManualSalesApproved;
  const orderAmount = approved ? Number(record.orderAmount || 0) : 0;
  const skuSold = approved ? Number(record.skuSold || 0) : 0;
  return { actual, orderAmount, skuSold, effective: actual && (orderAmount > 0 || skuSold > 0) };
}
