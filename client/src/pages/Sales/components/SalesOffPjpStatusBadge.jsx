import React from 'react';

/**
 * SalesOffPjpStatusBadge Component
 * Single Responsibility: Render a standardized status badge for Off-PJP attendance validation.
 */
export const SalesOffPjpStatusBadge = ({ status }) => {
  switch (status) {
    case 'TERVALIDASI':
      return <span className="admin-status admin-status-released">Tervalidasi (Masuk Target)</span>;

    case 'DITOLAK':
      return <span className="admin-status admin-status-rejected">Ditolak SPV</span>;

    case 'TIDAK_TERVALIDASI':
      return (
        <span className="admin-status admin-status-pending">Tidak Tervalidasi (Lewat Hari)</span>
      );

    case 'MENUNGGU':
    default:
      return <span className="admin-status admin-status-route">Menunggu Validasi SPV</span>;
  }
};
