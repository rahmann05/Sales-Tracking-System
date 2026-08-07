import { useState, useCallback } from 'react';

/**
 * useTabNavigation Hook
 * Single Responsibility: Manage active tab state with role-based default.
 */
export const useTabNavigation = (defaultTab = 'role-workspace') => {
    const [activeTab, setActiveTab] = useState(defaultTab);

    const goToWorkspace = useCallback(() => {
        setActiveTab('role-workspace');
    }, []);

    return { activeTab, setActiveTab, goToWorkspace };
};
