/**
 * RoleTemplateManager.jsx
 * Single Responsibility: Master hub for viewing system and custom roles,
 * creating new custom roles, and editing their default permission templates.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React from 'react';
import { LuLayers, LuTrash2 } from 'react-icons/lu';
import { FiEdit } from 'react-icons/fi';
import { ALL_PERMISSIONS } from '../../../constants/permissions';
export function RoleTemplateGrid({
  ROLE_ICONS,
  handleDeleteRole,
  handleOpenEditModal,
  roles
}) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(r => {
      const IconComp = ROLE_ICONS[r.code] || LuLayers;
      const activePermsCount = Object.values(r.defaultPermissions || {}).filter(Boolean).length;
      const totalPermsCount = ALL_PERMISSIONS.length;
      return <div key={r.code} className="bg-surface border border-border-glass rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div>
                  {/* Top line: Icon, Title & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <IconComp className="text-lg" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                          {r.name}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container border border-border-glass text-on-surface-variant">
                          {r.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {r.isSystem ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Sistem
                        </span> : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Kustom
                        </span>}
                      <span className="text-[10px] text-on-surface-variant font-medium">
                        {r.userCount || 0} Pengguna
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-on-surface-variant leading-relaxed min-h-[36px]  mb-4">
                    {r.description || 'Tidak ada deskripsi peran.'}
                  </p>

                  {/* Template Coverage Bar */}
                  <div className="p-3 rounded-xl bg-surface-container/50 border border-border-glass space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-on-surface-variant">Default Fitur Aktif:</span>
                      <span className="font-bold text-on-surface">
                        {activePermsCount} / {totalPermsCount}
                      </span>
                    </div>
                    <div className="w-full bg-border-glass rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{
                width: `${activePermsCount / totalPermsCount * 100}%`
              }} />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border-glass">
                  <button type="button" onClick={() => handleOpenEditModal(r)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-variant border border-border-glass text-xs font-bold text-on-surface transition-colors cursor-pointer">
                    <FiEdit className="text-xs" />
                    <span>Ubah Template</span>
                  </button>

                  {!r.isSystem && <button type="button" onClick={() => handleDeleteRole(r)} className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer" title="Hapus Role Kustom">
                      <LuTrash2 className="text-sm" />
                    </button>}
                </div>
              </div>;
    })}
        </div>;
}
