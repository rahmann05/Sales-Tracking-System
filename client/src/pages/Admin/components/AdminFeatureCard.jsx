import React, { memo } from 'react';
import { LuArrowRight, LuLayers } from 'react-icons/lu';

const BADGE_STYLES = {
  alert: 'bg-rose-50 text-rose-700 border-rose-200 font-bold shadow-[0_1px_2px_rgba(244,63,94,0.08)]',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
  info: 'bg-neutral-100 text-neutral-800 border-neutral-200 font-bold',
  neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200/90 font-semibold',
};

/**
 * AdminFeatureCard Component
 * Tactile 3D Card with Layered Depth, Sculptural Embossed Icon, and Unclipped Typography.
 * Every card has the EXACT SAME uniform height (h-[265px]) across all sections.
 */
export const AdminFeatureCard = memo(({
  id,
  title,
  description,
  category,
  categoryLabel,
  icon: Icon,
  badge,
  badgeVariant = 'neutral',
  onClick,
  onMouseEnter,
}) => {
  // Defensive icon fallback: if icon prop is ever missing or undefined, never crash
  const RenderIcon = typeof Icon === 'function' ? Icon : LuLayers;

  return (
    <div
      className="h-[265px] w-full select-none"
      onMouseEnter={() => onMouseEnter && onMouseEnter(id)}
    >
      <div
        onClick={() => onClick(id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(id);
          }
        }}
        className="group relative h-full w-full flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-white via-[#FCFCFD] to-[#F8F8FA] border border-neutral-200/90 border-b-[3.5px] border-b-neutral-300 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_20px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-neutral-300 hover:border-b-neutral-400 hover:shadow-[0_18px_36px_-6px_rgba(0,0,0,0.09),0_8px_16px_-4px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1.5 active:translate-y-0.5 active:border-b-2 active:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out cursor-pointer text-left"
      >
        {/* Specular Ambient Top Rim Light */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent rounded-t-2xl pointer-events-none" />

        {/* ── Top Section: 3D Sculptural Icon Container & Status Badge ── */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          {/* 3D Embossed Icon Medallion */}
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-b from-neutral-700 via-neutral-850 to-neutral-950 text-white flex items-center justify-center text-lg shrink-0 border-t border-t-white/40 border-b-2 border-b-black border-x border-neutral-700/80 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.6),0_6px_14px_-2px_rgba(0,0,0,0.3)] group-hover:scale-105 group-hover:-translate-y-0.5 transition-[transform] duration-200">
            <RenderIcon className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" />
          </div>

          {badge && (
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full border tracking-tight shrink-0 max-w-[140px] truncate ${
                BADGE_STYLES[badgeVariant] || BADGE_STYLES.neutral
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* ── Middle Section: Title + Complete Unclipped Description ── */}
        <div className="flex-1 flex flex-col justify-center my-2 min-h-0">
          <h3 className="text-[14px] font-extrabold text-neutral-900 group-hover:text-black leading-snug tracking-tight m-0 transition-colors">
            {title}
          </h3>

          {/* Full description without clipping or ellipsis */}
          <p className="text-[12px] text-neutral-500 font-normal leading-relaxed m-0 mt-1.5">
            {description}
          </p>
        </div>

        {/* ── Bottom Section: Category Tag & Action Affordance ── */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200/80 truncate">
            {categoryLabel}
          </span>

          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all duration-200 shrink-0">
            <span>Buka Modul</span>
            <LuArrowRight className="text-xs" />
          </div>
        </div>
      </div>
    </div>
  );
});
