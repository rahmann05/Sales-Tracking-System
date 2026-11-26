const dateKey = (value) =>
  new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 10);

/**
 * Collisions created by moving outlets between clusters / owners, judged against schedules that
 * already exist on other dates:
 * - future PJP stops that belong to a Sales other than the new owner;
 * - weekly templates that still belong to another Sales (they keep generating that Sales' PJP);
 * - the same outlet booked for two different Sales on the same date.
 */
export function clusterScheduleConflicts({
  stops = [],
  templates = [],
  destinationSalesId = null,
}) {
  const conflicts = [];
  const byOutletDate = new Map();
  for (const stop of stops) {
    const date = dateKey(stop.pjp.date);
    const key = `${stop.outletId}:${date}`;
    byOutletDate.set(key, new Set([...(byOutletDate.get(key) || []), stop.pjp.userId]));
    if (stop.pjp.userId !== destinationSalesId)
      conflicts.push({
        kind: 'OTHER_SALES_SCHEDULED',
        outletId: stop.outletId,
        outletName: stop.outletName || '',
        date,
        pjpCode: stop.pjp.code,
        salesName: stop.pjp.user?.name || '',
      });
  }
  for (const stop of stops) {
    const date = dateKey(stop.pjp.date);
    if ((byOutletDate.get(`${stop.outletId}:${date}`)?.size || 0) > 1)
      conflicts.push({
        kind: 'DOUBLE_BOOKED',
        outletId: stop.outletId,
        outletName: stop.outletName || '',
        date,
        pjpCode: stop.pjp.code,
        salesName: stop.pjp.user?.name || '',
      });
  }
  for (const t of templates)
    if (t.userId !== destinationSalesId)
      conflicts.push({
        kind: 'TEMPLATE_OTHER_SALES',
        outletId: t.outletId,
        outletName: t.outletName || '',
        dayOfWeek: t.dayOfWeek,
        weekType: t.weekType,
        salesName: t.salesName || '',
      });
  // One row per kind/outlet/date, so the same stop is never listed twice.
  const seen = new Set();
  return conflicts.filter((c) => {
    const key = [c.kind, c.outletId, c.date || '', c.dayOfWeek ?? '', c.weekType || ''].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
