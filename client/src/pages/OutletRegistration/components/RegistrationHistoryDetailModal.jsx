import React from 'react';
import { LuExternalLink, LuX } from 'react-icons/lu';

/**
 * RegistrationHistoryDetailModal Component
 * Single Responsibility: Render modal preview for a selected outlet submission.
 */
export const RegistrationHistoryDetailModal = ({ item, onClose }) => {
  if (!item) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-border-glass max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-glass">
          <div>
            <h4 className="text-base font-extrabold text-on-surface m-0">
              {item.name}
            </h4>
            <p className="text-xs text-on-surface-variant m-0">
              Kode Outlet: {item.customerCode || 'Belum ditetapkan (Menunggu Admin)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-lg font-bold"
          >
            <LuX />
          </button>
        </div>

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
              <strong>Payment:</strong> {item.paymentType}
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
              <div className="relative w-full h-44 rounded-lg overflow-hidden border border-border-glass bg-black">
                <img
                  src={item.photoUrl}
                  alt="Foto Outlet"
                  className="w-full h-full object-contain"
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
        </div>
      </div>
    </div>
  );
};
