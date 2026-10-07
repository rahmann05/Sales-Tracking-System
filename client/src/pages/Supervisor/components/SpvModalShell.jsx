import React from 'react';
import { LuX } from 'react-icons/lu';

/**
 * SpvModalShell Component
 * Single Responsibility: Kerangka modal konsisten (backdrop, header, close, body, footer).
 */
export const SpvModalShell = ({ title, subtitle, onClose, maxWidth = 'max-w-md', children, footer, error, saving }) => (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
        <div className={`bg-surface border border-border-glass rounded-3xl p-6 w-full shadow-2xl overflow-y-auto max-h-[90vh] ${maxWidth}`}>
            <div className="flex items-center justify-between border-b border-border-glass pb-4">
                <div>
                    <h3 className="text-lg font-black text-on-surface">{title}</h3>
                    {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    aria-label="Tutup dialog"
                    className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant cursor-pointer"
                >
                    <LuX className="text-lg" />
                </button>
            </div>

<fieldset disabled={saving}>{children}</fieldset>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {saving && <p role="status" className="text-sm">Menyimpan…</p>}

            {footer && (
                <fieldset disabled={saving} className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border-glass pt-4">
                    {footer}
                </fieldset>
            )}
        </div>
    </div>
);
