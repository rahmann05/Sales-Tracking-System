import React, { useEffect, useState } from 'react';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { LuExternalLink } from 'react-icons/lu';
import { RegistrationRevisionHistory } from './RegistrationRevisionHistory';
import { registrationRevisionReadiness } from '../../../../../shared/registration-policy.mjs';
import { customerRegistrationsApi } from '../../../services/api';

/**
 * RegistrationHistoryDetailModal Component
 * Single Responsibility: Render modal preview for a selected outlet submission.
 */
export const RegistrationHistoryDetailModal = ({ item, onClose, onRevise }) => {
  const [detail, setDetail] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    setDetail(null);
    if (!item?.id || item.photoUrl) return undefined;
    let active = true;
    setLoadingMedia(true);
    customerRegistrationsApi
      .getById(item.id)
      .then((result) => {
        if (active) setDetail(result?.data || result || null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingMedia(false);
      });
    return () => {
      active = false;
    };
  }, [item?.id, item?.photoUrl]);

  if (!item) return null;
  const current = detail || item;
  const revision = registrationRevisionReadiness(current);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${current.latitude},${current.longitude}`;

  const hasCoordinates =
    current.latitude != null &&
    current.longitude != null &&
    Number.isFinite(Number(current.latitude)) &&
    Number.isFinite(Number(current.longitude)) &&
    Math.abs(Number(current.latitude)) <= 90 &&
    Math.abs(Number(current.longitude)) <= 180;
  return (
    <NativeDialog open title={current.name} onClose={onClose} className="sales-form-dialog">
      <div className="sales-modal-content">
        <p className="sales-note">
          NOO: {current.registrationCode || 'Pengajuan lama'} · Kode outlet:{' '}
          {current.customerCode || 'Belum ditetapkan'}
        </p>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2 p-3 bg-surface-container-low rounded-xl">
            <div>
              <strong>Status:</strong> {current.registrationStatus}
            </div>
            <div>
              <strong>Divisi:</strong> {current.division || current.divisionName || '-'}
            </div>
            <div>
              <strong>Area:</strong> {current.area}
            </div>
            <div>
              <strong>Channel:</strong> {current.channel} ({current.subChannel})
            </div>
            <div>
              <strong>Pajak:</strong> {current.taxType} ({current.taxNumber || '-'})
            </div>
            <div>
              <strong>Syarat order:</strong> {current.paymentType}
            </div>
          </div>

          <div>
            <strong>Alamat:</strong>
            <p className="m-0 text-on-surface-variant">{current.address}</p>
          </div>

          <div>
            <strong>Koordinat:</strong> {current.latitude}, {current.longitude}
          </div>

          {loadingMedia && !current.photoUrl && (
            <p role="status" className="text-[11px] text-on-surface-variant">
              Memuat foto outlet…
            </p>
          )}

          {current.photoUrl && (
            <div className="p-3 bg-surface-container rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <strong className="text-on-surface">Foto Outlet (Kamera Langsung):</strong>
                <span className="px-2 py-0.5 bg-primary/10 text-primary font-mono font-bold rounded text-[10px]">
                  ID: {current.photoId || 'PHOTO-REG-LIVE'}
                </span>
              </div>
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border-glass bg-slate-900 flex items-center justify-center">
                <img
                  src={current.photoUrl}
                  alt="Foto Outlet"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://placehold.co/600x400/1e293b/94a3b8?text=Foto+Outlet+Tidak+Dapat+Dimuat';
                  }}
                />
              </div>
            </div>
          )}

          {current.rejectionNote && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl">
              <strong>Catatan Penolakan:</strong>
              <p className="m-0 mt-0.5">{current.rejectionNote}</p>
            </div>
          )}

          {hasCoordinates && (
            <div className="pt-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="outlet-reg-btn-primary w-full text-xs py-2"
              >
                <LuExternalLink /> Buka di Google Maps
              </a>
            </div>
          )}
        </div>
        <RegistrationRevisionHistory history={current.revisionHistory || []} />
        {current.registrationStatus === 'REJECTED' && (
          <div className="grid gap-2 text-sm">
            <p>
              Pengajuan ulang: {revision.count}
              {revision.limit ? ` / ${revision.limit} kali` : ' kali · tanpa batas jumlah'}
            </p>
            {revision.deadline && (
              <p>
                Batas perbaikan:{' '}
                {new Date(revision.deadline).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                })}{' '}
                WIB
              </p>
            )}
            {revision.issues.map((issue) => (
              <p key={issue}>{issue}</p>
            ))}
            {onRevise && (
              <button
                type="button"
                disabled={!revision.allowed}
                className="app-button app-button-primary"
                onClick={() => onRevise(current)}
              >
                Perbaiki & ajukan ulang
              </button>
            )}
          </div>
        )}
      </div>
    </NativeDialog>
  );
};
