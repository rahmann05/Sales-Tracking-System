import React from 'react';

/**
 * TeamTrackingHeader Component (Single Responsibility: Page Header)
 * 1 File per Component
 */
export const TeamTrackingHeader = () => {
  return (
    <div className="mb-8">
      <h2 className="page-title">Monitoring Presensi & Tim Lapangan</h2>
      <p className="page-subtitle">
        Pantau lokasi real-time, status check-in, dan log aktivitas seluruh tim sales.
      </p>
    </div>
  );
};
