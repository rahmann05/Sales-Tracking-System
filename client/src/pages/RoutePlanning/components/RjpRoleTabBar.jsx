import React from 'react';

/**
 * RjpRoleTabBar Component
 * Single Responsibility: Mobile-optimized role tab navigation bar untuk RoutePlanningPage.
 */
export const RjpRoleTabBar = ({ tabs, activeTab, onSelectTab }) => {
    if (!tabs || tabs.length <= 1) return null;
    return (
        <div className="bg-surface-container-low p-1.5 rounded-2xl border border-border-glass grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onSelectTab(tab.id)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                            isActive
                                ? 'bg-primary text-on-primary border-primary shadow-xs'
                                : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-container hover:text-on-surface'
                        }`}
                    >
                        <Icon className="text-base shrink-0" />
                        <span className="truncate">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
