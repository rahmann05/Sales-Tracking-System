import React, { useMemo } from 'react';
import { LuUser } from 'react-icons/lu';
import { calculateSalesPerformance } from '../../../services/salesPerformanceService';
import { ComplianceKpiCards } from './ComplianceKpiCards';
import { AdherenceGauge } from './AdherenceGauge';
import { SalesRepProgressCard } from './SalesRepProgressCard';

// Mock: pemetaan tim sales ke segmen stops (sampai data real tersedia)
const SALES_TEAM_SEGMENTS = [
  { name: 'Budi Santoso', cluster: 'Klaster Cimahi Tengah', plan: 'RJP-CIMAHI-01', day: 'Senin', slice: [0, 10] },
  { name: 'Siti Rahma', cluster: 'Klaster Padalarang', plan: 'RJP-PADALARANG-01', day: 'Selasa', slice: [10, 20] },
  { name: 'Agus Wijaya', cluster: 'Klaster Lembang', plan: 'RJP-LEMBANG-01', day: 'Rabu', slice: [20, 30] },
];

const isDone = (s) => s.status === 'COMPLETED' || s.status === 'ORDERED';
const isActive = (s) => s.status === 'IN_VISIT' || s.status === 'ARRIVED';
const isClosed = (s) => s.status === 'CLOSED' || s.status === 'SKIPPED';

/**
 * SupervisorPerformanceAnalytics Component (Orchestrator)
 * Single Responsibility: Compose KPI compliance cards, adherence gauge, dan kartu progres per sales.
 * Kalkulasi didelegasikan ke salesPerformanceService + useMemo breakdown.
 */
export const SupervisorPerformanceAnalytics = ({ salesStops = [], offPjpAttendances = [] }) => {
  const overallMetrics = useMemo(
    () => calculateSalesPerformance({ salesStops, offPjpAttendances, targetDailyVisits: 10 }),
    [salesStops, offPjpAttendances]
  );

  const salesTeamBreakdown = useMemo(
    () =>
      SALES_TEAM_SEGMENTS.map(({ slice, ...rep }) => {
        const stops = salesStops.slice(slice[0], slice[1]);
        const completed = stops.filter(isDone).length;
        const total = stops.length || 10;
        return {
          ...rep,
          stops,
          completed,
          inVisit: stops.filter(isActive).length,
          closed: stops.filter(isClosed).length,
          total,
          progress: Math.round((completed / total) * 100),
        };
      }),
    [salesStops]
  );

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-glass rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
        <ComplianceKpiCards metrics={overallMetrics} />
        <AdherenceGauge metrics={overallMetrics} />
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
            <LuUser className="text-primary text-base" />
            <span>Progres per Sales Representative</span>
          </h4>
          <p className="text-xs text-on-surface-variant">
            Realisasi kunjungan harian per sales person di bawah supervisi Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {salesTeamBreakdown.map((rep) => (
            <SalesRepProgressCard key={rep.name} rep={rep} />
          ))}
        </div>
      </div>
    </div>
  );
};
