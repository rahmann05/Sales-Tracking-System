import React from 'react';
import {GuardedDialog} from '../../../shared/components/common/GuardedDialog';
export function SalesDialog({title,description,onClose,busy=false,dirty=false,restored=false,draftError='',draftNotice='',freshEvidence=false,children,wide=false}){
  return <GuardedDialog open title={title} onClose={onClose} busy={busy} dirty={dirty} closeDescription={draftError?'Draft belum tersimpan. Isian yang belum dikirim dapat hilang.':`Draf teks yang tersedia tetap disimpan di browser ini.${freshEvidence?' Foto dan GPS presensi perlu diambil ulang ketika formulir dibuka kembali.':''}`} className={`sales-form-dialog ${wide?'sales-form-wide':''}`}>
    <div className="sales-modal-content"><p className="sales-note">{description}</p>{(restored||draftNotice)&&<p role="status" className="sales-form-help">{draftNotice||'Draf isian dipulihkan dari browser ini. Periksa kembali sebelum mengirim.'}{freshEvidence&&' Foto dan GPS presensi perlu diambil ulang.'}</p>}{draftError&&<p role="alert" className="app-error">{draftError}</p>}<fieldset disabled={busy}>{children}</fieldset></div>
  </GuardedDialog>;
}
