import React from 'react';
import { LuLayers } from 'react-icons/lu';

/**
 * LoginHeader Component (Single Responsibility: Brand Logo & Title Header)
 * 1 File per Component
 */
export const LoginHeader = () => {
  return (
    <div className="text-center">
      <div className="login-brand-icon">
        <LuLayers />
      </div>
      <h1 className="login-title">SalesFlow</h1>
      <p className="login-subtitle">SINAR ANUGRAH — Route Optimizer & Tracking</p>
    </div>
  );
};
