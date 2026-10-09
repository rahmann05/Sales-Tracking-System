import {orderReviewRole,reviewRoleAllowed} from '../../../../../shared/approval-workflow.mjs';
import React, { useEffect,useState } from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import { OrderItemsTable } from './OrderItemsTable';
import '../../../styles/components/PendingOrderCard.css';
import {useApp} from '../../../context/AppContext';
import {OrderReviewAssignmentEditor} from '../../../shared/components/common/OrderReviewAssignmentEditor';
import {OrderApprovalBasis} from '../../../shared/components/common/OrderApprovalBasis';

/**
 * PendingOrderCard Component (Single Responsibility: Order Card with SKU Breakdown for Admin)
 * 1 File per Component
 */
export const PendingOrderCard = ({ order, onDecision }) => {
  const {user,settings}=useApp();
  const required=orderReviewRole(order,settings),mode=order.policySnapshot?.values?.ORDER_APPROVAL_MODE||settings.ORDER_APPROVAL_MODE;
  const stageBlocked=!reviewRoleAllowed(required,user?.role);
  const assignment=order.approvalAssignment;
  const assignedElsewhere=assignment?.ownerId&&assignment.ownerId!==user?.id&&(mode!=='SEQUENTIAL'||reviewRoleAllowed(required,assignment.ownerRole));
  const blocked=stageBlocked||Boolean(assignedElsewhere&&user?.role!=='ADMIN')||user?.permissions?.can_approve_order===false||user?.role==='SUPERVISOR'&&assignment?.ownerValid===false;
  const [overrideReason,setOverrideReason]=useState(''),[error,setError]=useState('');
  const needsOverride=Boolean(assignedElsewhere&&user?.role==='ADMIN');
  const decisionDisabled=blocked||needsOverride&&overrideReason.trim().length<5;
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(()=>{setOverrideReason('');setError('');setShowRejectForm(false);},[assignment?.revision]);

  const isPending = order.status === 'PENDING_APPROVAL' || order.status === 'PENDING';

  const handleApprove = async () => {
    if (isSubmitting||decisionDisabled) return;
    setIsSubmitting(true);
    setError('');
    try {
      const result=await onDecision({ orderId: order.id, approved: true,assignmentRevision:assignment?.revision||0,overrideReason });
      if(result===false)setError('Keputusan belum tersimpan. Muat ulang order dan periksa penugasan terbaru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (isSubmitting||decisionDisabled||!rejectReason.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const result=await onDecision({
        orderId: order.id,
        approved: false,
        rejectionReason: rejectReason.trim(),assignmentRevision:assignment?.revision||0,overrideReason,
      });
      if(result===false)setError('Keputusan belum tersimpan. Muat ulang order dan periksa penugasan terbaru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`pending-order-card ${
        order.status === 'APPROVED' ? 'approved' : order.status === 'REJECTED' ? 'rejected' : 'pending'
      }`}
    >
      <div className="poc-content"><div className="poc-header">
        <div>
          <span className="poc-order-id">
            Order {order.code || 'nomor lama belum tersedia'}
          </span>
          <h4 className="poc-outlet-name">{order.outletName}</h4>
          <p className="poc-sales-info">
            Sales: <span className="poc-sales-name">{order.salesName}</span> • Syarat: {{CREDIT:'Tempo',TOP:'Tempo',CASH:'Tunai',TRANSFER:'Transfer'}[order.paymentType]||order.paymentType||'Belum dicatat'}
          </p>
        </div>

        <span
          className={`poc-status-badge ${
            order.status === 'APPROVED' ? 'approved' : order.status === 'REJECTED' ? 'rejected' : 'pending'
          }`}
        >
          {{PENDING_APPROVAL:'Menunggu',PENDING:'Menunggu',APPROVED:'Disetujui',REJECTED:'Ditolak'}[order.status]||order.status}
        </span>
      </div>

      <p className="text-xs text-on-surface-variant px-4 pb-3">Periksa barang, jumlah, harga, pajak, dan syarat order sebelum memutuskan.</p>
      {order.rejectionReason && <p className="text-sm text-red-600 px-4 pb-3">Alasan penolakan: {order.rejectionReason}</p>}

      {/* Items Breakdown */}
      <OrderApprovalBasis order={order}/>
      <OrderItemsTable items={order.items} totalAmount={order.totalAmount} />
      <div className="px-4 pb-3 text-sm space-y-1"><p>Termin: {order.termOfPaymentDays==null?'Belum tercatat':`${order.termOfPaymentDays} hari`}</p><p>Pajak: {order.taxAmount==null?'Belum tercatat':`Rp ${order.taxAmount.toLocaleString('id-ID')} (${order.taxRatePercent}%${order.taxIncluded==null?'':order.taxIncluded?', termasuk harga':', ditambahkan'})`}</p>{order.fulfillmentStatus&&<p>Pemenuhan: {{OPEN:'Belum terpenuhi',PARTIAL:'Terpenuhi sebagian',FULFILLED:'Terpenuhi',CLOSED_WITH_CANCELLATION:'Ditutup dengan pembatalan'}[order.fulfillmentStatus]||order.fulfillmentStatus} · Janji kirim: {order.promisedAt?new Date(order.promisedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Belum ditetapkan'}</p>}</div>

      {/* Approval Buttons */}
      {assignment&&<div className="px-4 pb-3 text-sm"><p>Pemeriksa: {assignment.ownerName||'Tanggung jawab tim'} · Versi {assignment.revision}</p>{assignment.dueAt&&<p>Tenggat pemeriksaan: {new Date(assignment.dueAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</p>}{assignment.ownerValid===false&&<p role="alert">Pemeriksa sudah tidak memenuhi syarat. Admin perlu mengalihkan atau mengambil alih dengan alasan.</p>}</div>}
      {!isPending&&assignment&&<div className="px-4 pb-3"><OrderReviewAssignmentEditor orderId={order.id} readOnly/></div>}
      {isPending&&<div className="px-4 pb-3 space-y-2"><p>Tahap pemeriksaan: {required==='BOTH'?'Admin atau Supervisor':required==='ADMIN'?'Admin':required==='SUPERVISOR'?'Supervisor':'Tanpa pemeriksaan manusia'}</p><OrderReviewAssignmentEditor orderId={order.id}/>{blocked&&<p>Keputusan tidak tersedia: periksa izin atau minta Admin mengalihkan pemeriksa.</p>}{needsOverride&&<label className="block text-sm">Alasan pengambilalihan Admin<textarea className="form-input block w-full" minLength={5} maxLength={2000} value={overrideReason} onChange={event=>setOverrideReason(event.target.value)} disabled={isSubmitting}/></label>}{error&&<p role="alert" className="text-red-600">{error}</p>}</div>}
      </div>{isPending && (
        <div className="poc-actions-container">
          {!showRejectForm ? (
            <div className="poc-action-grid">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting||decisionDisabled}
                className="poc-btn-approve"
              >
                <LuCheck className="text-base" />
                <span>{isSubmitting ? 'Memproses…' : mode==='SEQUENTIAL'&&required==='SUPERVISOR'?'Teruskan ke Admin':'Setujui order'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting||decisionDisabled}
                className="poc-btn-reject"
              >
                <LuX className="text-base" />
                <span>Tolak order</span>
              </button>
            </div>
          ) : (
            <div className="poc-reject-form">
              <label className="poc-reject-label" htmlFor={`reject-${order.id}`}>Alasan penolakan order:</label>
              <input
                id={`reject-${order.id}`}
                type="text"
                maxLength={2000}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Data order tidak lengkap / Pelanggan membatalkan"
                className="poc-reject-input"
              />
              <div className="poc-reject-actions">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isSubmitting||decisionDisabled||!rejectReason.trim()}
                  className="poc-btn-confirm"
                >
                  {isSubmitting ? 'Menolak…' : 'Konfirmasi penolakan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  disabled={isSubmitting}
                  className="poc-btn-cancel"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
