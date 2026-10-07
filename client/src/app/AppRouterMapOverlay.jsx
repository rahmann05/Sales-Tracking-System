import React from 'react';

// Helper for route-level code splitting (Google Web Vitals Best Practice)

export /** Wrapper: transparent overlay that lets map clicks through */
const MapOverlay = ({
  children
}) => <div className="w-full h-full pointer-events-none">{children}</div>;

/**
 * AppRouter Component
 * Single Responsibility: Route the activeTab to the correct page component
 * with built-in Role-Based Access Control (RBAC).
 */
