import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { outletOperationalImpact } from './outlet-operational-impact.service.js';
import { reviewScope, reviewInclude } from './outlet-review-policy.service.js';
import { presentOutletRun } from './outlet-provider-content.service.js';
import { outletIssues } from '../../../../../shared/outlet-validation.mjs';
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).default(''),
  clusterId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).default('ACTIVE'),
  channel: z.enum(['GENERAL_TRADE', 'MODERN_TRADE']).optional(),
  quality: z
    .enum(['ALL', 'FLAGGED', 'MISSING_POINT', 'UNASSIGNED_CLUSTER', 'IN_REVIEW', 'VERIFIED'])
    .default('ALL'),
});
export async function outletDirectory(raw, actor) {
  const q = querySchema.parse(raw),
    where = await reviewScope(actor, prisma);
  if (q.status === 'ALL') delete where.deletedAt;
  if (q.status === 'INACTIVE') where.deletedAt = { not: null };
  if (q.clusterId) where.clusterId = q.clusterId;
  if (q.channel) where.channel = q.channel;
  if (q.quality === 'UNASSIGNED_CLUSTER') {
    where.cluster = { ...(where.cluster || {}), name: 'Belum Ditugaskan' };
  } else if (q.quality === 'IN_REVIEW') {
    where.reviews = { some: { status: { in: ['OPEN', 'WAITING_FIELD'] } } };
  } else if (q.quality === 'VERIFIED') {
    where.validationStatus = 'VALID';
  }
  if (q.search)
    where.OR = ['name', 'address', 'outletCode', 'ownerName', 'phone'].map((k) => ({
      [k]: { contains: q.search, mode: 'insensitive' },
    }));
  if (q.quality === 'FLAGGED' || q.quality === 'MISSING_POINT') {
    const candidates = await prisma.outlet.findMany({
      where,
      select: {
        id: true,
        name: true,
        googleLocation: true,
        phone: true,
        clusterId: true,
        address: true,
        latitude: true,
        longitude: true,
        source: true,
        locationEvidence: true,
        validationDetails: true,
      },
    });
    const matchedIds = candidates
      .filter((o) =>
        q.quality === 'MISSING_POINT'
          ? outletIssues(o).includes('MISSING_POINT')
          : outletIssues(o).length > 0
      )
      .map((o) => o.id);
    where.id = { in: matchedIds };
  }
  const [data, total] = await Promise.all([
    prisma.outlet.findMany({
      where,
      include: {
        cluster: {
          select: {
            id: true,
            name: true,
            region: true,
            supervisorId: true,
            supervisor: { select: { id: true, name: true } },
            assignedSales: { select: { id: true, name: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, status: true, reason: true, updatedAt: true },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: q.limit,
      skip: (q.page - 1) * q.limit,
    }),
    prisma.outlet.count({ where }),
  ]);
  return {
    data,
    pagination: {
      total,
      page: q.page,
      limit: q.limit,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
    },
  };
}
export async function outletProfile(id, actor) {
  const scope = await reviewScope(actor, prisma);
  delete scope.deletedAt;
  const [outlet, operational] = await Promise.all([
    prisma.outlet.findFirst({
      where: { id, ...scope },
      include: {
        cluster: {
          include: {
            supervisor: { select: { id: true, name: true } },
            assignedSales: { select: { id: true, name: true } },
          },
        },
        registration: true,
        reviews: { orderBy: { createdAt: 'desc' }, take: 20, include: reviewInclude },
        changes: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    }),
    outletOperationalImpact(prisma, id),
  ]);
  if (!outlet) throw new AppError('Outlet tidak ditemukan dalam cakupan Anda', 404);
  return {
    ...outlet,
    reviews: outlet.reviews.map((r) => ({ ...r, runs: r.runs.map(presentOutletRun) })),
    operational,
  };
}
