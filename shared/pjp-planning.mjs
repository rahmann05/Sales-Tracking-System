const DAY = 86400000;
export const validPlanDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export function planDates(start, end, maxDays = 62) {
  if (!validPlanDate(start) || !validPlanDate(end)) throw new Error('Tanggal rencana tidak valid');
  const count = Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1;
  if (count < 1 || count > maxDays) throw new Error(`Periode rencana harus 1–${maxDays} hari`);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.parse(start) + i * DAY).toISOString().slice(0, 10)
  );
}
export const frequencyWeeks = (code) => ({ F1: 1, F2: 2, F4: 4 })[code] || null;
export const allowedVisitIntervals = (values) =>
  String(values?.PJP_ALLOWED_INTERVALS || '1,2,4')
    .split(',')
    .map(Number)
    .filter((n) => [1, 2, 4].includes(n));
export const ruleDue = (rule, date) =>
  validPlanDate(rule.anchorDate) &&
  Date.parse(date) >= Date.parse(rule.anchorDate) &&
  Math.round((Date.parse(date) - Date.parse(rule.anchorDate)) / DAY) %
    (Number(rule.intervalWeeks) * 7) ===
    0;
export const ruleSalesAt = (rule, date) =>
  rule.substitute && date >= rule.substitute.startsOn && date <= rule.substitute.endsOn
    ? rule.substitute.userId
    : rule.userId;
