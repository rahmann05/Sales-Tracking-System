import React from 'react';
import { LuRefreshCw, LuActivity } from 'react-icons/lu';
import { Button } from '../../../components/common/Button';

/**
 * ReportsHeader Component (Single Responsibility: Page Header & API Actions)
 * 1 File per Component
 */
export const ReportsHeader = ({ health, usersLoading, onCheckHealth, onFetchUsers }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="page-title">Laporan & Integrasi REST API</h2>
        <p className="page-subtitle">
          Data transaksi sales real-time yang disinkronisasi dari Express Server backend.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {health ? (
          <span className="badge-base badge-lime flex items-center gap-2">
            <span className="pulse-dot"></span> API Server Active: {health.status}
          </span>
        ) : (
          <Button variant="secondary" size="sm" icon={LuActivity} onClick={onCheckHealth}>
            Check Server Status
          </Button>
        )}
        <Button
          variant="primary"
          icon={LuRefreshCw}
          disabled={usersLoading}
          onClick={onFetchUsers}
        >
          {usersLoading ? 'Memuat...' : 'Fetch Users API'}
        </Button>
      </div>
    </div>
  );
};
