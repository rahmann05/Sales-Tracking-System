/**
 * AdminUserModal.jsx
 * Single Responsibility: Unified dialog for creating and editing user accounts,
 * integrating reactive role templates and instant permission customization.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React from 'react';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import { LuX, LuSave, LuUserPlus, LuUserCheck, LuMapPin, LuKey, LuMail, LuUser } from 'react-icons/lu';
import { RoleCardSelector } from './RoleCardSelector';
import { PermissionsCustomizer } from './PermissionsCustomizer';
export function AdminUserModalView({
  availableRoles,
  clusters,
  currentRoleDef,
  formData,
  handleChange,
  handleResetToTemplate,
  handleSelectRole,
  handleSubmit,
  handleTogglePermission,
  isEditing,
  isModifiedFromTemplate,
  loading,
  loadingRoles,
  onClose,
  permissions,
  setFormData,
  setPermissions
}) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
      <div className="bg-surface border border-border-glass rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-glass flex items-center justify-between bg-surface-container/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              {isEditing ? <LuUserCheck className="text-xl" /> : <LuUserPlus className="text-xl" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">
                {isEditing ? 'Edit Profil & Hak Akses Pengguna' : 'Tambah Pengguna Baru & Template Hak Akses'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Konfigurasikan informasi akun, tetapkan peran (role), dan sesuaikan izin akses fitur secara langsung.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors">
            <LuX className="text-xl" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Account Details & Role Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <BusinessCodeInput entity="USER" value={formData.staffCode || ''} onChange={staffCode => setFormData({
              ...formData,
              staffCode
            })} existing={isEditing} disabled={loading} />
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <LuUser className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Contoh: Hendra Wijaya" className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-border-glass text-sm text-on-surface focus:border-primary focus:outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="hendra@perusahaan.com" className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-border-glass text-sm text-on-surface focus:border-primary focus:outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Password {isEditing && <span className="text-[11px] font-normal text-on-surface-variant/70">(Kosongkan jika tidak diganti)</span>}
                </label>
                <div className="relative">
                  <LuKey className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditing ? 'Biarkan kosong untuk mempertahankan' : 'Minimal 6 karakter'} className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-border-glass text-sm text-on-surface focus:border-primary focus:outline-none" minLength={6} required={!isEditing} />
                </div>
              </div>

              {/* Role Card Selector */}
              {loadingRoles ? <div className="p-4 text-center text-xs text-on-surface-variant">
                  Memuat daftar role...
                </div> : <RoleCardSelector roles={availableRoles} selectedRole={formData.role} onSelectRole={handleSelectRole} />}

              <p className="text-sm text-on-surface-variant">Penugasan tim dan wilayah sales dikelola pada menu Tim, wilayah, dan PJP setelah akun disimpan.</p>
              {/* Cluster Assignment (If applicable) */}
              {formData.role !== 'ADMIN' && (currentRoleDef?.baseRole || formData.role) !== 'SALES' && <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Penugasan Kluster Wilayah
                  </label>
                  <div className="relative">
                    <LuMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                    <select name="clusterId" value={formData.clusterId} onChange={handleChange} className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-border-glass text-sm text-on-surface focus:border-primary focus:outline-none">
                      <option value="">-- Tanpa Kluster (Pusat / Semua Area) --</option>
                      {clusters.map(c => <option key={c.id} value={c.id}>
                          {c.name} ({c.region})
                        </option>)}
                    </select>
                  </div>
                </div>}
            </div>

            {/* Right Column: Permission Template & Granular Customizer (7 cols) */}
            <div className="lg:col-span-7 bg-surface-container/20 border border-border-glass rounded-2xl p-4 flex flex-col">
              <PermissionsCustomizer permissions={permissions} onTogglePermission={handleTogglePermission} onBulkSet={setPermissions} onResetToTemplate={handleResetToTemplate} selectedRoleName={currentRoleDef?.name || formData.role} isModified={isModifiedFromTemplate} />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-6 mt-6 border-t border-border-glass flex items-center justify-between">
            <div className="text-xs text-on-surface-variant">
              Role aktif: <span className="font-bold text-on-surface">{currentRoleDef?.name || formData.role}</span>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-variant transition-colors cursor-pointer">
                Batal
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50">
                {loading ? 'Menyimpan...' : <>
                    <LuSave className="text-sm" />
                    <span>{isEditing ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
                  </>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>;
}
