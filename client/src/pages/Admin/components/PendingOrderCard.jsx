import React, { useState } from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';
import { OrderItemsTable } from './OrderItemsTable';
import '../../../styles/components/PendingOrderCard.css';

/**
 * PendingOrderCard Component (Single Responsibility: Order Card with Credit Limit & SKU Breakdown for Admin)
 * 1 File per Component
 */
export const PendingOrderCard = ({ order, onDecision }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const isOverCredit = order.outstanding + order.totalAmount > order.creditLimit;

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

      {/* Credit Limit & Debt Check */}
      <div className="poc-credit-check">
        <div>
          <span className="poc-credit-label">Limit Kredit Toko:</span>
          <span className="poc-credit-value">Rp {order.creditLimit.toLocaleString('id-ID')}</span>
        </div>
        <div>
          <span className="poc-credit-label">Total Setelah Order Ini:</span>
          <span className={`poc-credit-value ${isOverCredit ? 'over' : 'ok'}`}>
            Rp {(order.outstanding + order.totalAmount).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {isOverCredit && (
        <div className="poc-warning">
          <FiAlertCircle className="poc-warning-icon" />
          <span>Warning: Order ini melebihi Plafon Kredit Toko!</span>
        </div>
      )}

      {/* Items Breakdown */}
      <OrderItemsTable items={order.items} totalAmount={order.totalAmount} />

      {/* Approval Buttons */}
      {order.status === 'PENDING_APPROVAL' && (
        <div className="poc-actions-container">
          {!showRejectForm ? (
            <div className="poc-action-grid">
              <button
                type="button"
                onClick={() => onDecision({ orderId: order.id, approved: true })}
                className="poc-btn-approve"
              >
                <LuCheck className="text-base" />
                <span>Approve Order</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
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
                placeholder="Contoh: Overlimit kredit / Stok kosong"
                className="poc-reject-input"
              />
              <div className="poc-reject-actions">
                <button
                  type="button"
                  onClick={() =>
                    onDecision({
                      orderId: order.id,
                      approved: false,
                      rejectionReason: rejectReason || 'Ditolak oleh Admin',
                    })
                  }
                  className="poc-btn-confirm"
                >
                  Konfirmasi Reject
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
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
