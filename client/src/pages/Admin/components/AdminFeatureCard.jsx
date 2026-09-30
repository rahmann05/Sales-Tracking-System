import React from 'react';
import { LuArrowRight } from 'react-icons/lu';

/**
 * AdminFeatureCard Component
 * Google Material 3 / Apple Editorial Monochrome Card
 * Symmetrical, uniform height, pixel-perfect alignment.
 */
export const AdminFeatureCard = ({
  id,
  title,
  description,
  categoryLabel,
  icon: Icon,
  badge,
  badgeVariant = 'neutral',
  onClick,
}) => {
  const badgeStyles = {
    alert: 'bg-rose-50 text-rose-800 border-rose-200/80 font-bold',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-bold',
    info: 'bg-blue-50 text-blue-800 border-blue-200/80 font-bold',
    neutral: 'bg-surface-container text-on-surface-variant border-border-glass font-medium',
  };

  return (
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
      className="group flex flex-col justify-between p-5 rounded-2xl bg-surface border border-border-glass shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer select-none text-left h-[180px]"
    >
      {/* Top Section: Icon & Status Badge */}
      <div>
        <div className="flex items-center justify-between gap-3 h-11">
          <div className="w-11 h-11 rounded-xl bg-surface-container border border-border-glass text-on-surface flex items-center justify-center text-lg shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-150">
            <Icon />
          </div>

          {badge && (
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full border tracking-tight shrink-0 truncate max-w-[140px] ${
                badgeStyles[badgeVariant] || badgeStyles.neutral
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Feature Title (Fixed 1-line height for perfect symmetry) */}
        <h3 className="text-sm sm:text-[15px] font-bold text-on-surface group-hover:text-primary transition-colors leading-tight m-0 mt-3 truncate">
          {title}
        </h3>

        {/* Description (Fixed 2-line height for perfect symmetry) */}
        <p className="text-xs text-on-surface-variant font-normal leading-relaxed m-0 mt-1 line-clamp-2 h-8">
          {description}
        </p>
      </div>

      {/* Bottom Section: Category Tag & Action Affordance */}
      <div className="pt-2.5 border-t border-border-glass flex items-center justify-between gap-2 mt-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md border border-border-glass truncate">
          {categoryLabel}
        </span>

        <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform shrink-0">
          <span>Buka</span>
          <LuArrowRight className="text-sm" />
        </div>
      </div>
    </div>
  );
};
