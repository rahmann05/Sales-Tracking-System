import React from 'react';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { OutletValidationPanel } from './components/OutletValidationPanel';
import { LuMapPin } from "react-icons/lu";

/**
 * OutletValidationPage Component
 * Single Responsibility: Present Google Maps geocoding and physical GPS verification for Outlets.
 */
export const OutletValidationPage = () => {
  return (
    <div className="workspace-page space-y-6">
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuMapPin className="text-sm" /> GEOLOCATION AUDIT & VERIFIKASI
          </span>
        }
        title="Validasi Titik Koordinat GPS Outlet"
        subtitle="Bandingkan nama, alamat, dan koordinat dengan peta, lalu tinjau serta catat koreksi sebelum dipakai untuk radius presensi."
      />

      <OutletValidationPanel />
    </div>
  );
};
