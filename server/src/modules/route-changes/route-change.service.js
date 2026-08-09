import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { createNotification, createBulkNotificationByRoles } from '../notifications/notifications.service.js';
import { ROLES, ROUTE_CHANGE_TYPE, ROUTE_CHANGE_STATUS, VISIT_STATUS, NOTIFICATION_TYPES } from '../../utils/constants.js';

/**
 * Step 1 - Sales reports a closed outlet.
 * Type is NOT set yet (Sales doesn't decide REROUTE vs SKIP).
 * Status = PENDING_APPROVAL (waiting for Supervisor action).
 * The RouteChangeType field defaults to SKIP as DB requires a value,
 * but will be overwritten when Supervisor acts.
 */
export const reportClosedOutlet = async (salesId, pjpStopId, reason = null, photoUrl = null) => {
  const stop = await prisma.pjpStop.findUnique({
    where: { id: pjpStopId },
    include: { pjp: true, outlet: true },
  });

  if (!stop) throw new AppError('Stop PJP tidak ditemukan', 404);
  if (stop.pjp.userId !== salesId) {
    throw new AppError('Anda hanya dapat melaporkan outlet tutup pada PJP Anda sendiri', 403);
  }

  // Check if there's already an open/pending request for this stop
  const existingRequest = await prisma.routeChangeRequest.findFirst({
    where: { pjpStopId, status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL },
  });
  if (existingRequest) {
    throw new AppError('Sudah ada laporan outlet tutup yang sedang menunggu tindakan Supervisor', 409);
  }

  // Update stop status to CLOSED_REPORTED
  await prisma.pjpStop.update({
    where: { id: pjpStopId },
    data: { status: VISIT_STATUS.CLOSED_REPORTED },
  });

  // Create request — type is SKIP as placeholder until Supervisor decides
  const request = await prisma.routeChangeRequest.create({
    data: {
      pjpId: stop.pjpId,
      pjpStopId,
      type: ROUTE_CHANGE_TYPE.SKIP,
      reportedBy: salesId,
      reason,
      photoUrl,
      status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL,
    },
    include: { pjpStop: { include: { outlet: true } } },
  });

  await createBulkNotificationByRoles(
    [ROLES.SUPERVISOR],
    NOTIFICATION_TYPES.ROUTE_CHANGE_REPORTED,
    'Laporan Outlet Tutup',
    `Sales melaporkan outlet "${stop.outlet.name}" tutup. Pilih tindakan: Reroute atau Skip.`,
    { routeChangeRequestId: request.id }
  );

  return request;
};

/**
 * Step 2a - Supervisor submits reroute (needs Manager approval).
 */
export const submitReroute = async (supervisorId, requestId, replacementOutletId) => {
  const request = await prisma.routeChangeRequest.findUnique({
    where: { id: requestId },
    include: { pjpStop: { include: { outlet: true } } },
  });

  if (!request) throw new AppError('Request perubahan rute tidak ditemukan', 404);
  if (request.status !== 'PENDING_APPROVAL') {
    throw new AppError(`Request sudah diproses sebelumnya (Status: ${request.status})`, 409);
  }

  const replacementOutlet = await prisma.outlet.findUnique({ where: { id: replacementOutletId } });
  if (!replacementOutlet || replacementOutlet.deletedAt) {
    throw new AppError('Outlet pengganti tidak ditemukan', 404);
  }

  const updatedRequest = await prisma.routeChangeRequest.update({
    where: { id: requestId },
    data: {
      type: ROUTE_CHANGE_TYPE.REROUTE,
      handledBy: supervisorId,
      replacementOutletId,
      status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL,
    },
    include: { replacementOutlet: true },
  });

  await createBulkNotificationByRoles(
    [ROLES.MANAJER_OPERASIONAL],
    NOTIFICATION_TYPES.REROUTE_APPROVAL_REQUIRED,
    'Permintaan Approval Reroute',
    `Supervisor mengajukan pengalihan rute dari outlet "${request.pjpStop.outlet.name}" ke "${replacementOutlet.name}". Perlu persetujuan Anda.`,
    { routeChangeRequestId: updatedRequest.id }
  );

  return updatedRequest;
};

/**
 * Step 2b - Supervisor chooses SKIP. No manager approval needed.
 */
