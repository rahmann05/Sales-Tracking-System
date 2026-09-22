import React from 'react';

/**
 * PageHeader Component
 * Single Responsibility: Unified, high-contrast, premium page banner header
 * used across all pages to standardize title, category badge, subtitle, and action buttons.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.badge] - Category or scope badge (e.g. icon + text)
 * @param {string} props.title - Main high-level page title
 * @param {string} [props.subtitle] - Contextual description or instructions
 * @param {React.ReactNode} [props.actions] - Right-aligned action buttons or toolbars
 * @param {Array<{ label: string, value: string|number, color?: string }>} [props.stats] - Summary metrics pills
 * @param {string} [props.className] - Optional extra class names
 */
export const PageHeader = ({
  badge,
  title,
  subtitle,
  actions,
  stats = [],
  className = '',
}) => {
  return (
    <div
      className={`bg-surface border border-border-glass rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all page-header-mobile ${className}`}
    >
      <div className="space-y-1.5 min-w-0">
        {badge && (
          <div className="flex items-center gap-2 flex-wrap">
            {typeof badge === 'string' ? (
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                {badge}
              </span>
            ) : (
              badge
            )}
          </div>
        )}

        <h1 className="text-lg sm:text-xl md:text-2xl font-black text-on-surface tracking-tight m-0">
          {title}
        </h1>

        {subtitle && (
          <p className="text-xs sm:text-sm text-on-surface-variant m-0 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}

        {stats && stats.length > 0 && (
          <div className="flex items-center gap-2 pt-2 flex-wrap page-header-stats-mobile">
            {stats.map((st, idx) => (
              <div
                key={idx}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  st.color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                    : st.color === 'amber'
                    ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                    : st.color === 'rose'
                    ? 'bg-rose-50 text-rose-800 border-rose-200/60'
                    : 'bg-surface-container/70 text-on-surface border-border-glass'
                }`}
              >
                <span className="text-[11px] text-on-surface-variant font-medium">{st.label}:</span>
                <span className="font-bold text-on-surface">{st.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center shrink-0 w-full lg:w-auto page-header-actions-mobile">
          {actions}
        </div>
      )}
    </div>
  );
};
