import React from 'react';
import { LuArrowUpRight } from 'react-icons/lu';

/**
 * AdminStatCard Component
 * Apple Editorial Monochrome executive KPI statistic card.
 * Single Responsibility: Present a single executive KPI statistic with icon, value, and interactive link.
 */
export const AdminStatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeColor = 'emerald',
  onClick,
}) => {
  const badgeStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-800 border-rose-200/80',
    blue: 'bg-blue-50 text-blue-800 border-blue-200/80',
    neutral: 'bg-surface-container text-on-surface-variant border-border-glass',
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group p-4 sm:p-5 rounded-2xl bg-surface border border-border-glass shadow-xs transition-all duration-150 flex flex-col justify-between h-[120px] select-none ${
        onClick
          ? 'cursor-pointer hover:border-primary/40 hover:shadow-sm'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container border border-border-glass flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-150">
            <Icon className="text-lg" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block leading-none">
              {title}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-on-surface tracking-tight leading-none">
                {value}
              </span>
              {badgeText && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border leading-tight ${
                    badgeStyles[badgeColor] || badgeStyles.neutral
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </div>
          </div>
        </div>

        {onClick && (
          <div className="w-6 h-6 rounded-lg bg-surface-container border border-border-glass flex items-center justify-center text-on-surface-variant opacity-60 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white transition-all">
            <LuArrowUpRight className="text-xs" />
          </div>
        )}
      </div>

      {subtext && (
        <p className="text-[11px] text-on-surface-variant font-medium border-t border-border-glass pt-2 m-0 line-clamp-1 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};
