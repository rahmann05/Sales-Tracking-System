import React from 'react';
import { LuStore, LuUser, LuPhone, LuMapPin, LuRefreshCw, LuSparkles } from 'react-icons/lu';

const FieldInput = ({ icon: Icon, value, onChange, placeholder }) => (
    <div className="flex items-center bg-surface px-3 py-2 rounded-xl border border-border-glass focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
        <Icon className="text-on-surface-variant text-sm mr-2 shrink-0" />
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="bg-transparent text-xs text-on-surface w-full outline-none font-semibold placeholder:font-normal placeholder:text-on-surface-variant/60"
        />
    </div>
);

/**
 * OffPjpIdentityForm Component
 * Single Responsibility: Form identitas outlet, pemilik, telepon & alamat GPS auto-fill
 * untuk absen toko luar RJP.
 */
export const OffPjpIdentityForm = ({
    outletName, onOutletNameChange,
    customerName, onCustomerNameChange,
    phone, onPhoneChange,
    address, onAddressChange,
    isAddressAutoFetched, isGeocodingLoading,
    userLocation, onRefreshAddress,
}) => (
    <div className="space-y-3 bg-surface-variant/20 p-4 rounded-2xl border border-border-glass">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
            <LuStore className="text-primary text-sm" />
            <span>Identitas Outlet & Pemilik Toko:</span>
        </h4>

        <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>Nama Toko / Outlet *</span>
                <span className="text-[10px] font-normal text-rose-500">Wajib diisi</span>
            </label>
            <FieldInput
                icon={LuStore}
                value={outletName}
                onChange={(e) => onOutletNameChange(e.target.value)}
                placeholder="Contoh: Toko Berkah Mandiri 2"
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                    <span>Nama Pemilik / Customer *</span>
                    <span className="text-[10px] font-normal text-rose-500">Wajib</span>
                </label>
                <FieldInput
                    icon={LuUser}
                    value={customerName}
                    onChange={(e) => onCustomerNameChange(e.target.value)}
                    placeholder="Nama Pemilik Toko"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">No. Telepon / WhatsApp</label>
                <FieldInput
                    icon={LuPhone}
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                />
            </div>
        </div>

        <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                    <LuMapPin className="text-primary text-xs" />
                    <span>Alamat Lengkap & Detail (Auto-fill GPS):</span>
                </label>
                <div className="flex items-center gap-2">
                    {isAddressAutoFetched && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <LuSparkles className="text-[11px]" />
                            Detail RT/RW dari GPS
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={onRefreshAddress}
                        className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Deteksi ulang alamat dari GPS"
                    >
                        <LuRefreshCw className={`text-[10px] ${isGeocodingLoading ? 'animate-spin' : ''}`} />
                        <span>Perbarui Alamat</span>
                    </button>
                </div>
            </div>

            <div className="relative">
                <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    placeholder="Mendeteksi lokasi satelit GPS dan mengambil detail No, RT/RW, Kelurahan, Kecamatan..."
                    className="w-full bg-surface p-2.5 rounded-xl border border-border-glass text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/60 font-medium leading-relaxed"
                />
                {isGeocodingLoading && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-primary font-semibold bg-surface/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-xs border border-primary/20">
                        <LuRefreshCw className="animate-spin text-xs" />
                        <span>Mengambil alamat detail...</span>
                    </div>
                )}
            </div>

            {userLocation && (
                <div className="text-[10px] text-on-surface-variant font-mono flex items-center gap-1.5 flex-wrap">
                    <LuMapPin className="text-primary text-xs shrink-0" />
                    <span>Lat: {userLocation.lat.toFixed(5)}, Lng: {userLocation.lng.toFixed(5)}</span>
                    <span>• Akurasi: ±{userLocation.accuracy}m</span>
                </div>
            )}
        </div>
    </div>
);
