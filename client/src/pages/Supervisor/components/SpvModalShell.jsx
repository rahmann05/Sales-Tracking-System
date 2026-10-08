import React from 'react';
import {NativeDialog} from '../../../shared/components/common/NativeDialog';
import {useUnsavedNavigation} from '../../../shared/hooks/useUnsavedNavigation';
export function SpvModalShell({title,subtitle,onClose,children,footer,error,saving}){
  useUnsavedNavigation(true,saving);
  return <NativeDialog open title={title} onClose={onClose} busy={saving} className="spv-form-dialog"><div className="spv-modal-content">{subtitle&&<p className="spv-note">{subtitle}</p>}<fieldset disabled={saving}>{children}</fieldset>{error&&<p role="alert" className="app-error">{error}</p>}{saving&&<p role="status">Menyimpan…</p>}{footer&&<fieldset className="app-actions spv-modal-actions" disabled={saving}>{footer}</fieldset>}</div></NativeDialog>;
}
