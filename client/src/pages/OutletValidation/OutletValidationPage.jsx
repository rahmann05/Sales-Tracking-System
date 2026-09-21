import React from 'react';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { OutletValidationPanel } from './components/OutletValidationPanel';
import { LuMapPin, LuCompass } from 'react-icons/lu';

/**
 * OutletValidationPage Component
 * Single Responsibility: Present Google Maps geocoding and physical GPS verification for Outlets.
 */
export const OutletValidationPage = () => {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuMapPin className="text-sm" /> GEOLOCATION AUDIT & VERIFIKASI
          </span>
        }
        title="Validasi Titik Koordinat GPS Outlet"
        subtitle="Validasi akurasi koordinat GPS fisik toko menggunakan integrasi Google Maps Geocoding & Places API untuk memastikan radius presensi sales presisi."
      />

      <OutletValidationPanel />
    </div>
  );
};
