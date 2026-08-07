import React from 'react';

/**
 * AccessDenied Component
 * Single Responsibility: Display a consistent "Access Denied" fallback UI
 * when a user tries to access a role-restricted page.
 */
export const AccessDenied = ({ title, description, onGoBack }) => {
    return (
        <div className="p-8 text-center bg-surface border border-red-500/30 rounded-3xl m-6 space-y-3">
            <h3 className="text-lg font-bold text-red-600">{title}</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">{description}</p>
            <button
                onClick={onGoBack}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold text-xs shadow-md"
            >
                Kembali ke Workspace Saya
            </button>
        </div>
    );
};
