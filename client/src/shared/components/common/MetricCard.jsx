import React from 'react';

export const MetricCard = ({ label, value, icon: Icon, color, suffix, badge, description, alert = false, valueClassName = 'text-2xl' }) => (
  <div className="app-card bg-surface border border-border-glass rounded-xl p-4">
    <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
      {Icon && <Icon aria-hidden="true" className="text-lg shrink-0" style={{ color }} />}
      <span>{label}</span>
    </div>
    <div className="flex items-baseline justify-between gap-2 flex-wrap">
      <div className={`${valueClassName} font-semibold text-on-surface break-words min-w-0`}>{value} {suffix && <span className="text-xs font-normal text-on-surface-variant">{suffix}</span>}</div>
      {badge !== undefined && <span className={`text-xs rounded-lg px-2 py-1 border ${alert ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-on-surface-variant bg-surface-container border-border-glass'}`}>{badge}</span>}
    </div>
    {description && <p className="text-xs text-on-surface-variant mt-2">{description}</p>}
  </div>
);
