import React, { useState } from 'react';
import { RollingMatrixRow } from './RollingMatrixRow';
import { MobileMatrixFilters } from './MobileMatrixFilters';
import { MobileMatrixSalesCard } from './MobileMatrixSalesCard';
import '../../../../styles/components/WeeklyRollingMatrixTable.css';

const DAYS_HEADER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * WeeklyRollingMatrixTable Component (Parent)
 * Single Responsibility: Compose desktop grid (RollingMatrixRow) + mobile card view
 * (MobileMatrixFilters + MobileMatrixSalesCard) untuk matriks rolling 6 hari.
 */
export const WeeklyRollingMatrixTable = ({ matrixRows = [], onCellClick }) => {
  const [mobileSelectedSales, setMobileSelectedSales] = useState('ALL');
  const [mobileSelectedDay, setMobileSelectedDay] = useState('ALL');

  const displayRows = matrixRows.filter(
    (row) => mobileSelectedSales === 'ALL' || row.salesId === mobileSelectedSales
  );

  const daysToDisplay =
    mobileSelectedDay === 'ALL' ? DAYS_HEADER : DAYS_HEADER.filter((d) => d === mobileSelectedDay);

  return (
    <div className="weekly-matrix-card">
      <div className="weekly-matrix-header flex-col md:flex-row items-start md:items-center gap-3">
        <div>
          <h3 className="weekly-matrix-title">Matriks Jadwal Rolling Mingguan (Senin - Sabtu)</h3>
          <p className="weekly-matrix-subtitle">
            Klik pada kotak jadwal untuk menyesuaikan wilayah kunjungan harian sales yang bersangkutan
          </p>
        </div>
        <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-on-surface-variant shrink-0">
          {matrixRows.length} Sales Lapangan
        </span>
      </div>

      {/* DESKTOP VIEW (md+): 8-Column Grid Table */}
      <div className="weekly-matrix-scroll-wrapper hidden md:block">
        <div className="weekly-matrix-grid">
          <div className="matrix-grid-header">
            <div className="matrix-th-cell sticky-col">Sales Rep & Klaster</div>
            {DAYS_HEADER.map((day) => (
              <div key={day} className="matrix-th-cell">{day}</div>
            ))}
            <div className="matrix-th-cell total-col">Total / Minggu</div>
          </div>

          <div className="matrix-grid-body">
            {matrixRows.map((row) => (
              <RollingMatrixRow key={row.salesId} row={row} onCellClick={onCellClick} />
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE VIEW (<md): Filters + Card Matrix */}
      <div className="block md:hidden p-3 bg-surface-container-lowest border-t border-border-glass">
        <MobileMatrixFilters
          matrixRows={matrixRows}
          days={DAYS_HEADER}
          selectedSales={mobileSelectedSales}
          onSelectSales={setMobileSelectedSales}
          selectedDay={mobileSelectedDay}
          onSelectDay={setMobileSelectedDay}
        />

        <div className="space-y-4">
          {displayRows.map((row) => (
            <MobileMatrixSalesCard
              key={row.salesId}
              row={row}
              days={daysToDisplay}
              onCellClick={onCellClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
