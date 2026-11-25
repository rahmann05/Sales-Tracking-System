import { useFeaturePolicy } from '../../../../shared/hooks/useFeaturePolicy';
import { useCodeMissing } from '../../../../shared/hooks/useCodeMissing';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { OutletListPanel } from './OutletListPanel';
import { RouteReferenceCard } from './RouteReferenceCard';
import { BusinessCodeInput } from '../../../../shared/components/common/BusinessCodeInput';
import { ClusterImpactReview } from './ClusterImpactReview';

const steps = ['Tim & identitas', 'Pilih outlet', 'Rute & simpan'];
const COLOR_SWATCHES = ['#1b66ca', '#0284c7', '#0d9488', '#4f46e5', '#d97706', '#e11d48'];

export function ClusterControlPanel({
  builder: b,
  user,
  allOutlets = [],
  dataLoading,
  dataError,
  onRetry,
  onOpenTeam,
  onCancel,
}) {
  const featurePolicy = useFeaturePolicy('CLUSTERS');
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('ALL');
  const deferredQuery = useDeferredValue(query);
  const activeStep = Math.min(3, Math.max(1, b.step || 1));
  const selectedIds = b.selectedOutlets.map((o) => o.id);
  const disabled = b.busy || b.saving || !featurePolicy.canStart;
  const codeMissing = useCodeMissing('CLUSTER', b.draft.code);
  const canPlanRjp = user.permissions?.can_manage_rjp !== false;
  const canViewTeam = user.permissions?.can_view_team !== false;

  const pool = useMemo(
    () => [...new Map([...allOutlets, ...b.selectedOutlets].map((o) => [o.id, o])).values()],
    [allOutlets, b.selectedOutlets]
  );

  const teamSales = useMemo(
    () => (b.team?.sales || []).filter((s) => s.supervisorId === b.draft.supervisorId),
    [b.team?.sales, b.draft.supervisorId]
  );

  const selectedSales = useMemo(
    () => teamSales.find((s) => s.id === b.draft.assignedSalesId) || null,
    [teamSales, b.draft.assignedSalesId]
  );

  const regionSuggestions = useMemo(() => {
    const unique = new Set();
    for (const o of allOutlets) {
      const region = o.cluster?.region?.trim();
      if (region && !['General Trade', 'Modern Trade', '—'].includes(region)) {
        unique.add(region);
      }
    }
    return [...unique].sort((a, z) => a.localeCompare(z, 'id-ID'));
  }, [allOutlets]);

  const baseCandidates = useMemo(
    () =>
      pool.filter(
        (o) =>
          o.type === b.draft.tradeType &&
          (o.cluster?.supervisorId === b.draft.supervisorId ||
            o.cluster?.name === 'Belum Ditugaskan' ||
            selectedIds.includes(o.id))
      ),
    [pool, b.draft.tradeType, b.draft.supervisorId, selectedIds]
  );

  const unassignedCount = useMemo(
    () =>
      baseCandidates.filter((o) => !o.clusterId || o.cluster?.name === 'Belum Ditugaskan').length,
    [baseCandidates]
  );

  const candidates = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return baseCandidates
      .filter((o) => {
        if (scope === 'UNASSIGNED') {
          return !o.clusterId || o.cluster?.name === 'Belum Ditugaskan';
        }
        if (scope === 'SELECTED') {
          return selectedIds.includes(o.id);
        }
        return true;
      })
      .filter((o) =>
        `${o.name} ${o.outletCode || ''} ${o.address || ''}`.toLowerCase().includes(q)
      );
  }, [baseCandidates, scope, selectedIds, deferredQuery]);

  const suggestedName =
    selectedSales && b.draft.region?.trim()
      ? `${selectedSales.name} - ${b.draft.region.trim()}`
      : '';
  const selectedSupervisorName =
    b.team?.supervisors?.find((s) => s.id === b.draft.supervisorId)?.name || user.name;

  return (
    <section className="cluster-control-panel" aria-label="Buat cluster">
      <header className="cluster-panel-header">
        <h1>Buat cluster wilayah</h1>
        <p>
          Langkah {activeStep} dari {steps.length} · {steps[activeStep - 1]}
        </p>
        <ol className="cluster-steps" aria-label="Tahap pembuatan">
          {steps.map((label, i) => {
            const stepNum = i + 1;
            const isDone = stepNum < activeStep;
            return (
              <li
                key={label}
                aria-current={activeStep === stepNum ? 'step' : undefined}
                data-done={isDone || undefined}
              >
                {isDone && b.setStep ? (
                  <button
                    type="button"
                    className="cluster-step-trigger"
                    disabled={disabled}
                    onClick={() => b.setStep(stepNum)}
                  >
                    <span>✓</span>
                    {label}
                  </button>
                ) : (
                  <div className="cluster-step-label">
                    <span>{stepNum}</span>
                    {label}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </header>
      <div className="cluster-panel-body app-form">
        {!featurePolicy.canStart && (
          <p role="status" className="app-notice">
            {featurePolicy.reason}
          </p>
        )}
        {b.error && (
          <p role="alert" className="app-error">
            {b.error}
          </p>
        )}
        {(b.restored || b.policyChanged) && (
          <p className="app-notice">
            {b.restoreMessage} Anggota dan dampaknya diperiksa kembali sebelum penyimpanan.
          </p>
        )}
        {b.storageError && (
          <p role="alert" className="app-error">
            {b.storageError}
          </p>
        )}
        {dataError && (
          <p role="alert" className="app-error">
            {dataError}
            <button type="button" className="app-button" onClick={onRetry}>
              Muat ulang outlet
            </button>
          </p>
        )}
        <fieldset disabled={disabled} className="app-form">
          {activeStep === 1 && (
            <>
              <p>
                Pilih Tim &amp; Sales penanggung jawab serta identitas wilayah. Setelah tersimpan,
                Anda dapat langsung menyusun jadwal PJP untuk cluster ini.
              </p>
              {b.teamError && (
                <p role="alert" className="app-error">
                  {b.teamError}
                  <button type="button" className="app-button" onClick={b.loadTeam}>
                    Muat ulang tim
                  </button>
                </p>
              )}
              {user.role === 'ADMIN' ? (
                <label className="app-field">
                  Tim Supervisor
                  <select
                    value={b.draft.supervisorId}
                    onChange={(e) => b.field('supervisorId', e.target.value)}
                    disabled={b.teamLoading || !!selectedIds.length}
                  >
                    <option value="">Pilih tim</option>
                    {(b.team?.supervisors || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s._count?.teamMembers != null ? ` (${s._count.teamMembers} Sales)` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="cluster-team-badge">
                  Tim: <strong>{user.name}</strong>
                </p>
              )}
              <label className="app-field">
                Sales penanggung jawab
                <select
                  value={b.draft.assignedSalesId}
                  onChange={(e) => b.field('assignedSalesId', e.target.value)}
                  disabled={!b.draft.supervisorId || b.teamLoading}
                >
                  <option value="">Belum ditugaskan (tetap bisa buat cluster)</option>
                  {teamSales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.assignedClusters?.length
                        ? ` · ${s.assignedClusters.length} wilayah`
                        : ' · Belum ada wilayah'}
                    </option>
                  ))}
                </select>
              </label>
              {b.draft.supervisorId && !b.teamLoading && teamSales.length === 0 && (
                <div className="cluster-inline-callout">
                  <span>
                    Tim ini belum memiliki anggota Sales aktif. Tambahkan Sales ke tim dahulu agar
                    bisa langsung dijadwalkan di PJP.
                  </span>
                  {onOpenTeam && canViewTeam && (
                    <button type="button" className="app-button" onClick={onOpenTeam}>
                      Atur tim &amp; Sales
                    </button>
                  )}
                </div>
              )}
              <label className="app-field">
                Region / wilayah
                <input
                  list="cluster-region-suggestions"
                  maxLength={100}
                  value={b.draft.region || ''}
                  placeholder="Contoh: Bandung Barat"
                  onChange={(e) => b.field('region', e.target.value)}
                />
                <datalist id="cluster-region-suggestions">
                  {regionSuggestions.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </label>
              <label className="app-field">
                Nama cluster
                <input
                  maxLength={150}
                  value={b.draft.name || ''}
                  placeholder="Contoh: Cahya - Senin atau Antapani GT"
                  onChange={(e) => b.field('name', e.target.value)}
                />
              </label>
              {suggestedName && !b.draft.name?.trim() && (
                <button
                  type="button"
                  className="cluster-chip-btn"
                  onClick={() => b.field('name', suggestedName)}
                >
                  Pakai saran nama: {suggestedName}
                </button>
              )}
              <div className="cluster-field-row">
                <label className="app-field">
                  Jenis perdagangan
                  <select
                    value={b.draft.tradeType}
                    disabled={!!selectedIds.length}
                    onChange={(e) => b.field('tradeType', e.target.value)}
                  >
                    <option value="GENERAL_TRADE">General Trade</option>
                    <option value="MODERN_TRADE">Modern Trade</option>
                  </select>
                </label>
                <label className="app-field">
                  Warna penanda
                  <div className="cluster-color-picker">
                    <input
                      type="color"
                      value={b.draft.colorHex}
                      onChange={(e) => b.field('colorHex', e.target.value)}
                    />
                    <div className="cluster-color-swatches" role="group" aria-label="Pilihan warna">
                      {COLOR_SWATCHES.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          aria-label={`Pilih warna ${hex}`}
                          aria-pressed={b.draft.colorHex?.toLowerCase() === hex}
                          className="cluster-swatch"
                          style={{ backgroundColor: hex }}
                          onClick={() => b.field('colorHex', hex)}
                        />
                      ))}
                    </div>
                  </div>
                </label>
              </div>
              <details className="cluster-advanced-code" open={codeMissing || undefined}>
                <summary>Kode klaster</summary>
                <div className="cluster-advanced-code-body">
                  <BusinessCodeInput
                    entity="CLUSTER"
                    value={b.draft.code || ''}
                    onChange={(v) => b.field('code', v)}
                    disabled={disabled}
                  />
                </div>
              </details>
              {selectedIds.length > 0 && (
                <p className="admin-footnote">
                  Lepaskan pilihan outlet pada langkah berikutnya untuk mengganti tim atau jenis
                  perdagangan.
                </p>
              )}
            </>
          )}
          {activeStep === 2 && (
            <>
              <p>
                Pilih outlet dari daftar atau klik langsung marker di peta. Semua outlet terpilih
                akan otomatis dicek rute &amp; dampaknya saat lanjut.
              </p>
              <label className="app-field">
                Cari outlet
                <input
                  type="search"
                  value={query}
                  placeholder="Nama, kode, atau alamat outlet"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="cluster-scope-pills" role="group" aria-label="Filter status outlet">
                <button
                  type="button"
                  className="cluster-pill"
                  aria-pressed={scope === 'ALL'}
                  onClick={() => setScope('ALL')}
                >
                  Semua ({baseCandidates.length})
                </button>
                <button
                  type="button"
                  className="cluster-pill"
                  aria-pressed={scope === 'UNASSIGNED'}
                  onClick={() => setScope('UNASSIGNED')}
                >
                  Belum berwilayah ({unassignedCount})
                </button>
                <button
                  type="button"
                  className="cluster-pill"
                  aria-pressed={scope === 'SELECTED'}
                  onClick={() => setScope('SELECTED')}
                >
                  Terpilih ({selectedIds.length})
                </button>
              </div>
              {dataLoading && <p role="status">Memuat outlet…</p>}
              <OutletListPanel
                outlets={candidates}
                selectedIds={selectedIds}
                disabled={disabled}
                onToggle={(id) => b.toggleOutlet(pool.find((o) => o.id === id))}
              />
              <div className="cluster-selection-bar">
                <strong>{selectedIds.length} outlet dipilih</strong>
                <div className="cluster-selection-actions">
                  {b.selectBulkOutlets && candidates.length > 0 && (
                    <button
                      type="button"
                      className="app-button"
                      disabled={disabled || selectedIds.length >= 100}
                      onClick={() => b.selectBulkOutlets(candidates)}
                    >
                      Pilih semua tampil
                    </button>
                  )}
                  {b.clearSelectedOutlets && selectedIds.length > 0 && (
                    <button
                      type="button"
                      className="app-button"
                      disabled={disabled}
                      onClick={b.clearSelectedOutlets}
                    >
                      Kosongkan
                    </button>
                  )}
                </div>
              </div>
              <details className="cluster-suggestion-box">
                <summary className="cluster-suggestion-title">Saran outlet terdekat</summary>
                <div className="app-form">
                  <label className="app-field">
                    Jumlah saran
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={b.outletCount}
                      onChange={(e) => b.setOutletCount(Number(e.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    className="app-button"
                    onClick={b.suggest}
                    disabled={(!b.centerPoint && !selectedIds.length) || disabled}
                  >
                    Cari dari titik pusat
                  </button>
                  {!b.centerPoint && !selectedIds.length && (
                    <p className="admin-footnote">
                      Klik area peta atau pilih minimal satu outlet agar sistem dapat mencari outlet
                      terdekat.
                    </p>
                  )}
                  {b.suggestions.length > 0 && (
                    <>
                      <p>
                        {b.suggestions.length} outlet disarankan:{' '}
                        {b.suggestions.map((o) => o.name).join(', ')}
                      </p>
                      <button type="button" className="app-button" onClick={b.applySuggestions}>
                        Tambahkan saran ke pilihan
                      </button>
                    </>
                  )}
                </div>
              </details>
            </>
          )}
          {activeStep === 3 && (
            <>
              <div className="cluster-review-card">
                <div className="cluster-review-title">
                  <span
                    className="cluster-color-dot"
                    style={{ backgroundColor: b.draft.colorHex || '#1b66ca' }}
                    aria-hidden="true"
                  />
                  <div>
                    <h2>{b.draft.name}</h2>
                    <span>
                      {b.draft.tradeType === 'MODERN_TRADE' ? 'Modern Trade' : 'General Trade'} ·{' '}
                      {selectedIds.length} outlet
                    </span>
                  </div>
                </div>
                <dl className="cluster-summary">
                  <dt>Region</dt>
                  <dd>{b.draft.region}</dd>
                  <dt>Tim</dt>
                  <dd>{selectedSupervisorName}</dd>
                  <dt>Sales PIC</dt>
                  <dd>{selectedSales?.name || 'Belum ditugaskan'}</dd>
                  <dt>Kode</dt>
                  <dd>{b.draft.code?.trim() || 'Otomatis oleh sistem'}</dd>
                </dl>
              </div>
              <section className="cluster-route-preview">
                <div className="cluster-route-preview-head">
                  <div>
                    <h3>Urutan referensi wilayah</h3>
                    <p>Dihitung otomatis untuk referensi jalur di peta.</p>
                  </div>
                  <button
                    type="button"
                    className="app-button"
                    disabled={!selectedIds.length || disabled}
                    onClick={b.generate}
                  >
                    {b.busy ? 'Menghitung…' : 'Hitung ulang'}
                  </button>
                </div>
                {b.routes.length > 0 ? (
                  b.routes.map((r, i) => (
                    <RouteReferenceCard
                      key={i}
                      route={r}
                      index={i}
                      isActive={i === b.activeRouteIndex}
                      onClick={() => b.setActiveRouteIndex(i)}
                      outlets={pool}
                    />
                  ))
                ) : (
                  <p className="admin-footnote">
                    Rekomendasi rute otomatis tersedia bila minimal 2 outlet memiliki koordinat GPS.
                  </p>
                )}
              </section>
              <ClusterImpactReview review={b.review} />
              {!b.review && (
                <button type="button" className="app-button" onClick={b.next}>
                  Periksa ulang dampak
                </button>
              )}
            </>
          )}
        </fieldset>
      </div>
      <footer className="cluster-panel-footer">
        <button
          type="button"
          className="app-button"
          disabled={b.busy || b.saving}
          onClick={activeStep === 1 ? onCancel : () => b.setStep((v) => v - 1)}
        >
          {activeStep === 1 ? 'Kembali ke wilayah' : 'Kembali'}
        </button>
        {activeStep < 3 ? (
          <button
            type="button"
            className="app-button app-button-primary"
            disabled={disabled || b.teamLoading || !!b.teamError}
            onClick={b.next}
          >
            {b.busy ? 'Menyiapkan…' : 'Lanjut'}
          </button>
        ) : (
          <div className="cluster-footer-actions">
            <button
              type="button"
              className={`app-button ${!canPlanRjp ? 'app-button-primary' : ''}`}
              disabled={disabled || !b.review || codeMissing}
              onClick={() => b.save({ openPlanner: false })}
            >
              {b.saving ? 'Menyimpan…' : 'Simpan wilayah'}
            </button>
            {canPlanRjp && (
              <button
                type="button"
                className="app-button app-button-primary"
                disabled={disabled || !b.review || codeMissing}
                onClick={() => b.save({ openPlanner: true })}
              >
                {b.saving ? 'Menyimpan…' : 'Simpan & susun PJP'}
              </button>
            )}
          </div>
        )}
      </footer>
    </section>
  );
}
