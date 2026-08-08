import React from 'react';
import { RollingMatrixCell } from './RollingMatrixCell';
import '../../../../styles/components/RollingMatrixRow.css';

const DAYS_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * RollingMatrixRow Component
 * Single Responsibility: Render a single Salesperson row inside the CSS Grid Matrix.
 */
export const RollingMatrixRow = ({ row, onCellClick }) => {
  // Compute total weekly visits
  const totalWeeklyVisits = DAYS_LIST.reduce((acc, day) => {
    return acc + (row.schedule?.[day]?.outletsCount || 0);
  }, 0);

  return (
    <div className="matrix-grid-row">
      {/* Sticky Left: Sales Person & Primary Cluster */}
      <div className="matrix-sales-cell sticky-col">
        <div className="matrix-sales-name">{row.salesName}</div>
        <div className="matrix-sales-cluster">{row.primaryCluster}</div>
      </div>

      {/* Monday to Saturday Schedule Cells */}
      {DAYS_LIST.map((day) => (
        <RollingMatrixCell
          key={day}
          day={day}
          dayData={row.schedule?.[day]}
          onClick={() => onCellClick(row.salesId, day, row.schedule?.[day])}
        />
      ))}

      {/* Rightmost: Total Outlets Visited per Week */}
      <div className="matrix-total-cell">
        <span className="matrix-total-value">{totalWeeklyVisits} Toko</span>
      </div>
    </div>
  );
};
