import React, { useState } from 'react';
import { LuMail, LuLock, LuArrowRight } from 'react-icons/lu';
import { AuthInputField } from './AuthInputField';

/**
 * LoginFormCard — murni autentikasi backend (PostgreSQL).
 * Tidak ada akun demo / mockup.
 */
export const LoginFormCard = ({ onLogin, loading = false, error = '' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password && !loading) {
      onLogin({ email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <AuthInputField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nama@sinaranugrah.com"
        icon={LuMail}
      />

      <AuthInputField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Masukkan password"
        icon={LuLock}
      />

      {error && (
        <div className="text-[13px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="login-submit-btn disabled:opacity-60">
        <span>{loading ? 'Memproses...' : 'Masuk ke Sistem'}</span>
        <LuArrowRight className="text-lg" />
      </button>
    </form>
  );
};
