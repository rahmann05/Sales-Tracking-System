import React from 'react';
import { SUPERVISOR_TABS } from '../../../constants/supervisor';

/**
 * SupervisorTabBar Component
 * Single Responsibility: Symmetric, Apple-Editorial segmented workspace tab bar for Supervisor.
 * Perfectly balanced 3-column grid on desktop/tablet with identical widths and heights.
 *
 * @param {Object} props
 * @param {string} props.activeTab
 * @param {Function} props.onSelectTab
 * @param {number} [props.pendingActions=0] - Total pending operational actions in Action Center
 */
export const SupervisorTabBar = ({
  activeTab,
  onSelectTab,
  pendingActions = 0,
}) => {
  return (
    <div className="w-full bg-surface-container/60 p-1.5 rounded-2xl border border-border-glass shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 w-full">
        {SUPERVISOR_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'action_center' && pendingActions > 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`w-full py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                isActive
                  ? 'bg-surface text-on-surface border-border-glass shadow-sm'
                  : 'bg-transparent border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface/40'
              }`}
            >
              <Icon className={`text-base shrink-0 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} />
              <span className="truncate tracking-tight">{tab.label}</span>
              {showBadge && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight shrink-0 bg-rose-500 text-white shadow-xs animate-pulse"
                >
                  {pendingActions}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
