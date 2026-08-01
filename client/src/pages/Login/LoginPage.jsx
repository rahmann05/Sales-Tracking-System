import React from 'react';
import { LoginHeader } from './components/LoginHeader';
import { LoginFormCard } from './components/LoginFormCard';
import '../../styles/pages/Login.css';

/**
 * LoginPage Component (Page Level Component for Authentication)
 * 1 File per Component
 */
export const LoginPage = ({ onLogin }) => {
  return (
    <div className="login-wrapper">
      <div className="login-glass-card">
        {/* Brand Header */}
        <LoginHeader />

        {/* Credentials Form */}
        <LoginFormCard onLogin={onLogin} />

        {/* Footer info */}
        <div className="login-footer">
          <p>© 2026 PT. SINAR ANUGRAH — Enterprise Sales Tracking</p>
        </div>
      </div>
    </div>
  );
};
