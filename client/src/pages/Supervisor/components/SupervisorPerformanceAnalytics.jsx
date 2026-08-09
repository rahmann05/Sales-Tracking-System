import React, { useMemo, useState, useEffect } from 'react';
import { LuUser } from 'react-icons/lu';
import { calculateSalesPerformance } from '../../../services/salesPerformanceService';
import { ComplianceKpiCards } from './ComplianceKpiCards';
import { AdherenceGauge } from './AdherenceGauge';
import { SalesRepProgressCard } from './SalesRepProgressCard';
import { pjpApi } from '../../../services/api';

const isDone = (s) => s.status === 'COMPLETED' || s.status === 'ORDERED' || s.status === 'VISITED';
const isActive = (s) => s.status === 'IN_VISIT' || s.status === 'ARRIVED';
const isClosed = (s) => s.status === 'CLOSED' || s.status === 'SKIPPED' || s.status === 'CLOSED_REPORTED';

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

  // Breakdown per sales dari PJP hari ini (PostgreSQL) — bukan data dummy
  const [todayPjps, setTodayPjps] = useState([]);
  useEffect(() => {
    let isMounted = true;
    pjpApi.getAllPjps()
      .then((res) => {
        if (!isMounted) return;
        const pjps = Array.isArray(res?.data) ? res.data : [];
        const todayStr = new Date().toDateString();
        setTodayPjps(pjps.filter((p) => new Date(p.date).toDateString() === todayStr));
      })
      .catch(() => { });
    return () => { isMounted = false; };
  }, []);

  const salesTeamBreakdown = useMemo(
    () =>
      todayPjps.map((p) => {
        const stops = p.stops || [];
        const completed = stops.filter(isDone).length;
        const total = stops.length || 1;
        return {
          name: p.user?.name || 'Sales',
          cluster: p.user?.cluster?.name || '-',
          plan: p.name || 'RJP',
          day: new Date(p.date).toLocaleDateString('id-ID', { weekday: 'long' }),
          stops,
          completed,
          inVisit: stops.filter(isActive).length,
          closed: stops.filter(isClosed).length,
          total,
          progress: Math.round((completed / total) * 100),
        };
      }),
    [todayPjps]
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
