import React from 'react';
import { LuLayers } from 'react-icons/lu';
import { LoginFormCard } from './components/LoginFormCard';
import '../../styles/pages/Login.css';

/**
 * LoginPage Component — Apple Editorial / Modern Clean
 * Direct, centered login interface for both Desktop and Mobile (no full-viewport hero scroll).
 */
export const LoginPage = ({ onLogin }) => {
  return (
    <div className="login-wrapper">
      {/* Mobile: Splash Screen Animation */}
      <div className="login-mobile-splash">
        <div className="login-mobile-splash-logo">
          <LuLayers />
        </div>
        <h1 className="login-mobile-splash-title">Sinar Anugrah</h1>
        <p className="login-mobile-splash-subtitle">Sales & Distribution System</p>
      </div>

      {/* Main Direct Login Form Container (Desktop & Mobile) */}
      <div className="login-direct-container">
        <div className="login-form-container animate-fade-in-up">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center gap-2 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center text-2xl shadow-sm mb-1">
              <LuLayers />
            </div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">
              PT. SINAR ANUGRAH
            </h1>
            <p className="text-xs text-on-surface-variant max-w-xs">
              Platform Manajemen PJP & Distribusi FMCG Terpadu
            </p>
          </div>

          {/* Login Card */}
          <div className="login-card shadow-sm border border-border-glass">
            <div className="login-card-header">
              <h2 className="login-card-title">Selamat Datang</h2>
              <p className="login-card-subtitle">Pilih peran akun demo dan masuk ke sistem</p>
            </div>
            <LoginFormCard onLogin={onLogin} />
          </div>

          {/* Footer */}
          <div className="login-footer mt-2">
            <p>© 2026 PT. Sinar Anugrah • FMCG Distribution System</p>
          </div>
        </div>
      </div>
    </div>
  );
};
