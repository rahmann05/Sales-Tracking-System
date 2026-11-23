import React from 'react';
import { LoginFormCard } from './components/LoginFormCard';
import '../../styles/pages/Login.css';

/**
 * LoginPage Component — Apple Editorial / Modern Clean
 * Direct, centered login interface for both Desktop and Mobile (no full-viewport hero scroll).
 */
export const LoginPage = ({ onLogin, loading = false, error = '' }) => {
  return (
    <div className="login-wrapper">
      {/* Mobile: Splash Screen Animation */}
      <div className="login-mobile-splash">
        <div className="login-mobile-splash-logo overflow-hidden shadow-lg">
          <img
            src="/logo-mark.png"
            alt="Sinar Anugrah"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="login-mobile-splash-title">Sinar Anugrah</h1>
        <p className="login-mobile-splash-subtitle">Sales & Distribusi System</p>
      </div>

      {/* Main Direct Login Form Container (Desktop & Mobile) */}
      <div className="login-direct-container">
        <div className="login-form-container animate-fade-in-up">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center gap-2 mb-2">
            <img
              src="/logo-mark.png"
              alt="CV Sinar Anugrah"
              className="w-14 h-14 rounded-2xl shadow-sm object-cover mb-1 border border-border-glass"
            />
            <h1 className="text-2xl font-black text-on-surface tracking-tight">
              CV. SINAR ANUGRAH
            </h1>
            <p className="text-xs text-on-surface-variant max-w-xs">Platform Sales & Distribusi</p>
          </div>

          {/* Login Card */}
          <div className="login-card shadow-sm border border-border-glass">
            <div className="login-card-header">
              <h2 className="login-card-title">Selamat Datang</h2>
              <p className="login-card-subtitle">Masuk dengan akun Anda untuk melanjutkan</p>
            </div>
            <LoginFormCard onLogin={onLogin} loading={loading} error={error} />
          </div>

          {/* Footer */}
          <div className="login-footer mt-2">
            <p>© 2026 CV. Sinar Anugrah </p>
          </div>
        </div>
      </div>
    </div>
  );
};
