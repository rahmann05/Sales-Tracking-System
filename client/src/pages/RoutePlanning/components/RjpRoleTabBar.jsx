import React from 'react';

/**
 * RjpRoleTabBar Component
 * Single Responsibility: Mobile-optimized role tab navigation bar untuk RoutePlanningPage.
 */
export const RjpRoleTabBar = ({ tabs, activeTab, onSelectTab }) => (
    <div className="rjp-role-tab-bar">
        {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    className={`rjp-role-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                    <Icon className="text-base shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="inline sm:hidden">{tab.shortLabel}</span>
                </button>
            );
        })}
    </div>
);
