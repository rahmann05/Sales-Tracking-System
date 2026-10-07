/**
 * RoleTemplateManager.jsx
 * Single Responsibility: Master hub for viewing system and custom roles,
 * creating new custom roles, and editing their default permission templates.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React from 'react';
import { LuPlus, LuSave, LuX } from 'react-icons/lu';
import { PermissionsCustomizer } from './PermissionsCustomizer';
export function RoleTemplateEditModal({
  handleCloneChange,
  handleCreateRole,
  newRoleForm,
  roles,
  setIsCreateModalOpen,
  setNewRoleForm,
  submitting
}) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface border border-border-glass rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-border-glass flex items-center justify-between bg-surface-container/30 shrink-0">
              <div className="flex items-center gap-2">
                <LuPlus className="text-primary text-lg" />
                <h3 className="font-bold text-sm text-on-surface">Tambah Role Baru ke Sistem</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                <LuX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Kode Role (Huruf Kapital & Angka)
                  </label>
                  <input type="text" value={newRoleForm.code} onChange={e => setNewRoleForm({
              ...newRoleForm,
              code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
            })} placeholder="Contoh: KOLEKTOR, AUDIT" className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-glass text-xs text-on-surface focus:outline-none focus:border-primary font-mono" required />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Nama Tampilan Role
                  </label>
                  <input type="text" value={newRoleForm.name} onChange={e => setNewRoleForm({
              ...newRoleForm,
              name: e.target.value
            })} placeholder="Contoh: Kolektor Pembayaran Lapangan" className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-glass text-xs text-on-surface focus:outline-none focus:border-primary" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Deskripsi Tanggung Jawab Role
                </label>
                <textarea rows={2} value={newRoleForm.description} onChange={e => setNewRoleForm({
            ...newRoleForm,
            description: e.target.value
          })} placeholder="Jelaskan peran tugas dan kewenangan operasional role ini..." className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-glass text-xs text-on-surface focus:outline-none focus:border-primary resize-none" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Mulai Dari Template Role:
                </label>
                <select value={newRoleForm.cloneFromRole} onChange={e => handleCloneChange(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-glass text-xs text-on-surface focus:outline-none focus:border-primary">
                  {roles.map(r => <option key={r.code} value={r.code}>
                      Duplikasi Template: {r.name} ({r.code})
                    </option>)}
                </select>
              </div>

              <div className="bg-surface-container/20 border border-border-glass rounded-xl p-4 mt-4">
                <PermissionsCustomizer permissions={newRoleForm.defaultPermissions} onTogglePermission={key => setNewRoleForm(prev => ({
            ...prev,
            defaultPermissions: {
              ...prev.defaultPermissions,
              [key]: !prev.defaultPermissions[key]
            }
          }))} onBulkSet={bulk => setNewRoleForm(prev => ({
            ...prev,
            defaultPermissions: bulk
          }))} onResetToTemplate={() => handleCloneChange(newRoleForm.cloneFromRole)} selectedRoleName={newRoleForm.name || newRoleForm.code || 'Role Baru'} isModified={false} />
              </div>

              <div className="pt-4 border-t border-border-glass flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-variant transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50">
                  {submitting ? 'Menyimpan...' : <>
                      <LuSave className="text-sm" />
                      <span>Simpan Role Baru</span>
                    </>}
                </button>
              </div>
            </form>
          </div>
        </div>;
}
