import React, {useEffect, useState} from 'react';
import {useApp} from '../../../context/AppContext';
import {customerRegistrationsApi} from '../../../services/api';
import {printOperationalDocument} from '../../../services/operationalExportService';
import {registrationActions} from '../../../../../shared/approval-workflow.mjs';
import {NativeDialog} from '../../../shared/components/common/NativeDialog';
import {GooglePlaceDetailCard} from '../../OutletRegistration/components/GooglePlaceDetailCard';
import {RegistrationRevisionHistory} from '../../OutletRegistration/components/RegistrationRevisionHistory';
import {stamp,subChannels} from '../../OutletManagement/outletPresentation';
import {NooDocumentFact as Fact} from './NooDocumentFact';
import '../../../styles/pages/OperationalDocument.css';

const statusLabels={DRAFT:'Draf',SUBMITTED:'Menunggu persetujuan',SPV_APPROVED:'Disetujui, menunggu aktivasi',REGISTERED_ACTIVE:'Aktif',REJECTED:'Dikembalikan'};
const show=value=>value===null||value===undefined||value===''?'Belum diisi':String(value);
const hasCoordinates=item=>item.latitude!=null&&item.longitude!=null&&Number.isFinite(Number(item.latitude))&&Number.isFinite(Number(item.longitude))&&Math.abs(Number(item.latitude))<=90&&Math.abs(Number(item.longitude))<=180;

