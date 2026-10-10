import React from 'react';
import {CONFIG_PARAMS} from '../../../../../shared/config.mjs';
import {POLICY_OPTION_LABELS} from '../../../../../shared/operational-policy.mjs';
const processNames={VISIT:'Kunjungan PJP',ORDER:'Order',OFF_PJP:'Kunjungan luar PJP'};
const manualModes={NOTES_ONLY:'Catatan saja',REQUIRE_APPROVAL:'Diakui setelah persetujuan'};
const ruleLabel=key=>CONFIG_PARAMS.find(param=>param.key===key)?.label||'Aturan proses';
const ruleValue=(key,value)=>value==null?'Tidak tersimpan':typeof value==='boolean'?value?'Aktif':'Nonaktif':CONFIG_PARAMS.find(param=>param.key===key)?.optionLabels?.[value]||POLICY_OPTION_LABELS[value]||manualModes[value]||String(value);
const scopeLabel=scope=>scope==='GLOBAL'?'Perusahaan':String(scope).startsWith('ROLE:')?`Role ${String(scope).slice(5)}`:`Tim ${String(scope).replace(/^TEAM:/,'')}`;

export function ReportBasisNote({ basis }) {
  if (!basis) return null;
  return <aside className="rounded-lg border border-border-glass p-3 text-xs space-y-1" aria-label="Dasar dan batas laporan">
    {basis.restrictionNote&&<p role="status"><strong>Pembatasan data:</strong> {basis.restrictionNote}</p>}
    <p><strong>Dasar laporan:</strong> {basis.note}</p>
    {basis.formulaVersion&&<p>Formula {basis.formulaVersion} · {basis.processPolicies?.length||0} kelompok snapshot proses · {basis.legacyPolicyRecords||0} proses tanpa snapshot. {basis.policyNote}</p>}
    {basis.processPolicies?.length>0&&<details className="pt-2"><summary className="cursor-pointer min-h-11">Lihat versi dan aturan proses</summary><ul className="space-y-3">{basis.processPolicies.map(group=><li key={group.digest} className="rounded-lg border border-border-glass p-3 space-y-2"><strong>{processNames[group.kind]} · {group.records} proses</strong><p>{group.versions.length?group.versions.map(version=>`${scopeLabel(version.scope)}: revisi ${version.revision??'tidak tersimpan'}`).join(' · '):'Nomor revisi awal tidak tersimpan.'}</p><dl className="grid sm:grid-cols-2 gap-2">{Object.entries(group.rules).map(([key,value])=><div key={key}><dt className="text-on-surface-variant">{ruleLabel(key)}</dt><dd>{ruleValue(key,value)}</dd></div>)}</dl></li>)}</ul></details>}
    {basis.archiveNote&&<p><strong>{basis.archiveNote}</strong></p>}
    {basis.legacyAssignmentRecords > 0 && <p>{basis.legacyAssignmentRecords} rencana/pengajuan kunjungan belum memiliki konteks penugasan historis.</p>}
    {basis.channelNote && <p>{basis.channelNote}</p>}
    {basis.calendarNote&&<p>{basis.calendarNote}</p>}
    {basis.calendarMonths&&<p>Kalender: {basis.calendarMonths.map(row=>`${row.month} · ${row.revision?`versi ${row.revision}`:'belum ditetapkan'}`).join('; ')}.</p>}
    {basis.targetNote && <p>{basis.targetNote}</p>}
    {basis.targetCoverage && <p>Target ditetapkan: {basis.targetCoverage.assigned}/{basis.targetCoverage.eligible} sales. {basis.targetCoverage.missing > 0 ? 'Target belum lengkap; persentase total belum dapat dinilai.' : ''}</p>}
    {basis.unverifiedChannelAmount > 0 && <p>Nilai tanpa klasifikasi historis: Rp {basis.unverifiedChannelAmount.toLocaleString('id-ID')}.</p>}
    <p>Dibuat: {new Date(basis.generatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.</p>
  </aside>;
}
