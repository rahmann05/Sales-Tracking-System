/**
 * RoleCardSelector.jsx
 * Single Responsibility: Interactive role picker showing role cards with React Icons,
 * role titles, badges, and responsibility descriptions.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React from 'react';
import {
  LuShieldCheck,
  LuUsers,
  LuNavigation,
  LuPackage,
  LuTruck,
  LuLayers,
  LuCheck,
} from 'react-icons/lu';

const ROLE_ICONS = {
  ADMIN: LuShieldCheck,
  SUPERVISOR: LuUsers,
  SALES: LuNavigation,
  KEPALA_GUDANG: LuPackage,
  SUPIR: LuTruck,
};

const COLOR_CLASSES = {
  blue: {
    border: 'border-blue-500/40',
    bgActive: 'bg-blue-500/10',
    iconBg: 'bg-blue-500/15 text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    check: 'text-blue-600',
  },
  purple: {
    border: 'border-purple-500/40',
    bgActive: 'bg-purple-500/10',
    iconBg: 'bg-purple-500/15 text-purple-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    check: 'text-purple-600',
  },
  emerald: {
    border: 'border-emerald-500/40',
    bgActive: 'bg-emerald-500/10',
    iconBg: 'bg-emerald-500/15 text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    check: 'text-emerald-600',
  },
  amber: {
    border: 'border-amber-500/40',
    bgActive: 'bg-amber-500/10',
    iconBg: 'bg-amber-500/15 text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    check: 'text-amber-600',
  },
  orange: {
    border: 'border-orange-500/40',
    bgActive: 'bg-orange-500/10',
    iconBg: 'bg-orange-500/15 text-orange-600',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    check: 'text-orange-600',
  },
  indigo: {
    border: 'border-indigo-500/40',
    bgActive: 'bg-indigo-500/10',
    iconBg: 'bg-indigo-500/15 text-indigo-600',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    check: 'text-indigo-600',
  },
};

export const RoleCardSelector = ({ roles, selectedRole, onSelectRole }) => {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
        Pilih Peran Akun (Role)
      </label>
      <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        {roles.map((r) => {
          const isSelected = selectedRole === r.code;
          const IconComponent = ROLE_ICONS[r.code] || LuLayers;
          const colorTheme = COLOR_CLASSES[r.badgeColor] || COLOR_CLASSES.indigo;

          return (
            <div
              key={r.code}
              onClick={() => onSelectRole(r.code)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-left relative ${
                isSelected
                  ? `${colorTheme.border} ${colorTheme.bgActive} shadow-xs ring-1 ring-primary/30`
                  : 'border-border-glass bg-surface-container/40 hover:bg-surface-variant/40'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${colorTheme.iconBg}`}>
                <IconComponent className="text-base" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-surface">{r.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorTheme.badge}`}
                  >
                    {r.code}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed ">
                  {r.description}
                </p>
              </div>

              {isSelected && (
                <div className={`absolute top-3 right-3 ${colorTheme.check}`}>
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <LuCheck className="text-xs stroke-[3]" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
