export function targetPeriodError(kind, period) {
  if (kind === 'MONTH') return /^\d{4}-(0[1-9]|1[0-2])$/.test(period || '') ? null : 'Periode bulanan harus YYYY-MM';
  if (kind !== 'WEEK' || !/^\d{4}-\d{2}-\d{2}$/.test(period || '')) return 'Periode mingguan harus tanggal Senin YYYY-MM-DD';
  const date = new Date(`${period}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === period && date.getUTCDay() === 1 ? null : 'Periode mingguan harus tanggal Senin yang valid';
}
export const targetKey = (kind, period, userId) => `_SALES_TARGET:${kind}:${period}:${userId}`;
export function targetResult(target, amount, { supervisorId, clusterId, eligible = true } = {}) {
  if(clusterId)return {amount:null,achievement:'—',achievementNum:null,status:'FILTERED_SCOPE',revision:0};
  const scoped = target && (!supervisorId || target.supervisorId === supervisorId);
  if (!eligible || !scoped) return { amount: null, achievement: '—', achievementNum: null, status: !eligible ? 'COMPARISON_ONLY' : target ? 'OTHER_SCOPE' : 'UNSET', revision: target?.revision || 0 };
  return { amount: target.amount, achievement: target.amount > 0 ? `${Math.round(amount / target.amount * 100)}%` : '—',
    achievementNum: target.amount > 0 ? Math.round(amount / target.amount * 100) : null,
    status: target.amount === 0 ? 'EXEMPT' : 'SET', revision: target.revision, supervisorId: target.supervisorId, updatedAt: target.updatedAt };
}
export function targetCoverage(results) {
  const eligible = results.filter(row => row.status !== 'COMPARISON_ONLY');
  return { eligible: eligible.length, assigned: eligible.filter(row => row.amount !== null).length,
    missing: eligible.filter(row => row.amount === null).length,
    exempt: eligible.filter(row => row.status === 'EXEMPT').length };
}
export const formatTarget = (value,status) => status==='OTHER_SCOPE'?'Target pada lingkup lain':status==='FILTERED_SCOPE'||status==='CUSTOM_RANGE'?'Target periode penuh tidak dibandingkan':status==='COMPARISON_ONLY'?'Hanya pembanding bulan lalu':value === null || value === undefined ? 'Belum ditetapkan' : value === 0 ? 'Tanpa target (ditetapkan)' : `Rp ${Number(value).toLocaleString('id-ID')}`;
export const targetBasisNote = 'Target ditetapkan Admin untuk satu sales dan satu periode; perubahan target default tidak mengubahnya. Nol berarti tanpa target, bukan gagal; nilai order sales tanpa target tetap ditampilkan tetapi tidak masuk pembilang persentase pencapaian target. Target tim SPV hanya berlaku pada SPV penanggung jawab yang ditetapkan. Target tidak diprorata otomatis ketika sales pindah tim. Filter klaster dan rentang mingguan khusus tidak dibandingkan dengan target periode penuh. Persentase total tidak dihitung bila target peserta belum lengkap; peserta yang hanya muncul pada bulan pembanding tidak menambah target bulan laporan.';
