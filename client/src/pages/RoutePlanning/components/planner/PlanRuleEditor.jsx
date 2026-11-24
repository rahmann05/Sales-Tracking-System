import React, { useEffect, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { TAB_IDS } from '../../../../constants/navigation';
import { setWorkspaceValues } from '../../../../shared/utils/workspaceNavigation';
import { outletOperationalPoint } from '../../../../../../shared/outlet-location.mjs';
import { knownPoint } from '../../../../../../shared/outlet-validation.mjs';
import {
  frequencyWeeks,
  allowedVisitIntervals,
  firstWorkingAnchorDate,
  buildClusterDraftRules,
} from '../../../../../../shared/pjp-planning.mjs';
import { PlanSubstituteEditor } from './PlanSubstituteEditor';
export function PlanRuleEditor({ planner: p }) {
  const { user, settings, setActiveTab } = useApp(),
    policy = p.source.planningPolicies?.[p.value.supervisorId]?.values || settings,
    intervals = allowedVisitIntervals(policy),
    defaultInterval = Number(policy.PJP_DEFAULT_INTERVAL || 1);
  const canOpenOutlet =
    ['ADMIN', 'SUPERVISOR'].includes(user?.role) &&
    (user?.permissions?.can_manage_outlets !== false ||
      Boolean(user?.permissions?.can_validate_outlet));
  const openOutletLocation = (outletId) => {
    if (!outletId) return;
    if (typeof window !== 'undefined' && window.location?.href) {
      setWorkspaceValues({ outletId }, { tab: TAB_IDS.OUTLET_MANAGEMENT });
    }
    setActiveTab?.(TAB_IDS.OUTLET_MANAGEMENT);
  };
  const [salesId, setSalesId] = useState(''),
    [query, setQuery] = useState('');
  useEffect(() => {
    if (p.focusSalesId) setSalesId(p.focusSalesId);
  }, [p.focusSalesId]);
  const people = p.source.sales.filter((s) => s.supervisorId === p.value.supervisorId),
    person = people.find((s) => s.id === salesId) || people[0];
  const shops = p.source.outlets.filter((o) => o.cluster?.supervisorId === p.value.supervisorId),
    rules = p.value.rules
      .map((r, index) => ({ ...r, index }))
      .filter((r) => r.userId === person?.id);
  const clusterDraftCandidates = buildClusterDraftRules({
    person,
    shops,
    existingOutletIds: rules.map((r) => r.outletId),
    startsOn: p.value.startsOn,
    workingDays: p.source.workingDays,
    allowedIntervals: intervals,
    defaultInterval,
  });
  const eligible = shops.filter(
    (o) =>
      !rules.some((r) => r.outletId === o.id) &&
      `${o.name} ${o.outletCode || ''} ${o.cluster?.name}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  const change = (index, key, value) =>
    p.change((v) => ({
      ...v,
      rules: v.rules.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    }));
  const add = (id) => {
    if (!id || !person) return;
    const o = shops.find((o) => o.id === id);
    p.change((v) => ({
      ...v,
      rules: [
        ...v.rules,
        {
          userId: person.id,
          outletId: id,
          anchorDate: firstWorkingAnchorDate(v.startsOn, p.source.workingDays),
          intervalWeeks: frequencyWeeks(o.itineraryCode) || defaultInterval,
          reason: '',
        },
      ],
    }));
  };
  const importClusterOutlets = () => {
    if (!person || !clusterDraftCandidates.length) return;
    p.change((v) => ({ ...v, rules: [...v.rules, ...clusterDraftCandidates] }));
  };
  const importTemplates = () => {
    if (!person) return;
    const existing = new Set(rules.map((r) => r.outletId)),
      newRules = [];
    for (const t of person.pjpTemplates || [])
      for (const stop of t.stops) {
        if (existing.has(stop.outletId) || !shops.some((o) => o.id === stop.outletId)) continue;
        existing.add(stop.outletId);
        let anchor = new Date(`${p.value.startsOn}T00:00:00Z`);
        anchor.setUTCDate(anchor.getUTCDate() + ((t.dayOfWeek - anchor.getUTCDay() + 7) % 7));
        newRules.push({
          userId: person.id,
          outletId: stop.outletId,
          anchorDate: anchor.toISOString().slice(0, 10),
          intervalWeeks:
            frequencyWeeks(shops.find((o) => o.id === stop.outletId)?.itineraryCode) ||
            defaultInterval,
          reason: '',
        });
      }
    p.change((v) => ({ ...v, rules: [...v.rules, ...newRules] }));
  };
  return (
    <section className="admin-panel planner-rules">
      <div className="admin-panel-heading">
        <div>
          <h2>Aturan kunjungan</h2>
          <p>
            Satu tanggal acuan menentukan hari kunjungan dan pengulangan setiap 1, 2, atau 4 minggu.
          </p>
        </div>
      </div>
      <div className="planner-panel-body">
        <label className="app-field">
          Sales
          <select value={person?.id || ''} onChange={(e) => setSalesId(e.target.value)}>
            {people.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {!people.length && (
          <p className="app-empty">
            {!p.value.supervisorId
              ? 'Pilih Tim Supervisor di atas untuk menampilkan daftar Sales.'
              : 'Tim ini belum memiliki Sales aktif. Penugasan Sales dikelola melalui Tim.'}
          </p>
        )}
        <div className="planner-sales-summary">
          <strong>{person?.name || 'Belum ada Sales'}</strong>
          <span>
            {person?.assignedClusters?.map((c) => c.name).join(' · ') ||
              person?.cluster?.name ||
              'Belum memiliki wilayah khusus'}{' '}
            · {rules.length} outlet terencana
          </span>
          {p.focusClusterId && person?.assignedClusters?.find((c) => c.id === p.focusClusterId) && (
            <span className="planner-focus-pill">
              Fokus dari cluster:{' '}
              <strong>
                {person.assignedClusters.find((c) => c.id === p.focusClusterId)?.name}
              </strong>
            </span>
          )}
        </div>
        <div className="app-actions">
          <button
            type="button"
            className="admin-button"
            disabled={
              !person ||
              p.busy ||
              p.value.status !== 'DRAFT' ||
              !p.canStart ||
              !clusterDraftCandidates.length
            }
            onClick={importClusterOutlets}
          >
            Ambil outlet dari cluster Sales
            {clusterDraftCandidates.length ? ` (${clusterDraftCandidates.length})` : ''}
          </button>
          <button
            type="button"
            className="admin-button"
            disabled={!person || p.busy || p.value.status !== 'DRAFT' || !p.canStart}
            onClick={importTemplates}
          >
            Ambil sebagai draft dari template lama
          </button>
        </div>
        <p className="admin-footnote">
          Tarik outlet langsung dari cluster Sales atau gunakan template lama sebagai saran. Periksa
          kembali tanggal acuan dan interval sebelum diterbitkan.
        </p>
        <fieldset disabled={p.busy || p.loading || p.value.status !== 'DRAFT' || !p.canStart}>
          <label className="app-field">
            Cari outlet tim
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nama, kode, atau cluster"
            />
          </label>
          <label className="app-field">
            Tambahkan ke jadwal {person?.name}
            <select value="" onChange={(e) => add(e.target.value)} disabled={!person}>
              <option value="">Pilih outlet…</option>
              {eligible.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {o.cluster?.name} · {o.itineraryCode || 'Interval belum ditetapkan'}
                </option>
              ))}
            </select>
          </label>
          <ol className="planner-rule-list">
            {rules.map((r, n) => {
              const o = shops.find((o) => o.id === r.outletId);
              return (
                <li key={`${r.outletId}:${r.index}`}>
                  <header>
                    <span className="app-sequence">{n + 1}</span>
                    <div>
                      <h3>{o?.name || 'Outlet tidak tersedia'}</h3>
                      <p>
                        {o?.outletCode} · {o?.cluster?.name || 'Periksa penugasan wilayah'}
                      </p>
                      {o && !knownPoint(outletOperationalPoint(o)) && (
                        <div className="planner-gps-warning">
                          <span>Titik GPS belum tersedia</span>
                          {canOpenOutlet && (
                            <button
                              type="button"
                              className="admin-button"
                              onClick={() => openOutletLocation(o.id)}
                            >
                              Cek lokasi
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="admin-button"
                      aria-label={`Hapus ${o?.name || 'outlet'} dari draft`}
                      onClick={() =>
                        p.change((v) => ({ ...v, rules: v.rules.filter((_, i) => i !== r.index) }))
                      }
                    >
                      Hapus
                    </button>
                  </header>
                  <div className="planner-rule-fields">
                    <label className="app-field">
                      Tanggal acuan
                      <input
                        type="date"
                        required
                        value={r.anchorDate}
                        onChange={(e) => change(r.index, 'anchorDate', e.target.value)}
                      />
                    </label>
                    <label className="app-field">
                      Ulang setiap
                      <select
                        value={r.intervalWeeks}
                        onChange={(e) => change(r.index, 'intervalWeeks', Number(e.target.value))}
                      >
                        {!intervals.includes(Number(r.intervalWeeks)) && (
                          <option value={r.intervalWeeks} disabled>
                            F{r.intervalWeeks} dinonaktifkan — pilih interval
                          </option>
                        )}
                        {intervals.map((i) => (
                          <option key={i} value={i}>
                            {i} minggu · F{i}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="app-field">
                      Alasan penugasan / penyesuaian
                      <input
                        maxLength={500}
                        value={r.reason || ''}
                        onChange={(e) => change(r.index, 'reason', e.target.value)}
                        placeholder="Wajib untuk Sales pengganti"
                      />
                    </label>
                  </div>
                  <PlanSubstituteEditor
                    rule={r}
                    people={people}
                    startsOn={p.value.startsOn}
                    endsOn={p.value.endsOn}
                    enabled={
                      policy.PJP_ALLOW_TEMPORARY_SUBSTITUTION === true &&
                      policy.PJP_ALLOW_OWNER_OVERRIDE !== false
                    }
                    onChange={(value) => change(r.index, 'substitute', value)}
                  />
                  <div className="app-actions">
                    {[-1, 1].map((offset) => (
                      <button
                        type="button"
                        className="admin-button"
                        key={offset}
                        disabled={offset === -1 ? n === 0 : n === rules.length - 1}
                        onClick={() =>
                          p.change((v) => {
                            const next = [...v.rules],
                              other = rules[n + offset].index;
                            [next[r.index], next[other]] = [next[other], next[r.index]];
                            return { ...v, rules: next };
                          })
                        }
                      >
                        {offset === -1 ? 'Naik' : 'Turun'}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>
          {!rules.length && (
            <p className="app-empty">
              Tambahkan outlet dan tentukan tanggal acuan. Semua cluster Sales tersedia sebagai
              wilayah perencanaan.
            </p>
          )}
        </fieldset>
      </div>
    </section>
  );
}
