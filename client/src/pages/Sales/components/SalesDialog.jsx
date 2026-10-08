import React from 'react';
import {GuardedDialog} from '../../../shared/components/common/GuardedDialog';
export function SalesDialog({title,description,onClose,busy=false,dirty=false,restored=false,draftError='',freshEvidence=false,children,wide=false}){
  return <GuardedDialog open title={title} onClose={onClose} busy={busy} dirty={dirty} closeDescription={draftError?'Draft belum tersimpan. Isian yang belum dikirim dapat hilang.':`Draft teks yang tersedia tetap disimpan di sesi browser ini.${freshEvidence?' Foto dan GPS presensi perlu diambil ulang ketika formulir dibuka kembali.':''}`} className={`sales-form-dialog ${wide?'sales-form-wide':''}`}>
    <div className="sales-modal-content"><p className="sales-note">{description}</p>{restored&&<p role="status" className="sales-form-help">Draft isian dipulihkan dari sesi browser ini. Periksa kembali sebelum mengirim.{freshEvidence&&' Foto dan GPS presensi perlu diambil ulang.'}</p>}{draftError&&<p role="alert" className="app-error">{draftError}</p>}<fieldset disabled={busy}>{children}</fieldset></div>
  </GuardedDialog>;
}
