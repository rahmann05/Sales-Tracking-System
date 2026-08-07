import React from 'react';
import { RollingMatrixRow } from './RollingMatrixRow';
import '../../../../styles/components/WeeklyRollingMatrixTable.css';

const DAYS_HEADER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * WeeklyRollingMatrixTable Component
 * Single Responsibility: Interactive 6-Day Rolling Matrix Table for Field Sales.
 * 1 File = 1 Component
 */
export const WeeklyRollingMatrixTable = ({ matrixRows = [], onCellClick }) => {
  return (
    <div className="weekly-matrix-card">
      <div className="weekly-matrix-header">
        <div>
          <h3 className="weekly-matrix-title">Matriks Jadwal Rolling Mingguan (Senin - Sabtu)</h3>
          <p className="weekly-matrix-subtitle">
            Klik pada kotak jadwal untuk menyesuaikan wilayah kunjungan harian sales yang bersangkutan
          </p>
        </div>
        <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-on-surface-variant">
          {matrixRows.length} Sales Lapangan
        </span>
      </div>

      <div className="weekly-matrix-container">
        <table className="weekly-matrix-table">
          <thead>
            <tr>
              <th className="weekly-matrix-th sticky-sales">Sales Rep & Klaster</th>
              {DAYS_HEADER.map((day) => (
                <th key={day} className="weekly-matrix-th">
                  {day}
                </th>
              ))}
              <th className="weekly-matrix-th">Total / Minggu</th>
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row) => (
              <RollingMatrixRow key={row.salesId} row={row} onCellClick={onCellClick} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
