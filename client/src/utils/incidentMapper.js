/**
 * Incident Mapper
 * Single Responsibility: Normalize server RouteChangeRequest & OutletUnlockRequest
 * payloads (Prisma shape) into the flat UI incident shape consumed by
 * Supervisor/Admin action-center views.
 */

const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    : '';

// Server RouteChangeRequest status/type → UI incident status
const mapRouteChangeStatus = (req) => {
  if (req.status === 'PENDING_APPROVAL') return 'PENDING_SPV';
  if (req.status === 'ACKNOWLEDGED') return 'RESOLVED_SKIP';
  if (req.status === 'APPROVED' && req.type === 'SKIP') return 'RESOLVED_SKIP';
  if (req.status === 'APPROVED' && req.type === 'REROUTE') return 'RESOLVED_DIRECT_REROUTE';
  if (req.status === 'REJECTED') return 'REJECTED';
  return req.status || 'PENDING_SPV';
};

export const mapServerRouteChange = (req = {}) => ({
  id: req.id,
  type: 'CLOSED_SHOP',
  stopId: req.pjpStopId,
  pjpId: req.pjpId,
  outletName: req.pjpStop?.outlet?.name || req.outletName || '',
  address: req.pjpStop?.outlet?.address || req.address || '',
  salesName: req.reportedByUser?.name || req.salesName || '',
  reason: req.reason || null,
  photoUrl: req.photoUrl || null,
  status: mapRouteChangeStatus(req),
  spvName: req.handledByUser?.name || req.approvedByUser?.name || null,
  newOutletName: req.replacementOutlet?.name || null,
  reportedAt: formatTime(req.createdAt),
});

export const mapServerUnlockRequest = (req = {}) => ({
  id: req.id,
  type: 'UNLOCK_REQUEST',
  stopId: req.outletId,
  outletId: req.outletId,
  outletName: req.outlet?.name || req.outletName || '',
  address: req.outlet?.address || req.address || '',
  userName: req.requestedByUser?.name || req.userName || '',
  userRole: req.requestedByUser?.role || req.userRole || 'SALES',
  reason: req.reason || '',
  status:
    req.status === 'PENDING_APPROVAL'
      ? 'PENDING'
      : req.status === 'APPROVED' || req.status === 'REJECTED'
      ? req.status
      : req.status || 'PENDING',
  requestedAt: formatTime(req.createdAt),
});