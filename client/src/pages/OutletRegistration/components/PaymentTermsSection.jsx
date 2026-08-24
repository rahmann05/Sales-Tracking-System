import React from 'react';
import { LuDollarSign } from 'react-icons/lu';

/**
 * PaymentTermsSection Component
 * Single Responsibility: Manage payment terms (CASH, TOP, TRANSFER) and related parameters.
 */
export const PaymentTermsSection = ({
  paymentType,
  cashMethod,
  termOfPaymentDays,
  onChange,
}) => {
  return (
    <div className="outlet-reg-section-card">
      <div className="outlet-reg-section-title">
        <LuDollarSign className="text-primary" />
        <span>7. Syarat & Metode Pembayaran</span>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'CASH', label: 'CASH PAYMENT' },
            { id: 'TOP', label: 'TERM OF PAYMENT (TOP)' },
            { id: 'TRANSFER', label: 'TRANSFER BANK' },
          ].map((p) => (
            <div
              key={p.id}
              onClick={() => onChange('paymentType', p.id)}
              className={`outlet-reg-radio-card justify-center text-center p-2 text-xs font-bold ${
                paymentType === p.id ? 'active' : ''
              }`}
            >
              {p.label}
            </div>
          ))}
        </div>

        {paymentType === 'TOP' && (
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-glass">
            <label className="outlet-reg-label">JANGKA WAKTU TOP</label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map((days) => (
                <div
                  key={days}
                  onClick={() => onChange('termOfPaymentDays', days)}
                  className={`outlet-reg-radio-card justify-center p-2 text-xs font-bold ${
                    termOfPaymentDays === days ? 'active' : ''
                  }`}
                >
                  {days} HARI
                </div>
              ))}
            </div>
          </div>
        )}

        {paymentType === 'CASH' && (
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-glass">
            <label className="outlet-reg-label">METODE CASH</label>
            <div className="grid grid-cols-3 gap-2">
              {['TUNAI', 'GIRO', 'CEK'].map((m) => (
                <div
                  key={m}
                  onClick={() => onChange('cashMethod', m)}
                  className={`outlet-reg-radio-card justify-center p-2 text-xs font-bold ${
                    cashMethod === m ? 'active' : ''
                  }`}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
        )}

        {paymentType === 'TRANSFER' && (
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-on-surface">
            <div className="font-bold text-primary">Rekening Transfer Resmi:</div>
            <div className="font-mono mt-1 font-bold">NO REKENING : 7774628887</div>
            <div>BANK BCA a.n. CV SINAR ANUGRAH</div>
          </div>
        )}
      </div>
    </div>
  );
};
