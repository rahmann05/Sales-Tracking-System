/**
 * Incident Mapper
 * Single Responsibility: Normalize server RouteChangeRequest & OutletUnlockRequest
 * payloads (Prisma shape) into the flat UI incident shape consumed by
 * Supervisor/Admin action-center views.
 */

import {routeChangeWorkflow} from '../../../shared/route-change-workflow.mjs';
const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', {timeZone:'Asia/Jakarta',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) + ' WIB'
    : '';

// Server RouteChangeRequest status/type → UI incident status
const mapRouteChangeStatus = (req) => {
  if (req.status === 'PENDING_APPROVAL') return routeChangeWorkflow(req).stage==='ADMIN'?'PENDING_ADMIN':'PENDING_SPV';
  if (req.status === 'ACKNOWLEDGED') return 'RESOLVED_SKIP';
  if (req.status === 'APPROVED' && req.type === 'SKIP') return 'RESOLVED_SKIP';
  if (req.status === 'APPROVED' && req.type === 'REROUTE') return 'RESOLVED_DIRECT_REROUTE';
  if (req.status === 'REJECTED') return 'REJECTED';
  return req.status || 'PENDING_SPV';
};

export const mapServerRouteChange = (req = {}) => ({
  canDecide:req.canDecide,
  workflow:req.workflow,decisionMode:routeChangeWorkflow(req).mode,
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
  maxVisits:req.maxVisits||0,usedVisits:req.usedVisits||0,remainingVisits:req.remainingVisits??null,
  kind:req.kind||'BOTH',
  id: req.id,
  type: 'UNLOCK_REQUEST',
  requestedBy: req.requestedBy,
  expiresAt: req.expiresAt,
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
