import React from 'react';
import { NativeDialog } from '../../../../shared/components/common/NativeDialog';
export function AutoRollingConfirmModal({isOpen,onClose,onConfirm,busy,error}) {
  return <NativeDialog open={isOpen} title="Rotasi template tim" onClose={onClose} busy={busy}><div className="app-form"><p>Jadwal pada hari kerja dan siklus terpilih berpindah ke sales berikutnya dalam urutan tabel. Semua sales harus berada di tim yang sama dan mempunyai template lengkap.</p><p className="app-notice">Rotasi hanya mengubah template untuk pembentukan PJP berikutnya. PJP yang sudah terbentuk tetap disimpan.</p>{error && <p role="alert" className="app-error">{error}</p>}<div className="app-actions"><button className="app-button" disabled={busy} onClick={onClose}>Batal</button><button className="app-button app-button-primary" disabled={busy} onClick={onConfirm}>{busy?'Menyimpan…':'Terapkan rotasi'}</button></div></div></NativeDialog>;
}
