import React, { useState } from 'react';
import { LuMail, LuLock, LuArrowRight, LuUserCheck, LuTruck, LuPackageCheck, LuShieldCheck, LuFileCheck, LuBriefcase } from 'react-icons/lu';
import { DEMO_USERS } from '../../../data/mockData';
import { AuthInputField } from './AuthInputField';

const ROLE_PRESETS = [
  { key: 'SALES', icon: LuUserCheck, name: 'Sales Field', desc: 'Budi Santoso', color: 'bg-primary/10 text-primary border-primary/30' },
  { key: 'DRIVER', icon: LuTruck, name: 'Driver', desc: 'Hendra Wijaya', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { key: 'HELPER', icon: LuPackageCheck, name: 'Helper', desc: 'Rian Putra', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  { key: 'SUPERVISOR', icon: LuShieldCheck, name: 'Supervisor', desc: 'Ahmad Subagja', color: 'bg-tertiary/10 text-tertiary border-tertiary/30' },
  { key: 'ADMIN', icon: LuFileCheck, name: 'Admin Sales', desc: 'Maria Ulfah', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { key: 'OPERATIONAL_MANAGER', icon: LuBriefcase, name: 'Ops Manager', desc: 'Bambang Suroso', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30' },
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
    <form onSubmit={handleSubmit} className="login-form space-y-4">
      {/* Demo Role Quick Switcher */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
          Pilih Peran Login (Demo Account):
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ROLE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedRoleKey === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleSelectRole(preset.key)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? `${preset.color} ring-2 ring-primary shadow-sm font-semibold`
                    : 'border-border-glass bg-surface/50 text-on-surface-variant hover:bg-surface'
                }`}
              >
                <Icon className="text-xl mb-1" />
                <span className="text-xs font-bold leading-tight">{preset.name}</span>
                <span className="text-[10px] opacity-75 truncate max-w-full">{preset.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AuthInputField
        label="Email / Username"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@sinaranugrah.com"
        icon={LuMail}
      />

      <AuthInputField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        icon={LuLock}
      />

      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked className="rounded border-border-glass" />
          <span>Ingat Sesi Saya</span>
        </label>
        <a href="#forgot" onClick={(e) => e.preventDefault()} className="font-semibold hover:underline">
          Lupa Password?
        </a>
      </div>

      <button type="submit" className="login-submit-btn w-full">
        <span>Masuk sebagai {DEMO_USERS[selectedRoleKey]?.roleLabel || 'User'}</span>
        <LuArrowRight className="text-lg" />
      </button>
    </form>
  );
};

