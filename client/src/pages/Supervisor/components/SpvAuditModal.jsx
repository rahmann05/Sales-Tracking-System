import React from 'react';
import { LuCheck } from 'react-icons/lu';
import { SpvModalShell } from './SpvModalShell';
import { SPV_AUDIT_CHECKLIST_ITEMS } from '../../../constants/supervisor';

/**
 * SpvAuditModal Component
 * Single Responsibility: Modal checklist audit kepatuhan toko & evaluasi sales.
 */
export const SpvAuditModal = ({ stop, checklist, onChangeChecklist, inputNotes, onChangeNotes, onClose, onSave }) => (
    <SpvModalShell
        title="Form Audit & Evaluasi Supervisi"
        subtitle={stop.outletName}
        onClose={onClose}
        maxWidth="max-w-lg"
        footer={
            <>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant cursor-pointer"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                    <LuCheck className="text-base" />
                    <span>Simpan Checklist Audit</span>
                </button>
            </>
        }
    >
        <div className="space-y-4 py-2">
            <div>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
                    Checklist Kepatuhan Toko & Evaluasi Sales:
                </h4>
                <div className="space-y-2">
                    {SPV_AUDIT_CHECKLIST_ITEMS.map((item) => (
                        <label
                            key={item.key}
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-variant/30 border border-border-glass cursor-pointer hover:bg-surface-variant/50 text-xs"
                        >
                            <input
                                type="checkbox"
                                checked={checklist[item.key]}
                                onChange={(e) => onChangeChecklist({ ...checklist, [item.key]: e.target.checked })}
                                className="rounded accent-primary w-4 h-4"
                            />
                            <span className="font-semibold text-on-surface">{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">
                    Catatan Supervisi / Arahan Khusus untuk Sales Lapangan:
                </label>
                <textarea
                    rows={3}
                    value={inputNotes}
                    onChange={(e) => onChangeNotes(e.target.value)}
                    placeholder="Tuliskan temuan display, potensi order tambahan, atau instruksi untuk sales..."
                    className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            </div>
        </div>
    </SpvModalShell>
);
