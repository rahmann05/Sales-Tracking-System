import React from 'react';

// Helper for route-level code splitting (Google Web Vitals Best Practice)

export const PageLoading = () => <div className="flex items-center justify-center min-h-[350px] w-full">
        <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-neutral-500 font-sans">Memuat modul...</span>
        </div>
    </div>;

/**
 * RoleWorkspace Component
 * Single Responsibility: Render the role-specific home workspace page.
 */
