import React from 'react';

/**
 * RjpRoleTabBar Component
 * Single Responsibility: Mobile-optimized role tab navigation bar untuk RoutePlanningPage.
 */
export const RjpRoleTabBar = ({ tabs, activeTab, onSelectTab }) => {
    if (!tabs || tabs.length <= 1) return null;
    return (
        <div className="workspace-tabs">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onSelectTab(tab.id)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                            isActive
                                ? 'bg-primary text-on-primary border-primary shadow-xs'
                                : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-container hover:text-on-surface'
                        }`}
                    >
                        <Icon className="text-base shrink-0" />
                        <span className="min-w-0 whitespace-normal break-words">{tab.shortLabel || tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
