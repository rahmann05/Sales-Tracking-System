import React from 'react';
import { LuX, LuRotateCw, LuCheck, LuSparkles, LuInfo } from 'react-icons/lu';
import '../../../../styles/components/AutoRollingConfirmModal.css';

/**
 * AutoRollingConfirmModal Component
 * Single Responsibility: Confirmation modal for applying automated shift rolling rotation across sales reps.
 * 1 File = 1 Component
 */
export const AutoRollingConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="autoroll-modal-backdrop">
      <div className="autoroll-modal-box">
        {/* Modal Header */}
        <div className="autoroll-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
              <LuRotateCw />
            </div>
            <div>
              <h3 className="autoroll-modal-title">Konfirmasi Auto-Rolling Jadwal</h3>
              <p className="text-xs text-on-surface-variant font-medium">Rotasi Otomatis Siklus Kunjungan Sales</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-variant/50 hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors"
          >
            <LuX className="text-base" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="autoroll-modal-body">
          <div className="autoroll-info-box">
            <div className="flex items-start gap-2.5">
              <LuSparkles className="text-emerald-600 text-lg shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
                  Algoritma Rotasi Jadwal Mingguan
                </strong>
                <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                  Sistem akan merotasi jadwal sub-rute harian antar salesman secara proporsional. Toko F4 tetap terjaga
                  siklus kunjungannya, sementara rute F2 & F1 akan digeser ke siklus minggu berikutnya (Week A / Week B).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-surface-variant/30 rounded-xl border border-border-glass">
            <LuInfo className="text-primary text-base shrink-0" />
            <p className="text-xs text-on-surface-variant leading-normal">
              Perubahan ini akan langsung otomatis memperbarui rute pada aplikasi lapangan (Sales Field View) untuk
              hari kerja berikutnya.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="autoroll-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border-glass bg-surface hover:bg-surface-variant text-on-surface text-xs font-bold transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <LuCheck className="text-sm" />
            <span>Eksekusi Auto-Rolling</span>
          </button>
        </div>
      </div>
    </div>
  );
};

