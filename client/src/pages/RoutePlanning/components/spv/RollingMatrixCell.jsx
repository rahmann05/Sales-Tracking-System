import React from 'react';
import { LuStore } from 'react-icons/lu';
import '../../../../styles/components/RollingMatrixCell.css';

/**
 * RollingMatrixCell Component
 * Single Responsibility: Interactive Day Cell displaying sub-route and outlet count for a given day.
 * 1 File = 1 Component
 */
export const RollingMatrixCell = ({ day, dayData, onClick }) => {
  if (!dayData) {
    return (
      <td className="matrix-cell">
        <div className="matrix-cell-card opacity-50">
          <span className="text-xs text-on-surface-variant italic">Libur / Tidak ada jadwal</span>
        </div>
      </td>
    );
  }

  return (
    <td className="matrix-cell">
      <div
        onClick={onClick}
        className="matrix-cell-card"
        title="Klik untuk mengubah rute hari ini"
      >
        <div className="matrix-cell-title">{dayData.clusterName}</div>
        <div className="matrix-cell-meta">
          <span className="matrix-cell-quota flex items-center gap-1">
            <LuStore className="text-[10px]" />
            {dayData.outletsCount} Toko
          </span>
          <span className="matrix-cell-area">{dayData.subDistrict}</span>
        </div>
      </div>
    </td>
  );
};