export function buildPlanCalendar(
  { startsOn, endsOn, rules },
  sales,
  outlets,
  workingDays = [1, 2, 3, 4, 5, 6],
  policy = {}
) {
  const dates = planDates(startsOn, endsOn, policy.PJP_MAX_PLAN_DAYS || 62),
    people = new Map(sales.map((s) => [s.id, s])),
    shops = new Map(outlets.map((o) => [o.id, o])),
    problems = [],
    days = [];
  const add = (code, message, extra = {}) => problems.push({ code, message, ...extra });
  const warnings = [],
    isWorking = (date) =>
      policy.workingDates
        ? policy.workingDates.includes(date)
        : workingDays.includes(new Date(date).getUTCDay());
  rules.forEach((r, index) => {
    const person = people.get(r.userId),
      outlet = shops.get(r.outletId);
    if (!person) add('SALES_UNAVAILABLE', `Aturan ${index + 1}: Sales tidak tersedia dalam tim.`);
    if (!outlet)
      add('OUTLET_UNAVAILABLE', `Aturan ${index + 1}: outlet tidak tersedia dalam wilayah tim.`);
    if (!validPlanDate(r.anchorDate) || ![1, 2, 4].includes(Number(r.intervalWeeks)))
      add('INVALID_RULE', `Aturan ${index + 1}: tanggal acuan atau interval tidak valid.`);
    if (!allowedVisitIntervals(policy).includes(Number(r.intervalWeeks)))
      add(
        'INTERVAL_DISABLED',
        `${outlet?.name || 'Outlet'}: interval F${r.intervalWeeks} dinonaktifkan oleh Admin.`
      );
    if (validPlanDate(r.anchorDate) && !policy.workingDates && !isWorking(r.anchorDate))
      add('NON_WORKING_DAY', `${outlet?.name || 'Outlet'}: tanggal acuan bukan hari kerja.`);
    if (person && outlet?.cluster?.supervisorId !== person.supervisorId)
      add('TEAM_MISMATCH', `${outlet?.name || 'Outlet'} berada di luar tim Sales.`);
    if (r.substitute) {
      const s = r.substitute,
        target = people.get(s.userId);
      if (
        policy.PJP_ALLOW_TEMPORARY_SUBSTITUTION !== true ||
        policy.PJP_ALLOW_OWNER_OVERRIDE === false
      )
        add(
          'SUBSTITUTION_DISABLED',
          `${outlet?.name || 'Outlet'}: pengganti sementara dinonaktifkan oleh Admin.`
        );
      if (!target || target.supervisorId !== person?.supervisorId || target.id === r.userId)
        add(
          'SUBSTITUTE_UNAVAILABLE',
          `${outlet?.name || 'Outlet'}: pilih Sales pengganti aktif yang berbeda dalam tim yang sama.`
        );
      if (
        !validPlanDate(s.startsOn) ||
        !validPlanDate(s.endsOn) ||
        s.startsOn > s.endsOn ||
        s.startsOn < startsOn ||
        s.endsOn > endsOn
      )
        add(
          'SUBSTITUTE_PERIOD',
          `${outlet?.name || 'Outlet'}: periode pengganti harus berada dalam periode rencana.`
        );
      if (!s.reason?.trim() || s.reason.trim().length < 5)
        add(
          'SUBSTITUTE_REASON',
          `${outlet?.name || 'Outlet'}: alasan pengganti minimal 5 karakter wajib diisi.`
        );
      if (
        !dates.some(
          (date) => date >= s.startsOn && date <= s.endsOn && ruleDue(r, date) && isWorking(date)
        )
      )
        warnings.push({
          code: 'SUBSTITUTE_NOT_DUE',
          message: `${outlet?.name || 'Outlet'}: tidak ada kunjungan jatuh tempo dalam periode pengganti.`,
        });
    }
    if (
      policy.PJP_ALLOW_OWNER_OVERRIDE === false &&
      outlet?.cluster?.assignedSalesId &&
      outlet.cluster.assignedSalesId !== r.userId
    )
      add('OWNER_OVERRIDE_DISABLED', `${outlet.name}: penggantian Sales dinonaktifkan.`);
    if (
      policy.PJP_ALLOW_FREQUENCY_OVERRIDE === false &&
      frequencyWeeks(outlet?.itineraryCode) &&
      frequencyWeeks(outlet.itineraryCode) !== Number(r.intervalWeeks)
    )
      add('FREQUENCY_OVERRIDE_DISABLED', `${outlet.name}: perubahan interval dinonaktifkan.`);
    if (
      outlet?.cluster?.assignedSalesId &&
      outlet.cluster.assignedSalesId !== r.userId &&
      !r.reason?.trim()
    )
      add('OWNER_REASON', `${outlet.name}: isi alasan penugasan ke Sales pengganti.`);
    if (
      frequencyWeeks(outlet?.itineraryCode) &&
      frequencyWeeks(outlet.itineraryCode) !== Number(r.intervalWeeks) &&
      !r.reason?.trim()
    )
      add(
        'FREQUENCY_REASON',
        `${outlet.name}: isi alasan perubahan interval dari ${outlet.itineraryCode}.`
      );
  });
  for (const date of dates) {
    if (!isWorking(date)) {
      const due = rules.filter((r) => ruleDue(r, date));
      if (due.length) {
        const issue = {
          code: 'HOLIDAY_VISIT',
          date,
          message: `${due.length} kunjungan jatuh pada hari libur ${date}. Interval tetap mengikuti tanggal acuan.`,
        };
        (policy.PJP_HOLIDAY_POLICY === 'BLOCK' ? problems : warnings).push(issue);
      }
      continue;
    }
    const seen = new Map();
    for (const person of sales) {
      const ids = rules
        .filter((r) => ruleSalesAt(r, date) === person.id && ruleDue(r, date))
        .map((r) => r.outletId);
      for (const id of ids) {
        if (seen.has(id))
          add(
            'DUPLICATE_VISIT',
            `${shops.get(id)?.name || id} dijadwalkan lebih dari sekali pada ${date}.`,
            { date, outletId: id }
          );
        seen.set(id, person.id);
      }
      days.push({
        date,
        userId: person.id,
        salesName: person.name,
        outletIds: ids,
        state: ids.length
          ? 'SCHEDULED'
          : rules.some((r) => ruleSalesAt(r, date) === person.id)
            ? 'NOT_DUE'
            : 'UNPLANNED',
      });
    }
  }
  const covered = new Set(rules.map((r) => r.outletId));
  const uncovered = outlets.filter((o) => !covered.has(o.id));
  warnings.push(
    ...rules.flatMap((r) => {
      const o = shops.get(r.outletId),
        standard = frequencyWeeks(o?.itineraryCode);
      return standard && standard !== Number(r.intervalWeeks)
        ? [
            {
              code: 'FREQUENCY_OVERRIDE',
              message: `${o.name}: interval rencana ${r.intervalWeeks} minggu berbeda dari ${o.itineraryCode}.`,
            },
          ]
        : [];
    })
  );
  for (const day of days)
    if (day.outletIds.length > (policy.PJP_MAX_VISITS_PER_DAY || 50)) {
      const issue = {
        code: 'OVERLOAD',
        message: `${day.salesName}: ${day.outletIds.length} outlet pada ${day.date} melebihi batas harian.`,
      };
      (policy.PJP_OVERLOAD_POLICY === 'BLOCK' ? problems : warnings).push(issue);
    }
  return {
    days,
    problems,
    warnings,
    uncovered: uncovered.map((o) => ({ id: o.id, name: o.name, clusterName: o.cluster?.name })),
    summary: {
      visits: days.reduce((n, d) => n + d.outletIds.length, 0),
      sales: sales.length,
      covered: covered.size,
      uncovered: uncovered.length,
      workingDates: new Set(days.map((d) => d.date)).size,
    },
  };
}

