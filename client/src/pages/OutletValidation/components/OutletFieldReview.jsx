import { FieldTaskReview } from './FieldTaskReview';
import React from 'react';
import { useApp } from '../../../context/AppContext';
import { outletValidationApi } from '../../../services/api';
import { useFormDraft } from '../../../shared/hooks/useFormDraft';
const FIELD_INSTRUCTION_TEMPLATES = [
  'Konfirmasi nama papan toko, alamat jalan/patokan, serta ambil foto dan GPS tepat di depan pintu masuk.',
  'Periksa apakah toko masih aktif berjualan dan pastikan titik koordinat sesuai posisi bangunan aktual.',
];

export function OutletFieldReview({ review: r, disabled, act, readOnly = false, onOpenCluster }) {
  const { user, settings } = useApp(),
    draft = useFormDraft(`outlet-field-assignment:${r.id}`, {
      owner: '',
      reviewer: '',
      instructions: '',
      due: '',
      manualCode: '',
    }),
    { owner, reviewer, instructions, due, manualCode } = draft.value;
  const setOwner = draft.field('owner'),
    setReviewer = draft.field('reviewer'),
    setInstructions = draft.field('instructions'),
    setDue = draft.field('due');
  const active = r.fieldTasks?.find((t) => ['OPEN', 'SUBMITTED'].includes(t.status));
  const salesList = r.fieldActors?.sales || [];
  const defaultOwner =
    active?.ownerId ||
    salesList.find((p) => p.id === r.outlet?.cluster?.assignedSalesId)?.id ||
    (salesList.length === 1 ? salesList[0].id : '');
  const effectiveOwner = salesList.some((p) => p.id === owner) ? owner : defaultOwner;
  const reviewerList = (r.fieldActors?.reviewers || []).filter((p) => p.id !== effectiveOwner);
  const defaultReviewer =
    active?.reviewerId ||
    reviewerList.find((p) => p.id === user?.id)?.id ||
    reviewerList.find((p) => p.id === r.ownerId)?.id ||
    reviewerList[0]?.id ||
    '';
  const effectiveReviewer = reviewerList.some((p) => p.id === reviewer)
    ? reviewer
    : defaultReviewer;
  const effectiveReviewerName = reviewerList.find((p) => p.id === effectiveReviewer)?.name || '';
  const manualPjpEnabled = settings?.CODE_PJP_MODE === 'MANUAL';
  const assign = (e) => {
    e.preventDefault();
    act(() =>
      outletValidationApi.assignField(r.outletId, r.id, {
        revision: r.revision,
        ownerId: effectiveOwner,
        reviewerId: effectiveReviewer,
        instructions,
        ...(manualPjpEnabled && manualCode.trim() ? { manualPjpCode: manualCode.trim() } : {}),
        ...(due ? { dueAt: new Date(due).toISOString() } : {}),
      })
    );
  };
  return (
    <section className="ov-section">
      <h3>Pemeriksaan lapangan</h3>
      <p className="ov-muted">
        Tugaskan bila Google dan bukti internal belum memadai. Tugas masuk PJP Sales hari ini tanpa
        membuat presensi. Mode agenda mengikuti parameter tim Sales saat penugasan.
      </p>
      {r.fieldTasks?.map((t) => (
        <FieldTaskReview
          key={t.id}
          task={t}
          actors={r.fieldActors}
          disabled={disabled}
          readOnly={readOnly}
          act={act}
        />
      ))}
      {!readOnly &&
        user?.permissions?.can_assign_outlet_review &&
        active?.status !== 'SUBMITTED' && (
          <details className="packing-disclosure">
            <summary>{active ? 'Jadwalkan ulang / alihkan tugas' : 'Tugaskan Sales'}</summary>
            <div className="packing-disclosure-body">
              <form className="app-form" onSubmit={assign}>
                <label className="app-field">
                  Sales pelaksana
                  <select
                    required
                    disabled={disabled}
                    value={effectiveOwner}
                    onChange={(e) => setOwner(e.target.value)}
                  >
                    <option value="">Pilih Sales</option>
                    {salesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                {salesList.length === 0 && (
                  <div className="ov-inline-alert">
                    <span>
                      Cluster outlet ini belum memiliki Sales tim aktif. Tetapkan Sales di Wilayah
                      &amp; PJP agar tugas validasi bisa dikirim.
                    </span>
                    {onOpenCluster && (
                      <button type="button" className="app-button" onClick={onOpenCluster}>
                        Atur wilayah cluster
                      </button>
                    )}
                  </div>
                )}
                <div className="ov-chip-row" aria-label="Templat instruksi cepat">
                  {FIELD_INSTRUCTION_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="outlet-pill"
                      disabled={disabled}
                      onClick={() => setInstructions(tpl)}
                    >
                      {idx === 0 ? 'Templat: Foto papan & GPS pintu' : 'Templat: Cek operasional'}
                    </button>
                  ))}
                </div>
                <label className="app-field">
                  Pertanyaan / tujuan pemeriksaan
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    disabled={disabled}
                  />
                </label>
                <p className="ov-muted text-xs">
                  Pemeriksa hasil foto/GPS:{' '}
                  <strong>{effectiveReviewerName || 'Pilih pemeriksa di opsi lanjutan'}</strong> ·
                  SLA default {settings.OUTLET_FIELD_SLA_HOURS ?? 48} jam
                  {!manualPjpEnabled &&
                    ' · Penomoran & jadwal PJP dibuat otomatis saat tugas dikirim'}
                </p>
                <details
                  className="packing-disclosure"
                  open={!effectiveReviewer || manualPjpEnabled}
                >
                  <summary>
                    {manualPjpEnabled
                      ? 'Opsi lanjutan (delegasi pemeriksa bukti, tenggat khusus, kode PJP manual)'
                      : 'Opsi lanjutan (delegasi pemeriksa bukti & tenggat khusus)'}
                  </summary>
                  <div className="packing-disclosure-body">
                    <label className="app-field">
                      Pemeriksa hasil
                      <select
                        required
                        disabled={disabled}
                        value={effectiveReviewer}
                        onChange={(e) => setReviewer(e.target.value)}
                      >
                        <option value="">Pilih SPV / Admin</option>
                        {reviewerList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="app-field">
                      Tenggat khusus (opsional)
                      <input
                        type="datetime-local"
                        value={due}
                        disabled={disabled}
                        onChange={(e) => setDue(e.target.value)}
                      />
                      <small>
                        Kosong memakai SLA {settings.OUTLET_FIELD_SLA_HOURS ?? 48} jam sesuai
                        kalender.
                      </small>
                    </label>
                    {manualPjpEnabled && (
                      <label className="app-field">
                        Kode PJP manual (bila diperlukan)
                        <input
                          maxLength={128}
                          value={manualCode}
                          disabled={disabled}
                          onChange={(e) => draft.field('manualCode')(e.target.value)}
                        />
                        <small>
                          Diperlukan bila belum ada PJP hari ini karena penomoran PJP sedang diatur
                          manual. Untuk mode sampai selesai, siapkan PJP berkode manual pada setiap
                          hari berikutnya.
                        </small>
                      </label>
                    )}
                  </div>
                </details>
                <button
                  type="submit"
                  className="app-button app-button-primary"
                  disabled={disabled || settings.OUTLET_FIELD_ENABLED === false}
                >
                  Kirim tugas ke PJP Sales
                </button>
                {settings.OUTLET_FIELD_ENABLED === false && (
                  <p className="ov-muted">Tugas baru dinonaktifkan Admin.</p>
                )}
              </form>
            </div>
          </details>
        )}
    </section>
  );
}
