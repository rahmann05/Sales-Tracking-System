import {VisitOutcomeAttachments} from '../../../shared/components/common/VisitOutcomeAttachments';
import React from 'react';
import {visitOutcomeText} from '../../../../../shared/visit-outcome.mjs';
import {SalesOffPjpStatusBadge} from './SalesOffPjpStatusBadge';
import {stampWib} from '../salesPresentation';
export function SalesOffPjpCard({item}){
  return <details className="sales-panel sales-offpjp-card"><summary><div><strong>{item.outletName}</strong><p>{item.address||'Alamat belum tercatat'}</p><small>{stampWib(item.createdAt)}</small></div><SalesOffPjpStatusBadge status={item.validationStatus}/></summary><div className="sales-offpjp-content"><p>Kontak: {[item.customerName,item.phone].filter(Boolean).join(' · ')||'Belum tercatat'}</p><p>Alasan kunjungan: {item.reason||'Belum tercatat'}</p>{item.visitOutcome&&<><p>{visitOutcomeText(item.visitOutcome)}</p><VisitOutcomeAttachments value={item.visitOutcome}/></>}{item.rejectionNote&&<p className="app-error">Alasan penolakan: {item.rejectionNote}</p>}{item.photoUrl&&<a href={item.photoUrl} target="_blank" rel="noopener noreferrer">Buka foto bukti presensi</a>}<p className="sales-note">Kunjungan dihitung valid setelah disetujui Supervisor. Validasi kunjungan terpisah dari pemeriksaan hasil manual dan pembayaran.</p></div></details>;
}
