import React from 'react';
import { NooField } from './NooField';
import { NooTick } from './NooTick';

const TOP_DAYS = [7, 14, 30];
const CASH_METHODS = ['TUNAI', 'GIRO', 'CEK'];

/** Blok PAYMENT formulir kertas: TOP 7/14/30 hari, CASH (tunai/giro/cek), dan info transfer. */
export function RegistrationPaymentSection({ formData, requiredFields = [], updateField }) {
  const req = new Set(requiredFields);
  const type = formData.paymentType || 'CASH';
  const topDays = Number(formData.termOfPaymentDays ?? 0);
  const method = formData.cashMethod || 'TUNAI';

  return (
    <section id="registration-payment" className="npf-block">
      <div className="npf-row npf-cols-payment">
        <div className="npf-gutter">PAYMENT :</div>
        <div className="npf-box" data-active={type === 'TOP'}>
          <NooTick
            name="paymentType"
            spread
            strong
            label="TERM OF PAYMENT (TOP)"
            checked={type === 'TOP'}
            onChange={() => updateField('paymentType', 'TOP')}
          />
          {TOP_DAYS.map((day) => (
            <NooTick
              key={day}
              name="topDays"
              spread
              label={`${day} HARI`}
              checked={type === 'TOP' && topDays === day}
              onChange={() => {
                updateField('paymentType', 'TOP');
                updateField('termOfPaymentDays', day);
              }}
            />
          ))}
          <NooField label="Lainnya (hari)" required={type === 'TOP'}>
            <input
              id="reg-top-days"
              name="termOfPaymentDays"
              className="npf-line npf-line--short"
              type="number"
              required={type === 'TOP'}
              disabled={type !== 'TOP'}
              min="0"
              max="365"
              step="1"
              value={formData.termOfPaymentDays ?? 0}
              onChange={(e) => updateField('termOfPaymentDays', e.target.value)}
            />
          </NooField>
        </div>
        <div className="npf-box" data-active={type === 'CASH'}>
          <NooTick
            name="paymentType"
            spread
            strong
            label="CASH PAYMENT"
            checked={type === 'CASH'}
            onChange={() => updateField('paymentType', 'CASH')}
          />
          {CASH_METHODS.map((value) => (
            <NooTick
              key={value}
              name="cashMethod"
              spread
              label={value}
              checked={type === 'CASH' && method === value}
              onChange={() => {
                updateField('paymentType', 'CASH');
                updateField('cashMethod', value);
              }}
            />
          ))}
        </div>
        <div className="npf-stack">
          <NooTick
            name="paymentType"
            spread
            strong
            label="KHUSUS PEMBAYARAN TRANSFER"
            checked={type === 'TRANSFER'}
            onChange={() => updateField('paymentType', 'TRANSFER')}
          />
          <p className="npf-static">
            NO REKENING : 7774628887
            <br />
            BANK BCA
            <br />
            CV. SINAR ANUGRAH
          </p>
        </div>
      </div>
      <NooField label="Info rekening pelanggan" required={req.has('bankAccountInfo')}>
        <input
          id="reg-bank-info"
          name="bankAccountInfo"
          className="npf-line"
          required={req.has('bankAccountInfo')}
          maxLength={200}
          value={formData.bankAccountInfo || ''}
          onChange={(e) => updateField('bankAccountInfo', e.target.value)}
          placeholder="Bank & no. rekening (eksternal)"
        />
      </NooField>
    </section>
  );
}
