import React from 'react';
import { LuCheck } from "react-icons/lu";
export function RegistrationPaymentSection({
  formData,
  updateField
}) {
  return <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 text-xs">
          {/* Kolom 1: TOP */}
          <div className="p-3 space-y-2">
            <label onClick={() => updateField('paymentType', 'TOP')} className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer">
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.paymentType === 'TOP' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                {formData.paymentType === 'TOP' && <LuCheck className="text-xs" />}
              </div>
              <span>TERM OF PAYMENT (TOP)</span>
            </label>
            <div className="space-y-1.5 pl-2">
              {[7, 14, 30].map(days => {
            const isSelected = formData.paymentType === 'TOP' && formData.termOfPaymentDays === days;
            return <div key={days} onClick={() => {
              updateField('paymentType', 'TOP');
              updateField('termOfPaymentDays', days);
            }} className="flex items-center justify-between py-0.5 cursor-pointer text-xs font-medium">
                    <span>{days} HARI</span>
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'}`}>
                      {isSelected && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>;
          })}
            </div>
          </div>

          {/* Kolom 2: Cash Payment */}
          <div className="p-3 space-y-2">
            <label onClick={() => updateField('paymentType', 'CASH')} className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer">
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.paymentType === 'CASH' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                {formData.paymentType === 'CASH' && <LuCheck className="text-xs" />}
              </div>
              <span>CASH PAYMENT</span>
            </label>
            <div className="space-y-1.5 pl-2">
              {['TUNAI', 'GIRO', 'CEK'].map(m => {
            const isSelected = formData.paymentType === 'CASH' && formData.cashMethod === m;
            return <div key={m} onClick={() => {
              updateField('paymentType', 'CASH');
              updateField('cashMethod', m);
            }} className="flex items-center justify-between py-0.5 cursor-pointer text-xs font-medium">
                    <span>{m}</span>
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'}`}>
                      {isSelected && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>;
          })}
            </div>
          </div>

          {/* Kolom 3: Transfer Bank BCA */}
          <div onClick={() => updateField('paymentType', 'TRANSFER')} className={`p-3 space-y-1 text-xs cursor-pointer ${formData.paymentType === 'TRANSFER' ? 'bg-primary/5' : ''}`}>
            <div className="font-black border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>KHUSUS PEMBAYARAN TRANSFER</span>
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.paymentType === 'TRANSFER' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                {formData.paymentType === 'TRANSFER' && <LuCheck className="text-xs" />}
              </div>
            </div>
            <div className="text-[11px] space-y-0.5 pt-1">
              <div>NO REKENING : <strong className="font-mono font-black">7774628887</strong></div>
              <div>BANK BCA</div>
              <div className="font-bold">CV SINAR ANUGRAH</div>
            </div>
          </div>
        </div>
      </div>;
}
