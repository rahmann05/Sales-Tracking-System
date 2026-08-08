import React, { useState } from 'react';
import { LuUser, LuCalendar, LuStore, LuChevronRight } from 'react-icons/lu';
import { RollingMatrixRow } from './RollingMatrixRow';
import '../../../../styles/components/WeeklyRollingMatrixTable.css';

const DAYS_HEADER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * WeeklyRollingMatrixTable Component
 * Single Responsibility: Interactive 6-Day Rolling Matrix for Field Sales.
 * Supports Desktop 8-Column Grid View and Mobile Card/Tab Matrix View.
 */
export const WeeklyRollingMatrixTable = ({ matrixRows = [], onCellClick }) => {
  const [mobileSelectedSales, setMobileSelectedSales] = useState('ALL');
  const [mobileSelectedDay, setMobileSelectedDay] = useState('ALL');

  // Filter rows for mobile view
  const displayRows = matrixRows.filter((row) => {
    if (mobileSelectedSales === 'ALL') return true;
    return row.salesId === mobileSelectedSales;
  });

  return (
    <div className="weekly-matrix-card">
      {/* Table Header */}
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

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (md and up): 8-Column Grid Table                             */}
      {/* ========================================================================= */}
      <div className="weekly-matrix-scroll-wrapper hidden md:block">
        <div className="weekly-matrix-grid">
          {/* Header Row */}
          <div className="matrix-grid-header">
            <div className="matrix-th-cell sticky-col">Sales Rep & Klaster</div>
            {DAYS_HEADER.map((day) => (
              <div key={day} className="matrix-th-cell">
                {day}
              </div>
            ))}
            <div className="matrix-th-cell total-col">Total / Minggu</div>
          </div>

          {/* Body Rows */}
          <div className="matrix-grid-body">
            {matrixRows.map((row) => (
              <RollingMatrixRow key={row.salesId} row={row} onCellClick={onCellClick} />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (under md): Card & Tab Matrix View                            */}
      {/* ========================================================================= */}
      <div className="block md:hidden p-3 bg-surface-container-lowest border-t border-border-glass">
        {/* Mobile Filters */}
        <div className="space-y-2 mb-4 bg-surface-container-low p-3 rounded-2xl border border-border-glass">
          {/* Salesperson Selector Pills */}
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <LuUser className="text-xs text-primary" /> Filter Salesman:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setMobileSelectedSales('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                  mobileSelectedSales === 'ALL'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                Semua Sales ({matrixRows.length})
              </button>
              {matrixRows.map((row) => (
                <button
                  key={row.salesId}
                  type="button"
                  onClick={() => setMobileSelectedSales(row.salesId)}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                    mobileSelectedSales === row.salesId
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {row.salesName}
                </button>
              ))}
            </div>
          </div>

          {/* Day Selector Pills */}
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <LuCalendar className="text-xs text-emerald-600" /> Filter Hari:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setMobileSelectedDay('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                  mobileSelectedDay === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                Semua Hari
              </button>
              {DAYS_HEADER.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setMobileSelectedDay(day)}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                    mobileSelectedDay === day
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Sales Cards List */}
        <div className="space-y-4">
          {displayRows.map((row) => {
            const totalWeeklyVisits = DAYS_HEADER.reduce((acc, day) => {
              return acc + (row.schedule?.[day]?.outletsCount || 0);
            }, 0);

            const daysToDisplay = mobileSelectedDay === 'ALL'
              ? DAYS_HEADER
              : DAYS_HEADER.filter((d) => d === mobileSelectedDay);

            return (
              <div
                key={row.salesId}
                className="bg-surface border border-border-glass rounded-2xl p-3.5 shadow-sm space-y-3"
              >
                {/* Sales Card Header */}
                <div className="flex items-center justify-between border-b border-border-glass pb-2.5">
                  <div>
                    <h4 className="font-extrabold text-sm text-on-surface">{row.salesName}</h4>
                    <p className="text-xs text-on-surface-variant">{row.primaryCluster}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-extrabold flex items-center gap-1">
                      <LuStore className="text-xs" /> {totalWeeklyVisits} Toko
                    </span>
                  </div>
                </div>

                {/* Days Schedule Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {daysToDisplay.map((day) => {
                    const dayData = row.schedule?.[day];
                    return (
                      <div
                        key={day}
                        onClick={() => onCellClick(row.salesId, day, dayData)}
                        className="bg-surface-container-low border border-border-glass rounded-xl p-2.5 flex flex-col justify-between gap-1.5 cursor-pointer hover:border-primary active:scale-[0.99] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-extrabold text-on-surface uppercase">
                            {day}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                            {dayData?.outletsCount || 0} Toko <LuChevronRight className="text-xs" />
                          </span>
                        </div>

                        <div className="text-xs font-extrabold text-on-surface leading-tight">
                          {dayData?.clusterName || 'Libur / Tidak ada jadwal'}
                        </div>

                        <div className="text-[10px] text-on-surface-variant font-medium">
                          Kecamatan: {dayData?.subDistrict || '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
