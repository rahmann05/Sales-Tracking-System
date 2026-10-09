import React from 'react';
import {FeaturePolicyNotice} from '../shared/components/common/FeaturePolicyNotice';

// Helper for route-level code splitting (Google Web Vitals Best Practice)

export /** Wrapper: full interactive layer (blocks map clicks) */
const Interactive = ({
  children
}) => <div className="w-full h-full pointer-events-auto"><FeaturePolicyNotice/>{children}</div>;

/** Wrapper: transparent overlay that lets map clicks through */
