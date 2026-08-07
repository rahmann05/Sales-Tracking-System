import React from 'react';
import { LuTrendingUp } from 'react-icons/lu';
import { Card } from '../../../components/common/Card';

/**
 * OverviewCards Component (Single Responsibility: Displaying KPI Stats)
 * Equal height standard: h-full min-h-[140px] flex flex-col justify-between
 */
export const OverviewCards = ({ totalVisits = 142, completionRate = 84 }) => {
  return (
    <div className="grid grid-cols-2 gap-4 items-stretch">
      {/* Card 1: Total Visits */}
      <Card className="h-full min-h-[140px] flex flex-col justify-between p-5">
        <span className="text-label-bold text-on-surface-variant">
          Total Visits
        </span>
        <div className="flex items-center justify-between mt-3">
          <span className="font-headline text-3xl font-extrabold">
            {totalVisits}
          </span>
          <span className="inline-flex items-center gap-1 bg-secondary-container/30 text-[#3c4d00] px-2.5 py-1 rounded-full text-xs font-bold">
            <LuTrendingUp className="text-sm" />
            +12%
          </span>
        </div>
      </Card>

      {/* Card 2: Completion Rate */}
      <Card className="h-full min-h-[140px] flex flex-col justify-between p-5">
        <span className="text-label-bold text-on-surface-variant">
          Completion
        </span>
        <div className="flex items-center justify-between mt-3">
          <span className="font-headline text-3xl font-extrabold">
            {completionRate}%
          </span>
          <div className="w-10 h-10 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--surface-container-highest)"
                strokeWidth="4"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--tertiary)"
                strokeDasharray={`${completionRate}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </Card>
    </div>
  );
};
