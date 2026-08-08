import React from 'react';
import { SUPERVISOR_TABS } from '../../../constants/supervisor';

/**
 * SupervisorTabBar Component
 * Single Responsibility: Render main tab navigation bar untuk Supervisor workspace.
 */
export const SupervisorTabBar = ({ activeTab, onSelectTab, pendingApprovals = 0, pendingIncidents = 0 }) => {
    const badgeFor = (tabId) => {
        if (tabId === 'approvals' && pendingApprovals > 0) return pendingApprovals;
        if (tabId === 'incidents' && pendingIncidents > 0) return pendingIncidents;
        return null;
    };

    return (
        <div className="flex items-center gap-2 border-b border-border-glass pb-3 overflow-x-auto no-scrollbar">
            {SUPERVISOR_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const badge = badgeFor(tab.id);

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onSelectTab(tab.id)}
                        className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${isActive
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface'
                            }`}
                    >
                        <Icon className="text-base" />
                        <span>{tab.label}</span>
                        {badge !== null && (
                            <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${isActive
                                        ? tab.id === 'incidents'
                                            ? 'bg-white text-rose-600'
                                            : 'bg-white text-primary'
                                        : tab.id === 'incidents'
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-blue-500 text-white'
                                    }`}
                            >
                                {badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
