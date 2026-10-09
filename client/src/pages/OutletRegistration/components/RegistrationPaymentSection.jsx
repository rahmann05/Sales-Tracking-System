import React from 'react';
export function RegistrationPaymentSection({formData,updateField}) {
  return <div className="sales-registration-fields">
    <label className="sales-registration-field">Termin pembayaran pelanggan<select value={formData.paymentType} onChange={e=>updateField('paymentType',e.target.value)}><option value="TOP">Tempo (TOP)</option><option value="CASH">Tunai / giro / cek</option><option value="TRANSFER">Transfer</option></select></label>
    {formData.paymentType==='TOP'&&<label className="sales-registration-field">Jangka waktu (hari)<input type="number" required min="0" max="365" step="1" value={formData.termOfPaymentDays} onChange={e=>updateField('termOfPaymentDays',e.target.value)}/></label>}
    {formData.paymentType==='CASH'&&<label className="sales-registration-field">Metode<select value={formData.cashMethod} onChange={e=>updateField('cashMethod',e.target.value)}>{['TUNAI','GIRO','CEK'].map(value=><option key={value} value={value}>{value}</option>)}</select></label>}
    <p className="sales-note sales-field-full">Data ini mencatat kesepakatan termin pelanggan. Pembayaran dilakukan di luar aplikasi.</p>
  </div>;
}
