import React from 'react';
import {useApp} from '../../../context/AppContext';
import {featureAvailable} from '../../../../../shared/operational-policy.mjs';
export function SpvStopCard({stop,record,onAbsenIn,onOpenAudit,onAbsenOut}){
  const status=record.status;
  const {settings}=useApp(),policy={...settings,...record.policySnapshot?.values},mode=policy.SPV_ATTENDANCE_MODE||'IN_OUT';
  return <article className="spv-visit-detail">
    <span className="app-status">{{PENDING:'Belum dikunjungi',IN_VISIT:'Sedang berlangsung',COMPLETED:'Supervisi selesai'}[status]}</span><h3>{stop.outletName}</h3><p>{stop.address}</p>
    <dl><div><dt>Sales</dt><dd>{stop.assignedSales}</dd></div><div><dt>Pemilik / kontak</dt><dd>{stop.owner} / {stop.phone}</dd></div><div><dt>Presensi masuk Anda</dt><dd>{mode==='OPTIONAL'?'Tidak diwajibkan':record.checkInTime||'Belum tercatat'}</dd></div><div><dt>Presensi keluar Anda</dt><dd>{mode==='IN_OUT'?record.checkOutTime||'Belum tercatat':'Tidak diwajibkan'}</dd></div></dl>
    <p className="spv-note">{mode==='OPTIONAL'?'Catat kegiatan dan hasil supervisi tanpa presensi wajib.':`Foto ${policy.SPV_REQUIRE_PHOTO?'wajib':'opsional'} · GPS ${policy.SPV_REQUIRE_GPS?'wajib':'opsional'}. ${policy.SPV_ENFORCE_GEOFENCE?`Radius outlet ${stop.radiusMeters} m.`:'Pembatas radius tidak digunakan.'}`}</p>
    {record.notes&&<div className="spv-visit-notes"><strong>Catatan supervisi</strong><p>{record.notes}</p></div>}{record.followUp&&<p>Tindak lanjut: {record.followUp.ownerName||'Sales'} · {record.followUp.dueDate} · {record.followUp.status}</p>}
    <div className="app-actions">{status==='PENDING'&&<button type="button" className="app-button app-button-primary" disabled={!featureAvailable(settings,'SPV_VISITS')} onClick={onAbsenIn}>{mode==='OPTIONAL'?'Mulai supervisi':'Absen masuk'}</button>}{status==='IN_VISIT'&&<><button type="button" className="app-button app-button-primary" onClick={onOpenAudit}>Isi audit & tindak lanjut</button><button type="button" className="app-button" onClick={onAbsenOut}>{mode==='IN_OUT'?'Absen keluar':'Selesaikan supervisi'}</button></>}</div>
  </article>;
}
