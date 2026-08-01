import React, { useState } from 'react';
import { LuMail, LuLock, LuArrowRight } from 'react-icons/lu';

/**
 * LoginFormCard Component (Single Responsibility: Handle Credentials Input & Auth Submission)
 * 1 File per Component
 */
export const LoginFormCard = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@sinaranugrah.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin({ email });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="login-field-group">
        <label className="login-label">Email / Username</label>
        <div className="login-input-box">
          <LuMail className="text-on-surface-variant mr-3 text-lg" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sinaranugrah.com"
            required
            className="login-input"
          />
        </div>
      </div>

      <div className="login-field-group">
        <label className="login-label">Password</label>
        <div className="login-input-box">
          <LuLock className="text-on-surface-variant mr-3 text-lg" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="login-input"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-on-surface-variant mt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked className="rounded border-border-glass" />
          <span>Ingat Saya</span>
        </label>
        <a href="#forgot" onClick={(e) => e.preventDefault()} className="font-semibold hover:underline">
          Lupa Password?
        </a>
      </div>

      <button type="submit" className="login-submit-btn">
        <span>Masuk ke System</span>
        <LuArrowRight className="text-lg" />
      </button>
    </form>
  );
};
