import React, { useState } from 'react';
import { LuMail, LuLock, LuArrowRight, LuUserCheck, LuTruck, LuPackageCheck, LuShieldCheck, LuFileCheck, LuBriefcase } from 'react-icons/lu';
import { DEMO_USERS } from '../../../data';
import { AuthInputField } from './AuthInputField';

const ROLE_PRESETS = [
  { key: 'SALES', icon: LuUserCheck, name: 'Sales', desc: 'Budi Santoso' },
  { key: 'DRIVER', icon: LuTruck, name: 'Driver', desc: 'Hendra Wijaya' },
  { key: 'HELPER', icon: LuPackageCheck, name: 'Helper', desc: 'Rian Putra' },
  { key: 'SUPERVISOR', icon: LuShieldCheck, name: 'SPV', desc: 'Ahmad Subagja' },
  { key: 'ADMIN', icon: LuFileCheck, name: 'Admin', desc: 'Maria Ulfah' },
  { key: 'OPERATIONAL_MANAGER', icon: LuBriefcase, name: 'Ops Mgr', desc: 'Bambang S.' },
];

export const LoginFormCard = ({ onLogin }) => {
  const [selectedRoleKey, setSelectedRoleKey] = useState('SALES');
  const [email, setEmail] = useState(DEMO_USERS.SALES.email);
  const [password, setPassword] = useState('password123');

  const handleSelectRole = (key) => {
    setSelectedRoleKey(key);
    if (DEMO_USERS[key]) {
      setEmail(DEMO_USERS[key].email);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin({ email, roleKey: selectedRoleKey });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Demo Role Quick Switcher */}
      <div className="flex flex-col gap-2">
        <label className="login-label">Pilih Peran (Demo)</label>
        <div className="role-grid">
          {ROLE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedRoleKey === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleSelectRole(preset.key)}
                className={`role-btn ${isSelected ? 'selected' : ''}`}
              >
                <Icon className="role-icon" />
                <span className="role-name">{preset.name}</span>
                <span className="role-desc">{preset.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

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

      <div className="flex items-center justify-between text-[13px] text-on-surface-variant">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 rounded-md border-outline accent-primary"
          />
          <span>Ingat saya</span>
        </label>
        <a
          href="#forgot"
          onClick={(e) => e.preventDefault()}
          className="font-semibold text-primary hover:underline transition-colors"
        >
          Lupa Password?
        </a>
      </div>

      <button type="submit" className="login-submit-btn">
        <span>Masuk sebagai {DEMO_USERS[selectedRoleKey]?.roleLabel || 'User'}</span>
        <LuArrowRight className="text-lg" />
      </button>
    </form>
  );
};
