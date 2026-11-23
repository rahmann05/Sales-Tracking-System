import React, { useState } from 'react';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import { useApp } from '../../../context/AppContext';
import { useFormDraft } from '../../../shared/hooks/useFormDraft';
import { useUnsavedNavigation } from '../../../shared/hooks/useUnsavedNavigation';
import { outletValidationApi } from '../../../services/api';
import {
  OUTLET_RESULT_LABELS,
  OUTLET_STAGE_LABELS,
  outletIssues,
  OUTLET_ISSUE_LABELS,
} from '../../../../../shared/outlet-validation.mjs';
import { outletDigitalReadiness } from '../../../../../shared/outlet-digital-readiness.mjs';
import { adminOutletDecisionReadiness } from '../../../../../shared/outlet-admin-decision.mjs';
import { stamp, point } from '../../OutletManagement/outletPresentation';
import { OutletReviewAssignment } from './OutletReviewAssignment';
import { GoogleOutletEvidence } from './GoogleOutletEvidence';
import { OutletCorrectionProposal } from './OutletCorrectionProposal';
import { OutletFieldReview } from './OutletFieldReview';
import { OutletValidationAccessNotice } from './OutletValidationAccessNotice';
import { OutletDigitalReadinessNotice } from './OutletDigitalReadinessNotice';
import { OutletReviewDecisionForm } from './OutletReviewDecisionForm';
export function OutletValidationDetail({ review: r, onRefresh, onClose }) {
  const { user } = useApp(),
    map = useFeaturePolicy('MAPS'),
    permissions = user?.permissions || {};
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [hint, setHint] = useState(''),
    [decision, setDecision] = useState('DIGITAL_KEEP');
  const [preview, setPreview] = useState({}),
    [acknowledgedKey, setAcknowledgedKey] = useState('');
  const draft = useFormDraft(`outlet-review-decision:${r.id}`, { reason: '', reference: '' }),
    d = draft.value;
  useUnsavedNavigation(draft.dirty, busy);
  const o = r.outlet,
    run = r.runs[0],
    result = run?.result,
    closed = ['COMPLETED', 'CANCELLED'].includes(r.status);
  const previewPlaceId = preview.runId === run?.id ? preview.placeId : undefined;
  const readiness = outletDigitalReadiness(run, o, { placeId: previewPlaceId }),
    adminReadiness = adminOutletDecisionReadiness(run, o, user, map.settings, {
      placeId: previewPlaceId,
    });
  const ackKey = `${r.revision}:${run?.id}:${previewPlaceId || result?.selectedPlaceId}`,
    acknowledged = acknowledgedKey === ackKey;
  const cacheExpiresAt = run?.providerExpiresAt ?? result?.providerExpiresAt;
  const act = async (fn) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await fn();
      await onRefresh();
    } catch (e) {
      setError(e.message);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };
  const digital = (action, body = {}) =>
    outletValidationApi.digital(o.id, r.id, { revision: r.revision, action, ...body });
  const save = (e) => {
    e.preventDefault();
    act(async () => {
      await digital(decision, {
        reason: d.reason,
        reference: d.reference,
        runId: run?.id,
        placeId: previewPlaceId || result?.selectedPlaceId,
        acknowledgeWarnings: decision === 'ADMIN_DIGITAL_KEEP' && acknowledged,
      });
      draft.clear();
      draft.setValue({ reason: '', reference: '' });
      setAcknowledgedKey('');
    });
  };
  return (
    <article className="ov-workspace">
      <header className="ov-detail-header">
        <div>
          <div className="ov-detail-meta">
            <span className="admin-status admin-status-route">
              {OUTLET_STAGE_LABELS[r.workflow?.stage || r.status]}
            </span>
            <span className="ov-muted">{o.outletCode || 'Tanpa kode'}</span>
            <span className="ov-muted">·</span>
            <span className="ov-muted">
              Diajukan {r.requestedBy?.name} · {stamp(r.createdAt)}
            </span>
          </div>
          <h2>{o.name}</h2>
          <p className="ov-detail-reason">{r.reason}</p>
        </div>
        <button type="button" className="app-button" disabled={busy} onClick={onClose}>
          ← Kembali ke antrean
        </button>
      </header>
      {error && (
        <p className="app-error" role="alert">
          {error}
        </p>
      )}
      {!closed && <OutletValidationAccessNotice permissions={permissions} map={map} />}
      <section className="ov-conclusion">
        <div className="ov-conclusion-body">
          <div className="ov-conclusion-head">
            <h3>
              {OUTLET_RESULT_LABELS[r.workflow?.resultCode] ||
                (run
                  ? 'Hasil pemeriksaan Google'
                  : closed
                    ? 'Pemeriksaan selesai'
                    : 'Belum diperiksa dengan Google')}
            </h3>
            <div className="ov-issue-list">
              {outletIssues(o).map((k) => (
                <span className="admin-status admin-status-pending ov-issue-tag" key={k}>
                  {OUTLET_ISSUE_LABELS[k]}
                </span>
              ))}
            </div>
          </div>
          <div className="ov-master-inline">
            <strong>Master saat ini:</strong> {o.address || 'Alamat belum tersedia'} ·{' '}
            <span>{point(o)}</span>
            {o.cluster?.name ? ` · ${o.cluster.name}` : ''}
            {o.radiusMeters != null ? ` · radius ${o.radiusMeters} m` : ''}
          </div>
          {(closed || readiness.canConfirm) && Boolean(result?.reasons?.length) && (
            <ul>
              {result.reasons.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {r.workflow?.technical === 'PARTIAL' && (
            <p className="ov-muted">
              Sebagian langkah Google belum berhasil. Bukti yang tersedia tetap dapat ditinjau.
            </p>
          )}
          <small className="ov-muted">
            {run
              ? `Terakhir diperiksa ${stamp(run.createdAt)}${cacheExpiresAt ? ` · Cache Google tersedia sampai ${stamp(cacheExpiresAt)}` : ''}`
              : 'Google belum diperiksa.'}
          </small>
        </div>
        {!closed && permissions.can_run_outlet_review && (
          <div className="ov-google-action">
            <label className="app-field">
              Petunjuk tambahan (opsional)
              <input
                maxLength={200}
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Nama jalan, kecamatan, atau patokan internal"
                disabled={busy}
              />
            </label>
            <button
              type="button"
              className="app-button app-button-primary"
              disabled={
                busy || !map.canStart || map.settings.OUTLET_MAP_COMPARISON_ENABLED === false
              }
              title={map.reason}
              onClick={() =>
                act(() =>
                  outletValidationApi.validateSingle(o.id, {
                    reviewId: r.id,
                    revision: r.revision,
                    hint,
                  })
                )
              }
            >
              {busy ? 'Memeriksa…' : 'Periksa dengan Google'}
            </button>
          </div>
        )}
      </section>

      <div className="ov-detail-grid">
        <div className="ov-detail-main">
          <GoogleOutletEvidence
            key={run?.id || 'unexamined'}
            run={run}
            outlet={o}
            disabled={busy || !map.canStart || map.settings.OUTLET_MAP_COMPARISON_ENABLED === false}
            onSelect={(placeId) => setPreview({ runId: run?.id, placeId })}
            onRecheck={
              !closed && permissions.can_run_outlet_review
                ? (candidatePlaceId) =>
                    act(() =>
                      outletValidationApi.validateSingle(o.id, {
                        reviewId: r.id,
                        revision: r.revision,
                        hint,
                        candidatePlaceId,
                      })
                    )
                : undefined
            }
            fieldPoints={
              r.fieldTasks?.filter((t) => t.status === 'DONE').map((t) => t.evidence) || []
            }
          />
          {!closed && (
            <>
              <OutletCorrectionProposal review={r} disabled={busy} act={act} digital={digital} />
              <OutletFieldReview review={r} disabled={busy} act={act} />
            </>
          )}
          {closed && Boolean(r.fieldTasks?.length) && (
            <OutletFieldReview review={r} disabled readOnly act={act} />
          )}
          <details className="ov-section">
            <summary>PIC, tenggat, dan riwayat pemeriksaan</summary>
            <div className="ov-history-stack">
              <OutletReviewAssignment
                key={r.revision}
                review={r}
                onRefresh={onRefresh}
                disabled={busy || closed}
              />
              {r.runs.length > 0 && (
                <div>
                  <h4>Riwayat pemeriksaan</h4>
                  <ol>
                    {r.runs.map((x) => (
                      <li key={x.id}>
                        {stamp(x.createdAt)} ·{' '}
                        {OUTLET_RESULT_LABELS[x.result?.code] || x.result?.code} · {x.actor?.name}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {Boolean(o.changes?.length) && (
                <div>
                  <h4>Perubahan master</h4>
                  {o.changes.map((c) => (
                    <p key={c.id}>
                      {stamp(c.createdAt)} · {c.reason} · {c.actor?.name}
                    </p>
                  ))}
                </div>
              )}
              {run?.result?.steps && (
                <div>
                  <h4>Langkah pemeriksaan Google dan kondisi layanan</h4>
                  <ul>
                    {run.result.steps.map((s, i) => (
                      <li key={i}>
                        {s.strategy} · {s.state} {s.error || s.reason || ''}
                      </li>
                    ))}
                  </ul>
                  <p className="ov-muted">
                    {run.result.calls} panggilan pada pemeriksaan ini. Skor adalah kemiripan, bukan
                    probabilitas kebenaran.
                  </p>
                </div>
              )}
            </div>
          </details>
        </div>

        <aside className="ov-decision-rail" aria-label="Keputusan dan status verifikasi">
          {!closed && (
            <OutletDigitalReadinessNotice
              readiness={readiness}
              adminAvailable={adminReadiness.canConfirm}
            />
          )}
          {!closed && permissions.can_apply_outlet_review && (
            <OutletReviewDecisionForm
              review={r}
              user={user}
              decision={decision}
              setDecision={(value) => {
                setDecision(value);
                setAcknowledgedKey('');
              }}
              draft={draft}
              busy={busy}
              onSubmit={save}
              readiness={readiness}
              adminReadiness={adminReadiness}
              acknowledged={acknowledged}
              setAcknowledged={(value) => setAcknowledgedKey(value ? ackKey : '')}
            />
          )}
          {r.decision && (
            <section className="ov-section">
              <h3>
                Keputusan terakhir
                {r.decision.action === 'ADMIN_DIGITAL_KEEP' ? ' · pertimbangan Admin' : ''}
              </h3>
              <p>{r.decision.reason || r.decision.note}</p>
              {r.decision.adminReview && (
                <details>
                  <summary>Perbedaan yang diterima Admin</summary>
                  <ul>
                    {r.decision.adminReview.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                  <p>
                    Penilaian awal: {OUTLET_RESULT_LABELS[r.decision.adminReview.originalCode]}
                  </p>
                </details>
              )}
              <small className="ov-muted">
                {r.decision.actor?.name} · {stamp(r.decision.at)}
              </small>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
