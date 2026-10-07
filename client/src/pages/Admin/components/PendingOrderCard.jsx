import React, { useState } from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import { OrderItemsTable } from './OrderItemsTable';
import '../../../styles/components/PendingOrderCard.css';

/**
 * PendingOrderCard Component (Single Responsibility: Order Card with SKU Breakdown for Admin)
 * 1 File per Component
 */
export const PendingOrderCard = ({ order, onDecision }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPending = order.status === 'PENDING_APPROVAL' || order.status === 'PENDING';

  const handleApprove = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onDecision({ orderId: order.id, approved: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onDecision({
        orderId: order.id,
        approved: false,
        rejectionReason: rejectReason || 'Ditolak oleh Admin',
      });
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
      <div className="poc-header">
        <div>
          <span className="poc-order-id">
            Order #{order.id}
          </span>
          <h4 className="poc-outlet-name">{order.outletName}</h4>
          <p className="poc-sales-info">
            Sales: <span className="poc-sales-name">{order.salesName}</span> • Syarat: {order.paymentType}
          </p>
        </div>

        <span
          className={`poc-status-badge ${
            order.status === 'APPROVED' ? 'approved' : order.status === 'REJECTED' ? 'rejected' : 'pending'
          }`}
        >
          {order.status}
        </span>
      </div>

      <p className="text-xs text-on-surface-variant px-4 pb-3">Persetujuan ini menilai order. Saldo piutang dan plafon kredit belum dikelola sebagai buku transaksi di aplikasi.</p>
      {order.rejectionReason && <p className="text-sm text-red-600 px-4 pb-3">Alasan penolakan: {order.rejectionReason}</p>}

      {/* Items Breakdown */}
      <OrderItemsTable items={order.items} totalAmount={order.totalAmount} />

      {/* Approval Buttons */}
      {isPending && (
        <div className="poc-actions-container">
          {!showRejectForm ? (
            <div className="poc-action-grid">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="poc-btn-approve"
              >
                <LuCheck className="text-base" />
                <span>{isSubmitting ? 'Memproses…' : 'Approve Order'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
                className="poc-btn-reject"
              >
                <LuX className="text-base" />
                <span>Reject Order</span>
              </button>
            </div>
          ) : (
            <div className="poc-reject-form">
              <label className="poc-reject-label">Alasan Penolakan Order Admin:</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Stok kosong / Data order tidak lengkap"
                className="poc-reject-input"
              />
              <div className="poc-reject-actions">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="poc-btn-confirm"
                >
                  {isSubmitting ? 'Menolak…' : 'Konfirmasi Reject'}
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
