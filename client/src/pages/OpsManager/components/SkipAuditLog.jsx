import React from 'react';
import { LuBellRing } from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';

/**
 * SkipAuditLog Component (Single Responsibility: Audit log feed of outlets skipped by SPV instruction)
 * 1 File per Component
 */
export const SkipAuditLog = ({ skipIncidents }) => {
  if (skipIncidents.length === 0) {
    return (
      <div className="p-6 text-center bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium">
        Belum ada log skip toko dari Supervisor hari ini.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {skipIncidents.map((item) => (
        <div key={item.id} className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <LuBellRing className="text-xl text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-on-surface">Notifikasi Info: Skip Toko {item.outletName}</p>
              <p className="text-on-surface-variant text-[11px]">
                Disetujui oleh SPV (Tanpa Perlunya Approval Manajer) • Alasan: {item.reason}
              </p>
            </div>
          </div>
          <span className="font-bold text-amber-700 bg-amber-500/20 px-2.5 py-1 rounded-full text-[10px]">
            SKIPPED BY SPV
          </span>
        </div>
      ))}
    </div>
  );
};
