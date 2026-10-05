import React, { memo } from 'react';
import { LuArrowUpRight } from 'react-icons/lu';

/**
 * AdminStatCard Component
 * Apple Editorial Enterprise Monochrome KPI Card.
 * Clean white surface, graphite icon containers, obsidian metric values,
 * and semantic badges.
 */
export const AdminStatCard = memo(({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeColor = 'neutral',
  onClick,
}) => {
  const isAlert = badgeColor === 'rose';

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
      className={`group p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-neutral-400 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-all duration-200 flex flex-col justify-between min-h-[125px] select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center text-lg shrink-0 group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900 transition-all duration-200">
            <Icon />
          </div>
          <div>
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block leading-none">
              {title}
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-black text-neutral-900 tracking-tight leading-none">
                {value}
              </span>
              {badgeText && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border leading-tight ${
                    isAlert
                      ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-200 font-semibold'
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </div>
          </div>
        </div>

        {onClick && (
          <div className="w-6 h-6 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 opacity-60 group-hover:opacity-100 group-hover:bg-neutral-900 group-hover:text-white transition-all">
            <LuArrowUpRight className="text-xs" />
          </div>
        )}
      </div>

      {subtext && (
        <p className="text-[11px] text-neutral-500 font-medium border-t border-neutral-100 pt-2.5 m-0 mt-2 line-clamp-1 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
});
