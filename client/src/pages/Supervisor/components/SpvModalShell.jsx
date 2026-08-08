import React from 'react';
import { LuX } from 'react-icons/lu';

/**
 * SpvModalShell Component
 * Single Responsibility: Kerangka modal konsisten (backdrop, header, close, body, footer).
 */
export const SpvModalShell = ({ title, subtitle, onClose, maxWidth = 'max-w-md', children, footer }) => (
    <div className="modal-backdrop">
        <div className={`modal-content ${maxWidth}`}>
            <div className="flex items-center justify-between border-b border-border-glass pb-4">
                <div>
                    <h3 className="text-lg font-black text-on-surface">{title}</h3>
                    {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant cursor-pointer"
                >
                    <LuX className="text-lg" />
                </button>
            </div>

            {children}

            {footer && (
                <div className="flex items-center justify-end gap-2.5 border-t border-border-glass pt-4">
                    {footer}
                </div>
            )}
        </div>
    </div>
);
