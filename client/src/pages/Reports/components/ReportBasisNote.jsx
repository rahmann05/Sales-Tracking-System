import React from 'react';
import { CONFIG_PARAMS } from '../../../../../shared/config.mjs';
import { POLICY_OPTION_LABELS } from '../../../../../shared/operational-policy.mjs';
const processNames = { VISIT: 'Kunjungan PJP', ORDER: 'Order', OFF_PJP: 'Kunjungan luar PJP' };
const manualModes = { NOTES_ONLY: 'Catatan saja', REQUIRE_APPROVAL: 'Diakui setelah persetujuan' };
const ruleLabel = (key) =>
  CONFIG_PARAMS.find((param) => param.key === key)?.label || 'Aturan proses';
const ruleValue = (key, value) =>
  value == null
    ? 'Tidak tersimpan'
    : typeof value === 'boolean'
      ? value
        ? 'Aktif'
        : 'Nonaktif'
      : CONFIG_PARAMS.find((param) => param.key === key)?.optionLabels?.[value] ||
        POLICY_OPTION_LABELS[value] ||
        manualModes[value] ||
        String(value);
const scopeLabel = (scope) =>
  scope === 'GLOBAL'
    ? 'Perusahaan'
    : String(scope).startsWith('ROLE:')
      ? `Role ${String(scope).slice(5)}`
      : `Tim ${String(scope).replace(/^TEAM:/, '')}`;

export function ReportBasisNote({ basis, collapsible = true }) {
  if (!basis) return null;

  const calendarSummary = basis.calendarMonths?.length
    ? basis.calendarMonths
        .map((row) => `${row.month} (${row.revision ? `v${row.revision}` : 'belum ditetapkan'})`)
        .join(', ')
    : '';
  const targetSummary = basis.targetCoverage
    ? `Target ${basis.targetCoverage.assigned}/${basis.targetCoverage.eligible} sales`
    : '';
  const generatedLabel = basis.generatedAt
    ? `${new Date(basis.generatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`
    : '';

  const content = (
    <div className="space-y-1.5 text-xs text-on-surface-variant leading-relaxed">
      {basis.restrictionNote && (
        <p role="status" className="text-on-surface">
          <strong>Pembatasan data:</strong> {basis.restrictionNote}
        </p>
      )}
      <p>
        <strong className="text-on-surface">Dasar laporan:</strong> {basis.note}
      </p>
      {basis.formulaVersion && (
        <p>
          Formula {basis.formulaVersion} · {basis.processPolicies?.length || 0} kelompok snapshot
          proses · {basis.legacyPolicyRecords || 0} proses tanpa snapshot. {basis.policyNote}
        </p>
      )}
      {basis.processPolicies?.length > 0 && (
        <details className="pt-1">
          <summary className="cursor-pointer min-h-9 font-medium text-on-surface">
            Lihat versi dan aturan proses
          </summary>
          <ul className="space-y-2 mt-2">
            {basis.processPolicies.map((group) => (
              <li
                key={group.digest}
                className="rounded-lg border border-border-glass bg-surface p-3 space-y-2"
              >
                <strong className="text-on-surface">
                  {processNames[group.kind]} · {group.records} proses
                </strong>
                <p>
                  {group.versions.length
                    ? group.versions
                        .map(
                          (version) =>
                            `${scopeLabel(version.scope)}: revisi ${version.revision ?? 'tidak tersimpan'}`
                        )
                        .join(' · ')
                    : 'Nomor revisi awal tidak tersimpan.'}
                </p>
                <dl className="grid sm:grid-cols-2 gap-2">
                  {Object.entries(group.rules).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-on-surface-variant">{ruleLabel(key)}</dt>
                      <dd className="text-on-surface">{ruleValue(key, value)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </details>
      )}
      {basis.archiveNote && (
        <p className="text-on-surface">
          <strong>{basis.archiveNote}</strong>
        </p>
      )}
      {basis.legacyAssignmentRecords > 0 && (
        <p>
          {basis.legacyAssignmentRecords} rencana/pengajuan kunjungan belum memiliki konteks
          penugasan historis.
        </p>
      )}
      {basis.channelNote && <p>{basis.channelNote}</p>}
      {basis.calendarNote && <p>{basis.calendarNote}</p>}
      {basis.calendarMonths && (
        <p>
          Kalender:{' '}
          {basis.calendarMonths
            .map(
              (row) =>
                `${row.month} · ${row.revision ? `versi ${row.revision}` : 'belum ditetapkan'}`
            )
            .join('; ')}
          .
        </p>
      )}
      {basis.targetNote && <p>{basis.targetNote}</p>}
      {basis.targetCoverage && (
        <p>
          Target ditetapkan: {basis.targetCoverage.assigned}/{basis.targetCoverage.eligible} sales.{' '}
          {basis.targetCoverage.missing > 0
            ? 'Target belum lengkap; persentase total belum dapat dinilai.'
            : ''}
        </p>
      )}
      {basis.unverifiedChannelAmount > 0 && (
        <p>
          Nilai tanpa klasifikasi historis: Rp{' '}
          {basis.unverifiedChannelAmount.toLocaleString('id-ID')}.
        </p>
      )}
      {generatedLabel && <p>Dibuat: {generatedLabel}.</p>}
    </div>
  );

  if (!collapsible) {
    return (
      <aside
        className="rounded-lg border border-border-glass bg-surface p-3"
        aria-label="Dasar dan batas laporan"
      >
        {content}
      </aside>
    );
  }

  const summaryBits = [calendarSummary && `Kalender ${calendarSummary}`, targetSummary, generatedLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <details
      className="rounded-xl border border-border-glass bg-surface"
      aria-label="Dasar dan batas laporan"
    >
      <summary className="px-4 py-2.5 cursor-pointer flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant select-none">
        <span className="font-semibold text-on-surface">
          Dasar &amp; batas laporan
          {basis.restrictionNote ? ' · Pembatasan data aktif' : ''}
        </span>
        {summaryBits && <span className="text-[11px]">{summaryBits}</span>}
      </summary>
      <div className="px-4 pb-3.5 pt-2 border-t border-border-glass bg-surface-container-low/40">
        {content}
      </div>
    </details>
  );
}
