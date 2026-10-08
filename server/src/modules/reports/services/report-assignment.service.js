import { Prisma } from '@prisma/client';

export const REPORT_USER_SELECT = {
  id: true, name: true, email: true, role: true, supervisorId: true, clusterId: true,
  cluster: { select: { id: true, name: true, region: true } },
};

export function captureReportAssignment(user, source, now = new Date()) {
  return {
    reportingContext: {
      version: 1, userId: user.id, name: user.name,
      supervisorId: user.supervisorId || null, clusterId: user.clusterId || null,
      clusterName: user.cluster?.name || null, region: user.cluster?.region || null,
      source, capturedAt: now.toISOString(),
    },
    reportSupervisorId: user.supervisorId || null,
    reportClusterId: user.clusterId || null,
  };
}

// Snapshot membership is authoritative. A sales transfer must not expose the old
// plan to the new SPV. Legacy records retain current membership, explicitly flagged.
export function reportScopeWhere({ userId, supervisorId, clusterId } = {}) {
  const historical = {};
  const legacy = {};
  if (supervisorId) { historical.reportSupervisorId = supervisorId; legacy.supervisorId = supervisorId; }
  if (clusterId) { historical.reportClusterId = clusterId; legacy.clusterId = clusterId; }
  return {
    ...(userId ? { userId } : {}),
    ...(supervisorId || clusterId ? { OR: [
      { reportingContext: { not: Prisma.DbNull }, ...historical },
      { reportingContext: { equals: Prisma.DbNull }, user: legacy },
    ] } : {}),
  };
}

export function reportIdentity(record) {
  const context = record.reportingContext;
  if (context?.version === 1) return {
    id: record.userId || context.userId, name: context.name,
    supervisorId: context.supervisorId, clusterId: context.clusterId,
    cluster: context.clusterId ? { id: context.clusterId, name: context.clusterName, region: context.region } : null,
    historical: true,
  };
  return { ...record.user, id: record.userId || record.user?.id, historical: false };
}

export function mergeReportSales(currentSales, ...datasets) {
  const subjects = new Map(currentSales.map(user => [user.id, { ...user, assignments: [], historical: false }]));
  const records = datasets.flatMap(data => data.rawRecords || []);
  // Prefer the most recent captured identity within the requested/comparison period.
  records.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  for (const record of records) {
    const identity = reportIdentity(record);
    if (!identity.id) continue;
    const previous = subjects.get(identity.id);
    const assignment = { clusterId: identity.cluster?.id || null, clusterName: identity.cluster?.name || null,
      region: identity.cluster?.region || null, supervisorId: identity.supervisorId || null, historical: identity.historical };
    const assignments = [...(previous?.assignments || [])];
    if (!assignments.some(row => JSON.stringify(row) === JSON.stringify(assignment))) assignments.push(assignment);
    subjects.set(identity.id, { ...previous, ...identity, assignments });
  }
  return [...subjects.values()].map(user => {
    const clusters = new Set(user.assignments.map(row => JSON.stringify([row.clusterId, row.clusterName])));
    const regions = new Set(user.assignments.map(row => row.region));
    return { ...user, cluster: clusters.size > 1 ? { name: 'Beberapa penugasan pada periode', region: regions.size > 1 ? 'Beberapa wilayah pada periode' : user.cluster?.region } : user.cluster };
  }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id'));
}

export function assignmentReportBasis(...datasets) {
  const records = datasets.flatMap(data => data.rawRecords || []);
  const legacyAssignmentRecords = records.filter(row => row.reportingContext?.version !== 1).length;
  return {
    organization: 'CAPTURED_ASSIGNMENT_WITH_LEGACY_FALLBACK',
    capturedAssignmentRecords: records.length - legacyAssignmentRecords,
    legacyAssignmentRecords,
    note: 'Penugasan mengikuti konteks saat rencana PJP dibuat atau kunjungan luar PJP diajukan. Data lama tanpa konteks memakai tim dan identitas saat ini; penugasan historisnya belum terverifikasi. Sales aktif tanpa aktivitas tetap ditampilkan dari tim saat ini. Nilai order dapat berubah setelah keputusan approval.',
  };
}
