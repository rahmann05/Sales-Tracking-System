import React from 'react';
export function RegistrationPaymentSection({formData,updateField}) {
  return <div className="sales-registration-fields">
    <label className="sales-registration-field">Termin pembayaran pelanggan<select value={formData.paymentType} onChange={e=>{updateField('paymentType',e.target.value);if(e.target.value==='TOP'&&![7,14,30].includes(Number(formData.termOfPaymentDays)))updateField('termOfPaymentDays',7);}}><option value="TOP">Tempo (TOP)</option><option value="CASH">Tunai / giro / cek</option><option value="TRANSFER">Transfer</option></select></label>
    {formData.paymentType==='TOP'&&<label className="sales-registration-field">Jangka waktu<select value={formData.termOfPaymentDays} onChange={e=>updateField('termOfPaymentDays',Number(e.target.value))}>{[7,14,30].map(days=><option key={days} value={days}>{days} hari</option>)}</select></label>}
    {formData.paymentType==='CASH'&&<label className="sales-registration-field">Metode<select value={formData.cashMethod} onChange={e=>updateField('cashMethod',e.target.value)}>{['TUNAI','GIRO','CEK'].map(value=><option key={value} value={value}>{value}</option>)}</select></label>}
    <p className="sales-note sales-field-full">Data ini mencatat kesepakatan termin pelanggan. Pembayaran dilakukan di luar aplikasi.</p>
  </div>;
}
