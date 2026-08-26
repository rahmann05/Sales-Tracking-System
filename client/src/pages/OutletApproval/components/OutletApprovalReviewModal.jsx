import React from 'react';
import { LuExternalLink, LuCheck, LuX } from 'react-icons/lu';
import { GooglePlaceDetailCard } from '../../OutletRegistration/components/GooglePlaceDetailCard';

/**
 * OutletApprovalReviewModal Component
 * Single Responsibility: Render comprehensive review popup of an outlet submission and trigger Approve/Reject actions.
 */
export const OutletApprovalReviewModal = ({
  item,
  userRole,
  isProcessing = false,
  onClose,
  onApprove,
  onOpenReject,
}) => {
  if (!item) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-border-glass max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-border-glass">
          <div>
            <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
              DIVISI {item.division} • {item.branch}
            </span>
            <h3 className="text-lg font-black text-on-surface m-0 mt-1">{item.name}</h3>
            <p className="text-xs text-on-surface-variant m-0">
              Diajukan oleh Salesman: <strong>{item.salesmanName || '-'}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-xl font-bold"
          >
            <LuX />
          </button>
        </div>

        {/* Grid 2 Kolom Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Kolom Kiri: Info Toko & Legalitas */}
          <div className="space-y-3 p-3 bg-surface-container-low rounded-xl border border-border-glass">
            <div className="font-bold text-on-surface border-b border-border-glass pb-1">
              1. Identitas & Legalitas Toko
            </div>
            <div>
              <span className="text-on-surface-variant">Alamat:</span>
              <div className="font-medium text-on-surface">{item.address}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-on-surface-variant">Pemilik:</span>
                <div className="font-medium text-on-surface">{item.ownerName || '-'}</div>
              </div>
              <div>
                <span className="text-on-surface-variant">No. Telp:</span>
                <div className="font-mono text-on-surface">{item.phone || '-'}</div>
              </div>
            </div>
            <div>
              <span className="text-on-surface-variant">Lokasi Fisik:</span>
              <div className="font-bold text-primary">{item.locationType}</div>
            </div>
            <div>
              <span className="text-on-surface-variant">Status Pajak:</span>
              <div className="font-bold text-on-surface">
                {item.taxType} ({item.taxNumber || 'Non-PKP'})
              </div>
              <div className="text-[11px] text-on-surface-variant">
                Atas Nama: {item.taxName || '-'}
              </div>
            </div>
            <div>
              <span className="text-on-surface-variant">Mapping / Patokan:</span>
              <div className="font-medium text-on-surface italic">
                {item.mappingLocation || 'Tidak ada catatan'}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Google Places API Data, Channel & Payment */}
          <div className="space-y-3 p-3 bg-surface-container-low rounded-xl border border-border-glass">
            <div className="font-bold text-on-surface border-b border-border-glass pb-1 flex items-center justify-between">
              <span>2. Validasi Google Places API & Foto Live</span>
              {item.photoId && (
                <span className="font-mono text-[10px] text-primary font-bold">
                  {item.photoId}
                </span>
              )}
            </div>

            {/* Google Places API Card */}
            <GooglePlaceDetailCard
              place={
                item.placeDetails || {
                  name: item.name,
                  categoryName: `${item.channel} (${item.subChannel})`,
                  address: item.address,
                  rating: 5.0,
                  userRatingsTotal: 1,
                  openingHoursText: 'Buka · Tutup pukul 22.00',
                  phone: item.phone || '0838-2217-0889',
                  plusCode: `GPS: ${item.latitude}, ${item.longitude}`,
                  googleMapsUrl: googleMapsUrl,
                }
              }
              currentLat={item.latitude}
              currentLng={item.longitude}
            />

            {item.photoUrl && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-on-surface-variant font-bold">Foto Live Lapangan:</span>
                  <span className="font-mono font-black text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                    {item.photoId || 'PHOTO-REG-VERIFIED'}
                  </span>
                </div>
                <div className="relative h-36 rounded-xl overflow-hidden border border-border-glass bg-slate-900 flex items-center justify-center">
                  <img
                    src={item.photoUrl}
                    alt="Foto Toko"
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/600x400/1e293b/94a3b8?text=Foto+Toko+Tidak+Dapat+Dimuat';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <span className="text-on-surface-variant">Channel:</span>
                <div className="font-bold text-on-surface">
                  {item.channel} ({item.subChannel})
                </div>
              </div>
              <div>
                <span className="text-on-surface-variant">Tier:</span>
                <div className="font-bold text-primary">{item.channelTier}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-on-surface-variant">Syarat Bayar:</span>
                <div className="font-bold text-on-surface">{item.paymentType}</div>
              </div>
              <div>
                <span className="text-on-surface-variant">Jadwal Kunjungan:</span>
                <div className="font-bold text-on-surface">
                  {item.visitWeekSchedule} ({item.visitDays || 'SENIN'})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Action Buttons */}
        <div className="pt-3 border-t border-border-glass flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-on-surface-variant">
            Status Saat Ini: <strong className="text-primary">{item.registrationStatus}</strong>
          </span>

          <div className="flex items-center gap-2">
            {/* 1. If item is already approved by SPV and user is SUPERVISOR */}
            {userRole === 'SUPERVISOR' && item.registrationStatus === 'SPV_APPROVED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold">
                <LuCheck /> Telah Anda Setujui (Menunggu Ops Manager)
              </span>
            )}

            {/* 2. If item is OPS_APPROVED */}
            {item.registrationStatus === 'OPS_APPROVED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20 text-xs font-bold">
                <LuCheck /> Telah Disetujui Manajer Operasional
              </span>
            )}

            {/* 3. If item is REGISTERED_ACTIVE */}
            {item.registrationStatus === 'REGISTERED_ACTIVE' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold">
                <LuCheck /> Outlet Telah Terdaftar Aktif ({item.customerCode || 'Kode Resmi'})
              </span>
            )}

            {/* 4. If item is REJECTED */}
            {item.registrationStatus === 'REJECTED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20 text-xs font-bold">
                <LuX /> Pengajuan Telah Ditolak
              </span>
            )}

            {/* 5. Can Take Action Buttons (When status is SUBMITTED for SPV, or SPV_APPROVED for Ops) */}
            {((userRole === 'SUPERVISOR' && item.registrationStatus === 'SUBMITTED') ||
              (userRole === 'MANAJER_OPERASIONAL' && (item.registrationStatus === 'SPV_APPROVED' || item.registrationStatus === 'SUBMITTED')) ||
              (userRole === 'ADMIN' && item.registrationStatus !== 'REGISTERED_ACTIVE' && item.registrationStatus !== 'REJECTED') ||
              (!userRole && item.registrationStatus === 'SUBMITTED')) && (
              <>
                <button
                  type="button"
                  onClick={onOpenReject}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <LuX /> Tolak Pengajuan
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(item)}
                  disabled={isProcessing}
                  className="outlet-reg-btn-primary text-xs py-2 px-4 cursor-pointer disabled:opacity-50"
                >
                  <LuCheck /> {isProcessing ? 'Memproses...' : 'Setujui Pengajuan'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
