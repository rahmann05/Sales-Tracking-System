import React from 'react';
export function RegistrationTaxSection({cardTypeLabel,formData,setIsKtpCameraOpen,settings,updateField}) {
  return <div className="sales-registration-fields">
    <label className="sales-registration-field">Jenis dokumen<select value={formData.taxType} onChange={e=>updateField('taxType',e.target.value)}><option value="NON_PKP">Non PKP · KTP pemilik</option><option value="PKP">PKP · NPWP</option></select></label>
    <label className="sales-registration-field">{formData.taxType==='PKP'?'Nomor NPWP':'NIK pemilik'}<input inputMode="numeric" value={formData.taxNumber} onChange={e=>updateField('taxNumber',e.target.value)} /></label>
    <label className="sales-registration-field">Nama sesuai {cardTypeLabel}<input value={formData.taxName} onChange={e=>updateField('taxName',e.target.value)} /></label>
    <label className="sales-registration-field">Alamat sesuai {cardTypeLabel}<textarea rows={2} value={formData.taxAddress} onChange={e=>updateField('taxAddress',e.target.value)} /></label>
    <div className="sales-place-selection sales-field-full"><div><strong>Foto {cardTypeLabel}</strong><p className="sales-note">{formData.taxDocumentUrl?'Dokumen terlampir.':settings.CUSTOMER_REG_REQUIRE_TAX_DOCUMENT?'Wajib diambil langsung dengan kamera.':'Opsional, sesuai kebutuhan pengajuan.'}</p></div><button type="button" className="app-button" onClick={()=>setIsKtpCameraOpen(true)}>{formData.taxDocumentUrl?'Foto ulang dokumen':`Ambil foto ${cardTypeLabel}`}</button></div>
  </div>;
}
