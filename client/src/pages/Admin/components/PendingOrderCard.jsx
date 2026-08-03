import React, { useState } from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';

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
      className={`bg-surface border rounded-2xl p-5 shadow-sm space-y-4 transition-all ${
        order.status === 'APPROVED'
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : order.status === 'REJECTED'
          ? 'border-rose-500/40 bg-rose-500/5'
          : 'border-border-glass'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
            Order #{order.id}
          </span>
          <h4 className="font-bold text-on-surface text-base mt-1">{order.outletName}</h4>
          <p className="text-xs text-on-surface-variant">
            Sales: <span className="font-semibold text-on-surface">{order.salesName}</span> • Syarat: {order.paymentType}
          </p>
        </div>

        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
            order.status === 'APPROVED'
              ? 'bg-emerald-500/10 text-emerald-600'
              : order.status === 'REJECTED'
              ? 'bg-rose-500/10 text-rose-600'
              : 'bg-amber-500/10 text-amber-600'
          }`}
        >
          {order.status}
        </span>
      </div>

      {/* Credit Limit & Debt Check */}
      <div className="p-3 bg-surface-variant/30 rounded-xl border border-border-glass grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-on-surface-variant block">Limit Kredit Toko:</span>
          <span className="font-bold text-on-surface">Rp {order.creditLimit.toLocaleString('id-ID')}</span>
        </div>
        <div>
          <span className="text-on-surface-variant block">Total Setelah Order Ini:</span>
          <span className={`font-bold ${isOverCredit ? 'text-rose-600' : 'text-emerald-600'}`}>
            Rp {(order.outstanding + order.totalAmount).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {isOverCredit && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-500/10 p-2 rounded-lg font-semibold">
          <FiAlertCircle className="text-base flex-shrink-0" />
          <span>Warning: Order ini melebihi Plafon Kredit Toko!</span>
        </div>
      )}

      {/* Items Breakdown */}
      <div className="space-y-1.5 text-xs border-t border-border-glass pt-3">
        <span className="font-bold text-on-surface block">Rincian Item SKU:</span>
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-on-surface-variant">
            <span>
              {item.productName} ({item.qty}x)
            </span>
            <span className="font-semibold text-on-surface">Rp {item.subtotal.toLocaleString('id-ID')}</span>
          </div>
        ))}
        <div className="flex items-center justify-between font-bold text-sm text-primary pt-2 border-t border-border-glass/50">
          <span>Total Nilai Order:</span>
          <span>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Approval Buttons */}
      {order.status === 'PENDING_APPROVAL' && (
        <div className="space-y-2 pt-2">
          {!showRejectForm ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onDecision({ orderId: order.id, approved: true })}
                className="py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <LuCheck className="text-base" />
                <span>Approve Order</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                className="py-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <LuX className="text-base" />
                <span>Reject Order</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 bg-rose-500/5 p-3 rounded-xl border border-rose-500/20">
              <label className="text-xs font-bold text-rose-600">Alasan Penolakan Order Admin:</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Overlimit kredit / Stok kosong"
                className="w-full p-2 rounded-lg border border-border-glass text-xs bg-surface text-on-surface"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onDecision({
                      orderId: order.id,
                      approved: false,
                      rejectionReason: rejectReason || 'Ditolak oleh Admin',
                    })
                  }
                  className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
                >
                  Konfirmasi Reject
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-2 bg-surface border border-border-glass text-xs font-bold rounded-lg"
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
