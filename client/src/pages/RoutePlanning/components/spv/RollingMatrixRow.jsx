import React from 'react';
import { RollingMatrixCell } from './RollingMatrixCell';
import '../../../../styles/components/RollingMatrixRow.css';

const DAYS_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * RollingMatrixRow Component
 * Single Responsibility: Render a single Salesperson row inside the Weekly Rolling Matrix.
 * 1 File = 1 Component
 */
export const RollingMatrixRow = ({ row, onCellClick }) => {
  // Compute total weekly visits
  const totalWeeklyVisits = DAYS_LIST.reduce((acc, day) => {
    return acc + (row.schedule?.[day]?.outletsCount || 0);
  }, 0);

  return (
    <tr>
      {/* Sticky Left: Sales Person & Primary Cluster */}
      <td className="matrix-row-sales">
        <div className="matrix-sales-name">{row.salesName}</div>
        <div className="matrix-sales-cluster">{row.primaryCluster}</div>
      </td>

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
      <td className="matrix-row-total">
        {totalWeeklyVisits} Toko
      </td>
    </tr>
  );
};
