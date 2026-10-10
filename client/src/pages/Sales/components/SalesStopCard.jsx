import {OutletValidationVisit} from './OutletValidationVisit';
import React from 'react';
import {visitOutcomeText} from '../../../../../shared/visit-outcome.mjs';
import {OutletPhoto} from './OutletPhoto';
import {OutletExcelMetadata} from './OutletExcelMetadata';
import {OutletGooglePlaceInfo} from './OutletGooglePlaceInfo';
import {SalesStopActions} from './SalesStopActions';
import {useOutletLockStatus} from '../hooks/useOutletLockStatus';
import {useApp} from '../../../context/AppContext';
import {visitStatusLabel} from '../salesPresentation';
export const SalesStopCard=React.memo(({stop,allStops=[],onAbsenIn,onAbsenOut,onInputOrder,onClosedReport,onRequestUnlock})=>{
  const {settings}=useApp();
  const radius=settings.ATTENDANCE_USE_OUTLET_RADIUS?(stop.radiusMeters||settings.ATTENDANCE_RADIUS_METERS):settings.ATTENDANCE_RADIUS_METERS;
  const hasDistance=Number.isFinite(stop.currentDistance);
  const {isLocked,lockReason}=useOutletLockStatus(stop,allStops);
  const coordinates=Number.isFinite(stop.latitude)&&Number.isFinite(stop.longitude)&&Math.abs(stop.latitude)<=90&&Math.abs(stop.longitude)<=180;
  if(stop.validationOnly)return <article className="sales-visit-detail"><h3>{stop.outletName}</h3><p>{stop.address||'Alamat perlu dikonfirmasi'}</p><OutletValidationVisit stop={stop}/></article>;
  return <article className="sales-visit-detail"><div><span className="sales-status">{visitStatusLabel(stop.status)}</span><h3>{stop.outletName}</h3><p>{stop.address||'Alamat belum tercatat'}</p></div>
    <dl><div><dt>Kode outlet</dt><dd>{stop.outletCode||'Belum tercatat'}</dd></div><div><dt>Kontak pelanggan</dt><dd>{[stop.owner,stop.phone].filter(Boolean).join(' · ')||'Belum tercatat'}</dd></div><div><dt>Presensi masuk</dt><dd>{stop.checkInTime||'Belum tercatat'}</dd></div><div><dt>Presensi keluar</dt><dd>{stop.checkOutTime||'Belum tercatat'}</dd></div></dl>
    <p className="sales-note">{hasDistance?`Jarak terakhir: ${stop.currentDistance} m.`:'GPS diperiksa saat presensi.'} {settings.ATTENDANCE_ENFORCE_GEOFENCE?`Radius yang berlaku: ${radius} m.`:'Pembatasan radius sedang nonaktif.'}</p>
    {stop.validationTask&&<OutletValidationVisit stop={stop}/>}
    <SalesStopActions stop={stop} isLocked={isLocked} lockReason={lockReason} onRequestUnlock={onRequestUnlock} onAbsenIn={onAbsenIn} onAbsenOut={onAbsenOut} onInputOrder={onInputOrder} onClosedReport={onClosedReport}/>
    {stop.visitOutcome&&<section className="sales-result"><h4>Hasil kunjungan</h4><p>{visitOutcomeText(stop.visitOutcome)}</p></section>}
    {(stop.checkInNotes||stop.checkOutNotes)&&<section className="sales-result"><h4>Catatan presensi</h4>{stop.checkInNotes&&<p>Masuk: {stop.checkInNotes}</p>}{stop.checkOutNotes&&<p>Keluar: {stop.checkOutNotes}</p>}</section>}
    <details><summary>Informasi outlet & bukti</summary><div className="sales-outlet-extra"><OutletExcelMetadata stop={stop}/><OutletPhoto photoUrl={stop.googlePlaceDetails?.photoUrl||stop.photoUrl} customerName={stop.outletName}/><OutletGooglePlaceInfo googlePlaceDetails={stop.googlePlaceDetails}/>{coordinates&&<a href={`https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`} target="_blank" rel="noopener noreferrer">Buka titik outlet di peta</a>}{stop.checkInPhoto&&<a href={stop.checkInPhoto} target="_blank" rel="noopener noreferrer">Buka foto presensi masuk</a>}{stop.checkOutPhoto&&<a href={stop.checkOutPhoto} target="_blank" rel="noopener noreferrer">Buka foto presensi keluar</a>}</div></details>
  </article>;
});
SalesStopCard.displayName='SalesStopCard';