export const submitSkip = async (supervisorId, requestId) => {
  const request = await prisma.routeChangeRequest.findUnique({
    where: { id: requestId },
    include: { pjpStop: { include: { outlet: true } } },
  });

  if (!request) throw new AppError('Request perubahan rute tidak ditemukan', 404);
  if (request.status !== ROUTE_CHANGE_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Request sudah diproses sebelumnya (Status: ${request.status})`, 409);
  }

  const [updatedRequest] = await prisma.$transaction([
    prisma.routeChangeRequest.update({
      where: { id: requestId },
      data: { type: ROUTE_CHANGE_TYPE.SKIP, handledBy: supervisorId, status: ROUTE_CHANGE_STATUS.ACKNOWLEDGED },
      include: { pjpStop: { include: { outlet: true } } },
    }),
    prisma.pjpStop.update({
      where: { id: request.pjpStopId },
      data: { status: VISIT_STATUS.SKIPPED },
    }),
  ]);

  await createBulkNotificationByRoles(
    [ROLES.MANAJER_OPERASIONAL],
    NOTIFICATION_TYPES.SKIP_OUTLET_INFO,
    'Informasi Skip Outlet',
    `Supervisor menginstruksikan skip outlet "${request.pjpStop.outlet.name}" (tanpa approval).`,
    { routeChangeRequestId: updatedRequest.id }
  );

  await createNotification(
    request.reportedBy,
    NOTIFICATION_TYPES.ROUTE_SKIP_ACKNOWLEDGED,
    'Outlet Dilewati',
    `Outlet "${request.pjpStop.outlet.name}" resmi dilewati oleh Supervisor.`,
    { routeChangeRequestId: updatedRequest.id }
  );

  return updatedRequest;
};

/**
 * Step 3 - Manager approves REROUTE. New stop is added to PJP.
 */
export const approveReroute = async (managerId, requestId) => {
  const request = await prisma.routeChangeRequest.findUnique({
    where: { id: requestId },
    include: {
      pjp: { include: { stops: true } },
      pjpStop: true,
      replacementOutlet: true,
    },
  });

  if (!request) throw new AppError('Request perubahan rute tidak ditemukan', 404);
  if (request.type !== ROUTE_CHANGE_TYPE.REROUTE) throw new AppError('Hanya tipe REROUTE yang memerlukan approval', 400);
  if (request.status !== ROUTE_CHANGE_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Request sudah diproses sebelumnya (Status: ${request.status})`, 409);
  }

  const maxSeq = Math.max(...request.pjp.stops.map((s) => s.sequence), 0);

  const [updatedRequest, newPjpStop] = await prisma.$transaction([
    prisma.routeChangeRequest.update({
      where: { id: requestId },
      data: { status: ROUTE_CHANGE_STATUS.APPROVED, approvedBy: managerId },
    }),
    prisma.pjpStop.create({
      data: {
        pjpId: request.pjpId,
        outletId: request.replacementOutletId,
        sequence: maxSeq + 1,
        status: 'PENDING',
      },
      include: { outlet: true },
    }),
  ]);

  await createNotification(
    request.reportedBy,
    NOTIFICATION_TYPES.REROUTE_APPROVED,
    'Perubahan Rute Disetujui',
    `Reroute ke outlet "${request.replacementOutlet.name}" disetujui dan ditambahkan ke rute Anda.`,
    { pjpId: request.pjpId }
  );

  return { routeChangeRequest: updatedRequest, createdPjpStop: newPjpStop };
};

/**
 * Step 3 alt - Manager rejects REROUTE.
 */
export const rejectReroute = async (managerId, requestId) => {
  const request = await prisma.routeChangeRequest.findUnique({
    where: { id: requestId },
    include: { pjpStop: { include: { outlet: true } } },
  });

  if (!request) throw new AppError('Request perubahan rute tidak ditemukan', 404);
  if (request.status !== ROUTE_CHANGE_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Request sudah diproses sebelumnya (Status: ${request.status})`, 409);
  }

  const updatedRequest = await prisma.routeChangeRequest.update({
    where: { id: requestId },
    data: { status: ROUTE_CHANGE_STATUS.REJECTED, approvedBy: managerId },
  });

  await createNotification(
    request.reportedBy,
    NOTIFICATION_TYPES.REROUTE_REJECTED,
    'Perubahan Rute Ditolak',
    `Permintaan reroute untuk outlet "${request.pjpStop.outlet.name}" ditolak oleh Manajer Operasional.`,
    { pjpId: request.pjpId }
  );

  return updatedRequest;
};

export const getRouteChanges = async (query = {}) => {
  const { status, type, page = 1, limit = 20 } = query;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [data, total] = await Promise.all([
    prisma.routeChangeRequest.findMany({
      where,
      include: {
        pjpStop: { include: { outlet: true } },
        replacementOutlet: true,
        reportedByUser: { select: { id: true, name: true, role: true } },
        handledByUser: { select: { id: true, name: true, role: true } },
        approvedByUser: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.routeChangeRequest.count({ where }),
  ]);

  return { data, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / take) } };
};