export function OutletApprovalReviewModal({item,userRole,isProcessing=false,onClose,onApprove,onOpenReject,onActivate,canApprove=true}) {
 const {settings}=useApp();
 const [detail,setDetail]=useState(null),[loading,setLoading]=useState(false),[loadError,setLoadError]=useState(''),[photoFailed,setPhotoFailed]=useState(false);
 useEffect(()=>{
  if(!item?.id)return undefined;
  let active=true;
  setDetail(null);setLoading(true);setLoadError('');setPhotoFailed(false);
  customerRegistrationsApi.getById(item.id).then(result=>{if(active)setDetail(result?.data||result);}).catch(error=>{if(active)setLoadError(error.message||'Detail pengajuan gagal dimuat.');}).finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[item?.id]);
 if(!item)return null;
 const current=detail?.id===item.id?detail:null;
 const actions=current?registrationActions(current,userRole,settings):null;
 const ready=current&&(current.registrationStatus==='SPV_APPROVED'||actions.activate);
 const coords=current&&hasCoordinates(current);
 const photoUrl=current?.photoUrl?.trim();
 return <NativeDialog open title={`Tinjau pengajuan ${item.registrationCode||item.name}`} busy={isProcessing} onClose={onClose} className="outlet-review-document-dialog">
  {loading&&<p className="outlet-muted" role="status">Memuat dokumen dan foto pengajuan…</p>}
  {loadError&&<div className="app-error" role="alert"><p>{loadError}</p><p>Keputusan ditahan sampai dokumen lengkap berhasil dimuat.</p><button type="button" className="app-button" onClick={onClose}>Tutup</button></div>}
  {current&&<>
   <div className="noo-review-tools no-print"><p>Periksa identitas, titik lokasi, dan foto fisik sebelum mengambil keputusan.</p><button type="button" className="app-button" onClick={()=>printOperationalDocument('OUTLET')}>Cetak dokumen / PDF</button></div>
   <article className="operational-document noo-document" aria-label={`Dokumen pengajuan outlet ${current.name}`}>
    <header className="operational-document-letterhead"><div><strong>CV. SINAR ANUGRAH</strong><span>Dokumen pengajuan outlet baru (NOO)</span></div><div className="operational-document-reference"><b>{current.registrationCode||'Nomor belum ditetapkan'}</b><span>{stamp(current.createdAt)}</span></div></header>
    <div className="operational-document-title"><p>FORMULIR PENGAJUAN OUTLET BARU</p><h2>{current.name}</h2><span className="noo-document-status">{statusLabels[current.registrationStatus]||current.registrationStatus}</span></div>
    <section className="noo-document-section"><h3>01 · Identitas dan alamat outlet</h3><dl className="noo-document-grid"><Fact label="Nama outlet">{current.name}</Fact><Fact label="Pemilik / penanggung jawab">{show(current.ownerName)}</Fact><Fact label="Alamat lengkap">{current.address}{[current.address2,current.address3].filter(Boolean).map((part,i)=><React.Fragment key={i}><br/>{part}</React.Fragment>)}</Fact><Fact label="Nomor telepon">{show(current.phone)}</Fact><Fact label="Jenis lokasi">{show(current.locationType?.replaceAll('_',' '))}</Fact><Fact label="Patokan fisik">{show(current.mappingLocation)}</Fact></dl></section>
    <section className="noo-document-section"><h3>02 · Lokasi dan bukti fisik</h3><div className="noo-document-evidence"><figure className="noo-document-photo"><figcaption>Foto fisik outlet yang diajukan {current.photoId&&<small>· {current.photoId}</small>}</figcaption>{photoUrl&&!photoFailed?<img src={photoUrl} alt={`Foto fisik outlet ${current.name} dari pengajuan`} onError={()=>setPhotoFailed(true)}/>:<div className="noo-document-photo-empty" role="status">{photoFailed?'Foto tercatat tetapi gagal dimuat. Minta bukti foto yang dapat dibuka sebelum menyetujui.':'Foto fisik outlet belum dilampirkan pada pengajuan ini.'}</div>}</figure><div className="noo-document-location"><dl><Fact label="Koordinat pengajuan">{coords?`${current.latitude}, ${current.longitude}`:'Belum tersedia'}</Fact><Fact label="Kelurahan / kecamatan">{[current.kelurahan,current.subAreaKecamatan].filter(Boolean).join(' · ')||'Belum diisi'}</Fact><Fact label="Kota / wilayah">{[current.city,current.area].filter(Boolean).join(' · ')||'Belum diisi'}</Fact></dl>{coords&&<a href={`https://www.google.com/maps/search/?api=1&query=${current.latitude},${current.longitude}`} target="_blank" rel="noopener noreferrer" className="no-print">Buka titik di Google Maps ↗</a>}{current.placeDetails?<GooglePlaceDetailCard place={current.placeDetails} currentLat={current.latitude} currentLng={current.longitude}/>:<p className="noo-document-note">Profil Google tidak dilampirkan. GPS dan foto perlu ditinjau sebagai bukti terpisah.</p>}</div></div></section>
    <section className="noo-document-section"><h3>03 · Klasifikasi dan rencana kunjungan</h3><dl className="noo-document-grid"><Fact label="Divisi / cabang">{[current.divisionName||current.division,current.branch].filter(Boolean).join(' · ')||'Belum diisi'}</Fact><Fact label="Area / cluster">{[current.area,current.cluster?.name].filter(Boolean).join(' · ')||'Belum ditetapkan'}</Fact><Fact label="Channel">{current.channel==='MODERN_TRADE'?'Modern Trade':'General Trade'} · {subChannels[current.subChannel]||show(current.subChannel)}</Fact><Fact label="Hari kunjungan">{show(current.visitDays)}</Fact><Fact label="Frekuensi">{current.visitIntervalWeeks?`Setiap ${current.visitIntervalWeeks} minggu`:show(current.visitWeekSchedule)}</Fact><Fact label="Ketentuan order">{show(current.paymentType)}{current.termOfPaymentDays>0?` · tempo ${current.termOfPaymentDays} hari`:''}</Fact></dl></section>
    <section className="noo-document-section"><h3>04 · Identitas pajak dan dokumen</h3><dl className="noo-document-grid"><Fact label="Status pajak">{show(current.taxType)}</Fact><Fact label="NIK / NPWP">{show(current.taxNumber)}</Fact><Fact label="Nama pada dokumen">{show(current.taxName)}</Fact><Fact label="Alamat dokumen">{show(current.taxAddress)}</Fact></dl>{current.taxDocumentUrl?<a href={current.taxDocumentUrl} target="_blank" rel="noopener noreferrer" className="no-print">Buka lampiran identitas ↗</a>:<p className="noo-document-note">Lampiran identitas tidak tersedia pada pengajuan ini.</p>}</section>
    <section className="noo-document-section"><h3>05 · Pengajuan dan keputusan</h3><dl className="noo-document-grid"><Fact label="Diajukan oleh">{show(current.salesmanName)}</Fact><Fact label="Mengetahui">{show(current.outletKnownBy||current.spvName)}</Fact><Fact label="Persetujuan SPV">{current.spvApprovedAt?`${show(current.spvName)} · ${stamp(current.spvApprovedAt)}`:'Belum diberikan'}</Fact><Fact label="Aktivasi admin">{current.adminRegisteredAt?`${show(current.adminName)} · ${stamp(current.adminRegisteredAt)}`:'Belum dilakukan'}</Fact></dl>{current.rejectionNote&&<p className="noo-document-rejection"><strong>Alasan pengembalian:</strong> {current.rejectionNote}</p>}</section>
    <footer className="noo-document-signatures"><div><span>Pengaju / Sales</span><strong>{show(current.salesmanName)}</strong></div><div><span>Pemeriksa / Supervisor</span><strong>{show(current.spvName)}</strong></div><div><span>Aktivasi / Admin</span><strong>{show(current.adminName)}</strong></div></footer>
   </article>
   <div className="noo-review-support no-print"><RegistrationRevisionHistory history={current.revisionHistory||[]}/>{ready&&<p className="outlet-notice">{actions.mode==='NONE'?'Pengajuan siap diaktifkan sesuai kebijakan.':'Pengajuan telah disetujui dan siap diaktifkan.'} Setelah aktif, Supervisor perlu memasukkannya ke draft PJP lalu menerbitkan jadwal.</p>}{current.registrationStatus==='REGISTERED_ACTIVE'&&<p className="outlet-notice">Outlet aktif · {current.customerCode}. Status aktif belum berarti sudah terjadwal.</p>}</div>
   <footer className="outlet-form-footer noo-review-actions no-print"><button type="button" className="app-button" disabled={isProcessing} onClick={onClose}>Tutup</button>{canApprove&&actions.reject&&<button type="button" className="app-button outlet-danger" disabled={isProcessing} onClick={onOpenReject}>Tolak pengajuan</button>}{canApprove&&actions.review&&<button type="button" className="app-button app-button-primary" disabled={isProcessing||photoFailed} onClick={()=>onApprove(current)}>{isProcessing?'Memproses…':'Setujui pengajuan'}</button>}{canApprove&&actions.activate&&onActivate&&<button type="button" className="app-button app-button-primary" disabled={isProcessing||photoFailed} onClick={()=>onActivate(current)}>Lanjutkan aktivasi</button>}</footer>
  </>}
 </NativeDialog>;
}
