import { useApp } from '../../../context/AppContext';
import { canTripAction } from '../../../../../shared/trip-permissions.mjs';
import React, { useState, useRef, useEffect } from 'react';
import { deliveryApi } from '../../../services/api';
import {
  preparationStages,
  preparationOwnerProblem,
} from '../../../../../shared/warehouse-policy.mjs';
const stages = {
  PICK: 'Penyiapan barang',
  CHECK: 'Pemeriksaan barang',
  LOAD: 'Loading / serah terima',
};
const prepInstructionPresets = [
  'Siapkan dan cek barang sesuai urutan pengiriman toko',
  'Prioritaskan penyiapan segera untuk muat armada hari ini',
  'Penyesuaian penugasan petugas pemeriksa gudang',
];
const stamp = (v) => `${new Date(v).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`;
export function PreparationTasks({ route, people, onChanged, canManage }) {
  const { user } = useApp();
  const [stage, setStage] = useState('PICK'),
    [owner, setOwner] = useState(''),
    [due, setDue] = useState(''),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const errorRef = useRef(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const enabled = preparationStages(route.policySnapshot?.values),
    pending = enabled.filter((key) => !route.preparation?.[key]);
  const selectedStage = pending.includes(stage) ? stage : pending[0] || '',
    eligible = people.filter((person) => !preparationOwnerProblem(person, route, selectedStage));
  const selectedOwner = eligible.some((person) => person.id === owner) ? owner : '';
  const assign = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await deliveryApi.routeAction(route.id, {
        action: 'ASSIGN_PREPARATION',
        stage: selectedStage,
        ownerId: selectedOwner,
        assignmentRevision: route.preparation?.tasks?.[selectedStage]?.revision || 0,
        dueAt: new Date(`${due}:00+07:00`).toISOString(),
        note,
      });
      setNote('');
      await onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-3">
      <h3 className="font-bold">Pemeriksaan dan serah terima muatan</h3>
      <div className="space-y-2">
        {enabled.map((key) => {
          const done = route.preparation?.[key],
            task = route.preparation?.tasks?.[key],
            isActive = !done && pending[0] === key && route.status === 'DRAFT' && !route.onHold;
          return (
            <div
              key={key}
              className={`rounded-xl border p-2.5 text-sm ${
                done
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border-glass'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{stages[key]}</strong>
                <span className="text-xs font-semibold">
                  {done ? 'Selesai' : isActive ? 'Tahap aktif' : 'Menunggu'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {done
                  ? `Oleh ${done.actorName || 'Petugas'} · ${stamp(done.at)}`
                  : task
                    ? `${task.ownerName} · Tenggat ${stamp(task.dueAt)}${new Date(task.dueAt) < new Date() ? ' · Terlambat' : ''}`
                    : isActive
                      ? 'Tim gudang siap memproses tahap ini pada panel Kontrol perjalanan.'
                      : 'Menunggu tahap sebelumnya selesai.'}
              </p>
            </div>
          );
        })}
      </div>
      {enabled.length < 3 && (
        <p className="text-sm">
          Dilewati sesuai aturan trip:{' '}
          {Object.keys(stages)
            .filter((key) => !enabled.includes(key))
            .map((key) => stages[key])
            .join(', ')}
          .
        </p>
      )}
      {canManage &&
        canTripAction(user, 'ASSIGN_PREPARATION') &&
        pending.length > 0 &&
        route.status === 'DRAFT' &&
        !route.cancelledAt &&
        !route.closedAt && (
          <details>
            <summary className="min-h-11 cursor-pointer">
              Penugasan petugas khusus (opsional)
            </summary>
            <form onSubmit={assign} className="space-y-3 border rounded-xl p-3">
              <fieldset disabled={busy} className="space-y-3">
                <label className="block">
                  Tahap
                  <select
                    className="form-input block w-full"
                    value={selectedStage}
                    onChange={(e) => {
                      setStage(e.target.value);
                      setOwner('');
                    }}
                  >
                    {pending.map((key) => (
                      <option value={key} key={key}>
                        {stages[key]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Petugas gudang
                  <select
                    required
                    className="form-input block w-full"
                    value={selectedOwner}
                    onChange={(e) => setOwner(e.target.value)}
                  >
                    <option value="">Pilih petugas berwenang</option>
                    {eligible.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!eligible.length && (
                  <p role="status">
                    Belum ada petugas yang memenuhi izin dan aturan pemeriksa terpisah. Perbaiki hak
                    akses atau penugasan tahap lainnya.
                  </p>
                )}
                <label className="block">
                  Tenggat persiapan WIB
                  <input
                    required
                    type="datetime-local"
                    className="form-input block w-full"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </label>
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-on-surface-variant">
                    Pilih instruksi cepat:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {prepInstructionPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="px-2.5 py-1.5 min-h-[36px] text-xs rounded-lg border border-border-glass bg-surface hover:bg-surface-variant cursor-pointer"
                        onClick={() => setNote(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  Instruksi / alasan penugasan
                  <textarea
                    required
                    minLength={5}
                    maxLength={2000}
                    className="form-input block w-full"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  disabled={!selectedOwner || note.trim().length < 5}
                  className="admin-button primary"
                >
                  {busy ? 'Menyimpan…' : 'Simpan penugasan'}
                </button>
              </fieldset>
              {error && (
                <p ref={errorRef} tabIndex={-1} role="alert" className="text-red-600">
                  {error}
                </p>
              )}
            </form>
          </details>
        )}
    </section>
  );
}
