import React from 'react';
import { LuX, LuRotateCw, LuCheck } from 'react-icons/lu';
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
        <div className="autoroll-modal-header">
          <div className="flex items-center gap-2">
            <LuRotateCw className="text-emerald-600 text-lg" />
            <h3 className="autoroll-modal-title">Konfirmasi Auto-Rolling Jadwal</h3>
          </div>
          <button type="button" onClick={onClose} className="create-cluster-modal-close">
            <LuX />
          </button>
        </div>

        <div className="autoroll-modal-body">
          <div className="autoroll-info-box">
            <strong>Algoritma Rotasi Jadwal Mingguan:</strong>
            <p className="mt-1">
              Sistem akan merotasi jadwal sub-rute harian antar salesman secara proporsional. Toko F4 tetap terjaga
              siklus kunjungannya, sementara rute F2 & F1 akan digeser ke siklus minggu berikutnya (Week A / Week B).
            </p>
          </div>

          <p className="text-xs text-on-surface-variant">
            Perubahan ini akan langsung otomatis memperbarui rute pada aplikasi lapangan (Sales Field View) untuk
            hari kerja berikutnya.
          </p>
        </div>

        <div className="reassign-modal-footer">
          <button type="button" onClick={onClose} className="create-cluster-btn-cancel">
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="create-cluster-btn-submit bg-emerald-600 hover:bg-emerald-700"
          >
            <LuCheck className="inline mr-1" /> Eksekusi Auto-Rolling
          </button>
        </div>
      </div>
    </div>
  );
};
