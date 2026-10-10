import React from 'react';
import {NativeDialog} from '../../../shared/components/common/NativeDialog';
import { LuExternalLink } from 'react-icons/lu';
import {RegistrationRevisionHistory} from './RegistrationRevisionHistory';
import {registrationRevisionReadiness} from '../../../../../shared/registration-policy.mjs';

/**
 * RegistrationHistoryDetailModal Component
 * Single Responsibility: Render modal preview for a selected outlet submission.
 */
export const RegistrationHistoryDetailModal = ({ item, onClose,onRevise }) => {
  if (!item) return null;
  const revision=registrationRevisionReadiness(item);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;

  const hasCoordinates=item.latitude!=null&&item.longitude!=null&&Number.isFinite(Number(item.latitude))&&Number.isFinite(Number(item.longitude))&&Math.abs(Number(item.latitude))<=90&&Math.abs(Number(item.longitude))<=180;
  return <NativeDialog open title={item.name} onClose={onClose} className="sales-form-dialog"><div className="sales-modal-content"><p className="sales-note">NOO: {item.registrationCode||'Pengajuan lama'} · Kode outlet: {item.customerCode||'Belum ditetapkan'}</p>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2 p-3 bg-surface-container-low rounded-xl">
            <div>
              <strong>Status:</strong> {item.registrationStatus}
            </div>
            <div>
              <strong>Divisi:</strong> {item.division}
            </div>
            <div>
              <strong>Area:</strong> {item.area}
            </div>
            <div>
              <strong>Channel:</strong> {item.channel} ({item.subChannel})
            </div>
            <div>
              <strong>Pajak:</strong> {item.taxType} ({item.taxNumber || '-'})
            </div>
            <div>
              <strong>Syarat order:</strong> {item.paymentType}
            </div>
          </div>

          <div>
            <strong>Alamat:</strong>
            <p className="m-0 text-on-surface-variant">{item.address}</p>
          </div>

          <div>
            <strong>Koordinat:</strong> {item.latitude}, {item.longitude}
          </div>

          {item.photoUrl && (
            <div className="p-3 bg-surface-container rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <strong className="text-on-surface">Foto Outlet (Kamera Langsung):</strong>
                <span className="px-2 py-0.5 bg-primary/10 text-primary font-mono font-bold rounded text-[10px]">
                  ID: {item.photoId || 'PHOTO-REG-LIVE'}
                </span>
              </div>
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border-glass bg-slate-900 flex items-center justify-center">
                <img
                  src={item.photoUrl}
                  alt="Foto Outlet"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://placehold.co/600x400/1e293b/94a3b8?text=Foto+Outlet+Tidak+Dapat+Dimuat';
                  }}
                />
              </div>
            </div>
          )}

          {item.rejectionNote && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl">
              <strong>Catatan Penolakan:</strong>
              <p className="m-0 mt-0.5">{item.rejectionNote}</p>
            </div>
          )}

          {hasCoordinates&&<div className="pt-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="outlet-reg-btn-primary w-full text-xs py-2"
            >
              <LuExternalLink /> Buka di Google Maps
            </a>
          </div>}
        </div>
    <RegistrationRevisionHistory history={item.revisionHistory || []}/>
    {item.registrationStatus==='REJECTED'&&<div className="grid gap-2 text-sm"><p>Pengajuan ulang: {revision.count}{revision.limit?` / ${revision.limit} kali`:' kali · tanpa batas jumlah'}</p>{revision.deadline&&<p>Batas perbaikan: {new Date(revision.deadline).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</p>}{revision.issues.map(issue=><p key={issue}>{issue}</p>)}{onRevise&&<button type="button" disabled={!revision.allowed} className="app-button app-button-primary" onClick={()=>onRevise(item)}>Perbaiki & ajukan ulang</button>}</div>}
  </div></NativeDialog>;
};
