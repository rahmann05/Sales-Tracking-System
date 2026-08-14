import React from 'react';
import { OutletValidationPanel } from './components/OutletValidationPanel';

export const OutletValidationPage = () => {
  return (
    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto', background: 'var(--bg-default)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--on-bg)', marginBottom: '0.5rem' }}>
          Validasi Data Outlet
        </h1>
        <p style={{ color: 'var(--on-bg-variant)', fontSize: '0.875rem' }}>
          Validasi koordinat GPS dan data outlet menggunakan integrasi Google Maps (Geocoding & Places API).
        </p>
      </div>

      <OutletValidationPanel />
    </div>
  );
};
