import React from 'react';
import { Button } from '../../common/Button';

export const HomeBanner = ({ health, healthLoading, checkHealth }) => {
  return (
    <div className="home-banner">
      <h1 className="home-banner-title">
        Setup <span className="gradient-text">React & Express</span> Modular
      </h1>
      <p className="home-banner-text">
        Struktur project monorepo terpisah antara Frontend (`client/`) dan Backend (`server/`) mengikuti *best practice* arsitektur berteknologi tinggi.
      </p>

      {healthLoading ? (
        <div className="home-banner-status-loading">Memeriksa koneksi server...</div>
      ) : health ? (
        <div className="home-banner-status-success">
          <span className="badge">
            <span className="badge-dot"></span>
            Backend API Status: {health.status} ({health.service})
          </span>
          <Button onClick={() => checkHealth()} variant="secondary">
            Refresh Status
          </Button>
        </div>
      ) : (
        <div className="home-banner-status-error">Gagal terhubung ke backend server Express.</div>
      )}
    </div>
  );
};
