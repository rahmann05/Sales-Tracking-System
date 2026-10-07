import React from 'react';

// Helper for route-level code splitting (Google Web Vitals Best Practice)

export /** Wrapper: full interactive layer (blocks map clicks) */
const Interactive = ({
  children
}) => <div className="w-full h-full pointer-events-auto">{children}</div>;

/** Wrapper: transparent overlay that lets map clicks through */
