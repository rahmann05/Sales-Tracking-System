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
    <header
      className={`editorial-page-header ${className}`}
    >
      <div className="editorial-page-heading">
        {badge && (
          <div className="editorial-page-eyebrow">
            {typeof badge === 'string' ? (
              <span>
                {badge}
              </span>
            ) : (
              badge
            )}
          </div>
        )}

        <h1>
          {title}
        </h1>

        {subtitle && (
          <p className="editorial-page-subtitle">
            {subtitle}
          </p>
        )}

        {stats && stats.length > 0 && (
          <div className="editorial-page-stats">
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
        <div className="editorial-page-actions">
          {actions}
        </div>
      )}
    </header>
  );
};
