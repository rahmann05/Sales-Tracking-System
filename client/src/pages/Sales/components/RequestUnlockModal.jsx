import {useApp} from '../../../context/AppContext';
import {UNLOCK_KIND_LABELS,unlockKindAllowed} from '../../../../../shared/unlock-policy.mjs';
import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import {SalesDialog} from './SalesDialog';
import React, { useState } from 'react';
import { LuKey, LuSend } from 'react-icons/lu';

/**
 * RequestUnlockModal Component
 * Single Responsibility: Modal for Sales Rep to submit an outlet unlock request to Admin / Supervisor.
 */
export const RequestUnlockModal = ({ stop, activeVisitingStop, onClose, onSubmitUnlockRequest }) => {
  const {settings}=useApp();
  const kinds=Object.entries(UNLOCK_KIND_LABELS).filter(([kind])=>unlockKindAllowed(kind,settings));
  const draft=useFormDraft(`RequestUnlockModal:${stop?.id}`,{reason:'',kind:kinds[0]?.[0]||'GEOFENCE'});
  const reason=draft.value.reason,setReason=draft.field('reason');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!stop) return null;

  const handleSubmit = async () => {
    if (saving) return;
    if(!unlockKindAllowed(draft.value.kind,settings)){setError('Jenis pengecualian tidak tersedia. Pilih jenis yang diizinkan.');return;}
    if(reason.trim().length<3){setError('Jelaskan kendala lokasi minimal 3 karakter.');return;}
    setSaving(true); setError('');
    try {
    await onSubmitUnlockRequest({
      stopId: stop.id,
      outletName: stop.outletName,
      address: stop.address,
      activeVisitingOutlet: activeVisitingStop?.outletName || 'Outlet Sebelumnya',
      reason,kind:draft.value.kind,
    });
    draft.clear();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return <SalesDialog title="Ajukan pengecualian kunjungan" description={stop.outletName} onClose={onClose} busy={saving} dirty={draft.dirty} restored={draft.restored} draftNotice={draft.restored||draft.policyChanged?draft.restoreMessage:''} draftError={draft.storageError}>
{error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-900">
            <LuKey className="text-sm" /> Status Kunjungan Saat Ini
          </p>
          <p>{activeVisitingStop ? `Kunjungan aktif Anda: ${activeVisitingStop.outletName}. Selesaikan kunjungan tersebut sebelum berpindah outlet.` : 'Permohonan ini ditinjau Admin atau Supervisor untuk pengecualian pemeriksaan lokasi.'}</p>
          <p className="text-[11px] text-amber-700">
            Persetujuan pengecualian GPS tidak menggantikan absen keluar atau aturan urutan kunjungan.
          </p>
          <p>{Number(settings.UNLOCK_MAX_VISITS_PER_APPROVAL)>0?`Izin maksimal ${settings.UNLOCK_MAX_VISITS_PER_APPROVAL} kunjungan. Masuk dan keluar pada stop yang sama dihitung sekali.`:'Jumlah kunjungan tidak dibatasi selama izin berlaku.'} Batas mengikuti aturan saat pengajuan.</p>
        </div>

        <label className="block">Jenis pengecualian<select className="form-input block w-full" value={draft.value.kind} onChange={e=>draft.field('kind')(e.target.value)}>{!kinds.some(([k])=>k===draft.value.kind)&&<option value={draft.value.kind}>Jenis lama tidak tersedia</option>}{kinds.map(([k,label])=><option key={k} value={k}>{label}</option>)}</select></label>
        <div className="space-y-2">
          <label htmlFor="sales-gps-exception-reason" className="text-xs font-bold text-on-surface">Kendala lokasi yang perlu diperiksa</label>
          <textarea id="sales-gps-exception-reason" rows={3} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Jelaskan ketidaksesuaian titik outlet, lokasi sementara, atau kendala GPS yang Anda alami." />
          <p className="sales-note">Tuliskan kondisi sebenarnya agar Supervisor dapat memeriksa permohonan Anda.</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
            disabled={saving}
          className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <LuSend className="text-sm" />
          <span>Kirim permohonan untuk diperiksa</span>
        </button>
  </SalesDialog>;
};
