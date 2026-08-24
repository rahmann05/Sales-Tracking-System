import React from 'react';
import { LuMapPin } from 'react-icons/lu';

/**
 * LocationMappingSection Component
 * Single Responsibility: Manage physical landmark mapping description and submit signature identities.
 */
export const LocationMappingSection = ({
  mappingLocation,
  salesmanName,
  division,
  onChange,
}) => {
  return (
    <div className="outlet-reg-section-card">
      <div className="outlet-reg-section-title">
        <LuMapPin className="text-primary" />
        <span>4. Mapping Patokan Fisik & Data Pengaju</span>
      </div>
      <div className="space-y-4">
        <div>
          <label className="outlet-reg-label">MAPPING LOKASI / PATOKAN FISIK</label>
          <textarea
            rows={2}
            value={mappingLocation}
            onChange={(e) => onChange('mappingLocation', e.target.value)}
            className="outlet-reg-input text-xs"
            placeholder="Contoh: Sebelah Masjid Al-Ikhlas, 50 meter dari gapura RW 03..."
          />
        </div>

        <div className="p-3 bg-surface-container-low rounded-xl border border-border-glass text-xs space-y-1">
          <div>
            Salesman Pengaju:{' '}
            <strong className="text-on-surface">{salesmanName || 'Sales Field'}</strong>
          </div>
          <div>
            Divisi Distribusi:{' '}
            <strong className="text-on-surface">{division}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
