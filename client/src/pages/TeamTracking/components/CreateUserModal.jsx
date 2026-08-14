import React, { useState } from 'react';
import { LuUserPlus, LuX, LuMail, LuLock, LuShield, LuMapPin, LuUser } from 'react-icons/lu';

export const CreateUserModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES',
    cluster: 'Klaster Cimahi Tengah',
    spvName: 'Ahmad Subagja',
    phone: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      alert('Mohon isi nama, email, dan password.');
      return;
    }

    onSubmit({
      ...formData,
      id: `usr-${Date.now()}`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border-glass pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <LuUserPlus />
            </span>
            <h3 className="text-base font-black text-on-surface">Tambah Personel Baru</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <LuX className="text-base" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-on-surface flex items-center gap-1">
              <LuUser className="text-primary" /> Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Rian Hidayat"
              className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-bold text-on-surface flex items-center gap-1">
                <LuMail className="text-primary" /> Email Akun
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@sinaranugrah.com"
                className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-on-surface flex items-center gap-1">
                <LuLock className="text-primary" /> Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-bold text-on-surface flex items-center gap-1">
                <LuShield className="text-primary" /> Peran (Role)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="SALES">Sales Field Rep</option>
                <option value="SUPERVISOR">Supervisor Operasional</option>
                <option value="ADMIN">Admin Penjualan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-on-surface flex items-center gap-1">
                <LuMapPin className="text-primary" /> Penugasan Klaster
              </label>
              <select
                value={formData.cluster}
                onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Klaster Cimahi Tengah">Klaster Cimahi Tengah</option>
                <option value="Klaster Padalarang">Klaster Padalarang (KBB)</option>
                <option value="Klaster Lembang">Klaster Lembang (KBB Utara)</option>
                <option value="Klaster Belfoods Bandung Raya">Klaster Belfoods Bandung Raya</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-on-surface">Supervisor Penanggung Jawab</label>
            <input
              type="text"
              value={formData.spvName}
              onChange={(e) => setFormData({ ...formData, spvName: e.target.value })}
              placeholder="Nama Supervisor"
              className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-glass">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-variant/40 hover:bg-surface-variant/70 text-on-surface-variant rounded-xl font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              Simpan Personel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