const WEEKDAY_MAP = {
  minggu: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
};

/**
 * Extract Indonesian weekday index (0..6) from cluster titles like "Cahya - Senin".
 * Returns null when the cluster name is not bound to a specific day.
 */
export function clusterWeekdayNumber(clusterName = '') {
  const match = String(clusterName || '').match(
    /(?:^|[^a-z])(minggu|senin|selasa|rabu|kamis|jum'?at|sabtu)(?=$|[^a-z])/i
  );
  return match ? (WEEKDAY_MAP[match[1].toLowerCase()] ?? null) : null;
}

/**
 * Choose default Supervisor team for the planner so Admin immediately sees active Sales.
 */
export function pickDefaultSupervisorId(user, supervisors = [], sales = []) {
  if (user?.role === 'SUPERVISOR') return user.id || '';
  return (
    supervisors.find((spv) => sales.some((s) => s.supervisorId === spv.id))?.id ||
    supervisors[0]?.id ||
    ''
  );
}

/**
 * Resolve the nearest valid working anchor date >= startsOn (optionally matching preferredDayOfWeek).
 */
export function firstWorkingAnchorDate(
  startsOn,
  workingDays = [1, 2, 3, 4, 5, 6],
  preferredDayOfWeek = null
) {
  if (!validPlanDate(startsOn)) return startsOn;
  const startMs = Date.parse(`${startsOn}T00:00:00Z`);
  const startDay = new Date(startMs).getUTCDay();
  const validDays = Array.isArray(workingDays) ? workingDays : [];
  if (preferredDayOfWeek != null && (!validDays.length || validDays.includes(preferredDayOfWeek))) {
    const offset = (preferredDayOfWeek - startDay + 7) % 7;
    return new Date(startMs + offset * DAY).toISOString().slice(0, 10);
  }
  if (validDays.length && !validDays.includes(startDay)) {
    for (let offset = 1; offset < 7; offset++) {
      if (validDays.includes((startDay + offset) % 7))
        return new Date(startMs + offset * DAY).toISOString().slice(0, 10);
    }
  }
  return startsOn;
}

/**
 * Build draft PJP rules directly from active clusters assigned to a Sales representative,
 * ordering outlets by active ClusterRoute.outletOrder and preserving frequency/working-day rules.
 */
export function buildClusterDraftRules({
  person,
  shops = [],
  existingOutletIds = [],
  startsOn,
  workingDays = [1, 2, 3, 4, 5, 6],
  allowedIntervals = [1, 2, 4],
  defaultInterval = 1,
}) {
  if (!person || !validPlanDate(startsOn)) return [];
  const existing = new Set(existingOutletIds);
  const clusterOrder = [];
  const routeOrderByCluster = new Map();
  const registerCluster = (c) => {
    if (!c?.id) return;
    if (!clusterOrder.includes(c.id)) clusterOrder.push(c.id);
    const routeOrder = c.routes?.[0]?.outletOrder;
    if (Array.isArray(routeOrder) && !routeOrderByCluster.has(c.id)) {
      routeOrderByCluster.set(
        c.id,
        routeOrder.map((o) => (typeof o === 'string' ? o : o?.id)).filter(Boolean)
      );
    }
  };
  for (const c of person.assignedClusters || []) registerCluster(c);
  if (person.cluster?.id || person.clusterId) {
    registerCluster({ id: person.cluster?.id || person.clusterId, ...person.cluster });
  }
  const assignedIds = new Set(clusterOrder);
  const matching = shops.filter(
    (o) =>
      !existing.has(o.id) &&
      (o.cluster?.assignedSalesId === person.id || assignedIds.has(o.clusterId))
  );
  const grouped = new Map();
  for (const outlet of matching) {
    const cid = outlet.clusterId || '__none__';
    if (!grouped.has(cid)) grouped.set(cid, []);
    grouped.get(cid).push(outlet);
  }
  const orderedOutlets = [];
  const consumedClusters = new Set();
  const pushClusterGroup = (cid) => {
    if (consumedClusters.has(cid)) return;
    consumedClusters.add(cid);
    const list = grouped.get(cid) || [];
    const routeOrder = routeOrderByCluster.get(cid);
    if (!routeOrder?.length) {
      orderedOutlets.push(...list);
      return;
    }
    const rank = new Map(routeOrder.map((id, idx) => [id, idx]));
    orderedOutlets.push(
      ...[...list].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
    );
  };
  for (const cid of clusterOrder) pushClusterGroup(cid);
  for (const cid of grouped.keys()) pushClusterGroup(cid);

  return orderedOutlets.map((o) => {
    const preferredDay = clusterWeekdayNumber(o.cluster?.name);
    const anchorDate = firstWorkingAnchorDate(startsOn, workingDays, preferredDay);
    const rawInterval = frequencyWeeks(o.itineraryCode) || defaultInterval;
    const intervalWeeks = allowedIntervals.includes(rawInterval)
      ? rawInterval
      : allowedIntervals[0] || defaultInterval;
    return {
      userId: person.id,
      outletId: o.id,
      anchorDate,
      intervalWeeks,
      reason: '',
    };
  });
}

/**
 * Resolve fallback PJP outlets across a Sales rep's active Cluster.assignedSalesId clusters
 * (plus primary clusterId), respecting weekday-named clusters and active ClusterRoute sequences.
 */
export function selectFallbackClusterOutlets(clusters = [], primaryClusterId = null, dateKey = '') {
  if (!clusters.length) return { primaryCluster: null, outletIds: [] };
  const ordered = [
    ...clusters.filter((c) => c.id === primaryClusterId),
    ...clusters.filter((c) => c.id !== primaryClusterId),
  ];
  const dayOfWeek = validPlanDate(dateKey) ? new Date(`${dateKey}T12:00:00Z`).getUTCDay() : null;
  const hasWeekdayClusters = ordered.some((c) => clusterWeekdayNumber(c.name) !== null);
  const selectedClusters =
    hasWeekdayClusters && dayOfWeek !== null
      ? ordered.filter((c) => {
          const wd = clusterWeekdayNumber(c.name);
          return wd === null || wd === dayOfWeek;
        })
      : ordered;
  const outletIds = [];
  const seen = new Set();
  for (const cluster of selectedClusters) {
    const outlets = cluster.outlets || [];
    const validIds = new Set(outlets.map((o) => o.id));
    const activeRoute = cluster.routes?.[0] || null;
    const routeIds = activeRoute
      ? (activeRoute.outletOrder || [])
          .map((o) => (typeof o === 'string' ? o : o?.id))
          .filter((id) => validIds.has(id))
      : [];
    const routeSet = new Set(routeIds);
    const clusterIds =
      activeRoute && routeIds.length
        ? [...routeIds, ...outlets.map((o) => o.id).filter((id) => !routeSet.has(id))]
        : outlets.map((o) => o.id);
    for (const id of clusterIds) {
      if (!seen.has(id)) {
        seen.add(id);
        outletIds.push(id);
      }
    }
  }
  return {
    primaryCluster: selectedClusters[0] || ordered[0] || null,
    outletIds,
  };
}
