import React from 'react';
import {useApp} from '../../../context/AppContext';
import {registrationActions} from '../../../../../shared/approval-workflow.mjs';
import {NativeDialog} from '../../../shared/components/common/NativeDialog';
import {GooglePlaceDetailCard} from '../../OutletRegistration/components/GooglePlaceDetailCard';
import {RegistrationRevisionHistory} from '../../OutletRegistration/components/RegistrationRevisionHistory';
import {stamp,subChannels} from '../../OutletManagement/outletPresentation';
export function OutletApprovalReviewModal({item,userRole,isProcessing=false,onClose,onApprove,onOpenReject,onActivate,canApprove=true}) {
 const {settings}=useApp();
 if(!item)return null;
 const actions=registrationActions(item,userRole,settings),ready=item.registrationStatus==='SPV_APPROVED'||actions.activate;
 return <NativeDialog open title={item.name} busy={isProcessing} onClose={onClose} className="outlet-dialog"><div className="app-form">
  <p className="outlet-muted">{item.registrationCode} · Diajukan {stamp(item.createdAt)} oleh {item.salesmanName || 'Sales belum tercatat'}</p>
  <dl className="outlet-facts"><dt>Alamat</dt><dd>{item.address}</dd><dt>Pemilik</dt><dd>{item.ownerName || 'Belum diisi'}</dd><dt>Telepon</dt><dd>{item.phone || 'Belum diisi'}</dd><dt>Channel</dt><dd>{item.channel==='MODERN_TRADE'?'Modern Trade':'General Trade'} · {subChannels[item.subChannel] || item.subChannel}</dd><dt>Wilayah yang diajukan</dt><dd>{item.area || 'Belum diisi'} · {item.subAreaKecamatan || 'Kecamatan belum diisi'}</dd><dt>Patokan lokasi</dt><dd>{item.mappingLocation || 'Belum diisi'}</dd><dt>Usulan kunjungan</dt><dd>{item.visitDays || 'Belum dipilih'} · {item.visitIntervalWeeks?`setiap ${item.visitIntervalWeeks} minggu`:item.visitWeekSchedule || 'Belum dipilih'}</dd></dl>
  <details className="outlet-disclosure"><summary>Identitas pajak & dokumen</summary><dl className="outlet-facts"><dt>Status pajak</dt><dd>{item.taxType}</dd><dt>NIK / NPWP</dt><dd>{item.taxNumber || 'Belum diisi'}</dd><dt>Nama dokumen</dt><dd>{item.taxName || 'Belum diisi'}</dd><dt>Alamat dokumen</dt><dd>{item.taxAddress || 'Belum diisi'}</dd></dl>{item.taxDocumentUrl&&<a className="app-button" href={item.taxDocumentUrl} target="_blank" rel="noopener noreferrer">Lihat dokumen</a>}</details>
  <section className="outlet-form-section"><h3>Lokasi & bukti pengajuan</h3>{item.placeDetails?<GooglePlaceDetailCard place={item.placeDetails} currentLat={item.latitude} currentLng={item.longitude}/>:<p className="outlet-muted">Profil toko di peta tidak dilampirkan. GPS pengajuan: {item.latitude}, {item.longitude}. Profil peta tidak menjadi syarat persetujuan.</p>}{item.photoUrl&&<img src={item.photoUrl} alt={`Foto pengajuan ${item.name}`} style={{width:'100%',maxHeight:280,objectFit:'contain',borderRadius:12}}/>}<a className="app-button" href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`} target="_blank" rel="noopener noreferrer">Buka titik pengajuan ↗</a></section>
  {item.rejectionNote&&<p className="outlet-warning">Alasan pengembalian: {item.rejectionNote}</p>}
  <RegistrationRevisionHistory history={item.revisionHistory || []}/>
  {ready&&<p className="outlet-notice">{actions.mode==='NONE'?'Pengajuan siap diaktifkan tanpa pemeriksaan manusia sesuai kebijakan.':'Pengajuan telah disetujui dan siap diaktifkan.'} Setelah aktif, Supervisor perlu memasukkannya ke draft PJP lalu menerbitkan jadwal.</p>}
  {item.registrationStatus==='REGISTERED_ACTIVE'&&<p className="outlet-notice">Outlet sudah aktif · {item.customerCode}. Status aktif belum berarti sudah terjadwal.</p>}
  <footer className="outlet-form-footer"><button type="button" className="app-button" disabled={isProcessing} onClick={onClose}>Tutup</button>{canApprove&&actions.reject&&<button type="button" className="app-button outlet-danger" disabled={isProcessing} onClick={onOpenReject}>Tolak pengajuan</button>}{canApprove&&actions.review&&<button type="button" className="app-button app-button-primary" disabled={isProcessing} onClick={()=>onApprove(item)}>{isProcessing?'Memproses…':'Setujui pengajuan'}</button>}{canApprove&&actions.activate&&onActivate&&<button type="button" className="app-button app-button-primary" onClick={()=>onActivate(item)}>Lanjutkan aktivasi</button>}</footer>
 </div></NativeDialog>;
}
