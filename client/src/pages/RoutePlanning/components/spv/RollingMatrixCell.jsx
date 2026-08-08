import React from 'react';
import { LuStore } from 'react-icons/lu';
import '../../../../styles/components/RollingMatrixCell.css';

/**
 * RollingMatrixCell Component
 * Single Responsibility: Interactive Day Cell displaying sub-route and outlet count for a given day.
 */
export const RollingMatrixCell = ({ day, dayData, onClick }) => {
  if (!dayData) {
    return (
      <div className="matrix-day-cell">
        <div className="matrix-cell-card empty">
          <span className="text-xs text-on-surface-variant italic">Libur / Kosong</span>
        </div>
      </div>
    );
  }

  return (
    <div className="matrix-day-cell">
      <div
        onClick={onClick}
        className="matrix-cell-card"
        title="Klik untuk mengubah rute hari ini"
      >
        <div className="matrix-cell-title">{dayData.clusterName}</div>
        <div className="matrix-cell-meta">
          <span className="matrix-cell-quota">
            <LuStore className="text-[10px]" />
            {dayData.outletsCount} Toko
          </span>
          <span className="matrix-cell-area">{dayData.subDistrict}</span>
        </div>
      </div>
    </div>
  );
};
