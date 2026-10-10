const modern = new Set(['HYPERMARKET','DRUGSTORE','NAT_SUPERMARKET','LOKAL_SUPERMARKET','CHAIN_MINIMARKET','LOKAL_MINIMARKET','OTHER_MT']);
const wholesale = new Set(['GROSIR','SEMI_GROSIR','PERKULAKAN','SEMI_WHOLESALE']);
const retail = new Set(['TOKO_KELONTONG','WARUNG','TOKO_LISTRIK','INSTITUSI','TOKO_RETAIL','OTHER_GT','KOPERASI','BIDAN','OUTLET_MOTORIS','APOTIK','BABY_SHOP']);
export function reportChannel(outlet = {}) {
  const sub = String(outlet.subChannel || '').toUpperCase();
  const channel = String(outlet.channel || outlet.type || '').toUpperCase();
  if (channel === 'MODERN_TRADE' || modern.has(sub)) return 'MODERN_TRADE';
  if (wholesale.has(sub) || wholesale.has(channel)) return 'SEMI_WHOLESALE';
  if (retail.has(sub) || ['GENERAL_TRADE','RETAIL'].includes(channel)) return 'RETAIL';
  return 'UNCLASSIFIED';
}
export const ratioPercent = (value, base) => base > 0 ? `${Math.round(value / base * 100)}%` : '—';
// Duration requires a real ordered IN/OUT pair. Unknown evidence is different from a measured zero.
export function measuredVisitMinutes(stop={}){
 if((stop.policySnapshot?.values?.SALES_ATTENDANCE_MODE||'IN_OUT')!=='IN_OUT'||stop.visitSession?.state==='INCOMPLETE')return null;
 const entered=stop.attendances?.find(a=>a.type==='IN'),exited=stop.attendances?.find(a=>a.type==='OUT');
 if(!entered?.timestamp||!exited?.timestamp)return null;
 const start=+new Date(entered.timestamp),end=+new Date(exited.timestamp);
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return null;
 return Number.isFinite(exited.durationMinutes)&&exited.durationMinutes>=0?exited.durationMinutes:Math.round((end-start)/6000)/10;
}
// Revenue has a transaction snapshot. Never reclassify it using today's outlet master.
export function orderChannelAmounts(stop, result) {
  if (!result.effective) return [];
  const orders = (stop.orders || []).filter(order => order.status === 'APPROVED' && !order.deletedAt);
  if (!orders.length) return [{ channelKey: 'UNCLASSIFIED', amount: result.orderAmount, historical: false }];
  return orders.map(order => ({
    channelKey: reportChannel(order.customerSnapshot || {}),
    amount: Number(order.totalValue),
    historical: reportChannel(order.customerSnapshot || {}) !== 'UNCLASSIFIED',
  }));
}
export const reportBasis = (generatedAt = new Date().toISOString()) => ({
  generatedAt,
  organization: 'CURRENT_ACTIVE_TEAM',
  target: 'CURRENT_GLOBAL_DEFAULT',
  calendar: 'CURRENT_SETTINGS',
  note: 'Tim, nama sales, wilayah, target default dan kalender kerja mengikuti pengaturan saat laporan dibuat; belum merupakan arsip penugasan dan target periode tersebut. Nilai order disetujui dapat berubah setelah keputusan approval.',
});
export const channelBasisNote = 'Nilai per channel menggunakan klasifikasi yang tersimpan saat order dibuat. Nilai tanpa snapshot masuk Belum diklasifikasi. Jumlah kunjungan dan EC per channel mengikuti klasifikasi pelanggan saat ini; kunjungan luar PJP ditampilkan terpisah.';
const csvCell = value => {
  const raw = String(value ?? '');
  const safe = /^[=+@\-\t\r\n]/.test(raw) && typeof value !== 'number' ? `'${raw}` : raw;
  return `"${safe.replaceAll('"','""')}"`;
};
const toCsv = rows => rows.map(row => row.map(csvCell).join(',')).join('\r\n');
export const durationStatus=row=>row.isDurationAnomaly?'Di bawah batas aturan':row.durationMinutes==null?'Tidak tersedia':row.durationCheckEnabled===false?'Tidak diwajibkan':'Sesuai batas';
export const distanceStatus=row=>row.distanceWarning==='WARNING'?'Di luar radius':row.deviationMeters==null?'Tidak tersedia':'Dalam radius';
export function attendanceAuditCsv(rows=[]){
 const headers=['No','Tanggal','Salesman','Klaster','Kode toko','Nama toko','Jam masuk','Jam keluar','Durasi (menit)','Status durasi','Batas durasi (menit)','Deviasi GPS (meter)','Status jarak','Radius aturan (meter)','Jarak perjalanan (km)','Jeda perjalanan (menit)','Anomali perjalanan','Alasan','Catatan','Effective call','Nilai order (Rp)','Versi aturan kunjungan'];
 return toCsv([headers,...rows.map((r,index)=>[index+1,r.date,r.salesmanName,r.clusterName,r.customerId,r.customerName,r.timeIn,r.timeOut,r.durationMinutes,durationStatus(r),r.minimumDuration,r.deviationMeters,distanceStatus(r),r.radiusMeters,r.travelDistanceKm,r.travelDurationMinutes,r.isTravelAnomaly?'Terdeteksi':'Tidak terdeteksi',r.travelAnomalyReason||r.earlyReason,r.reason||r.remark,r.effectiveCall,r.orderAmount,JSON.stringify(r.policyVersions||[])])]);
}
const reportBasisText = basis => [basis?.note,basis?.targetNote,basis?.calendarNote,basis?.archiveNote,basis?.formulaVersion?`Formula ${basis.formulaVersion}; ${basis.processPolicies?.length||0} kelompok snapshot; ${basis.legacyPolicyRecords||0} proses tanpa snapshot.`:'',basis?.policyNote,
  ...(basis?.calendarMonths||[]).map(row=>`Kalender ${row.month}: ${row.revision?`versi ${row.revision}`:'belum ditetapkan'}`)].filter(Boolean).join(' ');
export function weeklyCsv(report) {
  const days = report.period?.weekDays || [];
  const headers = ['Salesman','Klaster',...days.flatMap(d=>['Plan','Act','EC','Nilai order disetujui'].map(metric=>`${d.dayName} ${d.dateStr} ${metric}`)),'Total Plan','Total Actual','Call Compliance Rate','Total EC','EC Rate','Total nilai order disetujui (Rp)','Target periode mingguan','Target Achievement'];
  headers.push('Dibuat pada (UTC)', 'Dasar laporan');
  headers.push('Status target','Versi target');
  return toCsv([headers,...(report.salesmen || []).map(s=>[s.salesmanName,s.clusterName,...days.flatMap(d=>{const row=s.days?.[d.dayName.toLowerCase()]||{};return [row.plan||0,row.actual||0,row.ec||0,row.omzet===null?'Dibatasi aturan laporan':row.omzet||0];}),s.weeklyTotal?.plan,s.weeklyTotal?.actual,s.weeklyTotal?.callRate,s.weeklyTotal?.ec,s.weeklyTotal?.ecRate,s.weeklyTotal?.omzet,s.weeklyTotal?.target,s.weeklyTotal?.targetAchievement,report.basis?.generatedAt,reportBasisText(report.basis),s.target?.status,s.target?.revision])]);
}
export function mtdCsv(report) {
  const headers = ['No','Salesman','Klaster penugasan (lihat dasar laporan)','Target periode bulanan (Rp)','Nilai order disetujui MTD (Rp)','Pencapaian target periode','Nilai order disetujui bulan lalu (Rp)','Rasio MTD terhadap bulan lalu','MTD Plan Calls','MTD Actual Calls','Call Compliance Rate','MTD Effective Calls','Effective Call Rate','Total SKU Sold','Avg SKU per Call','Bulan','Tahun','Dibuat pada (UTC)','Dasar laporan','Status target','Versi target'];
  return toCsv([headers,...(report.salesmen || []).map((s,index)=>[index+1,s.salesmanName,s.clusterName,s.monthlyTarget,s.mtdActualAmount,s.achievementRate,s.lastMonthActual,s.mtdToLmaRate,s.mtdPlanCalls,s.mtdActualCalls,s.callComplianceRate,s.mtdEffectiveCalls,s.effectiveCallRate,s.totalSkuSold,s.avgSkuPerCall,report.period?.month,report.period?.year,report.basis?.generatedAt,reportBasisText(report.basis),s.target?.status,s.target?.revision])]);
}
export function reportSalesOptions(current, rows, selectedId = '') {
  const options = new Map(current.map(user => [user.id, user]));
  for (const row of rows || []) options.set(row.salesmanId, {
    id: row.salesmanId, name: row.salesmanName, cluster: { name: row.clusterName },
    historicalOnly: !current.some(user => user.id === row.salesmanId),
  });
  if (selectedId && !options.has(selectedId)) options.set(selectedId, { id: selectedId, name: 'Sales terpilih (tidak ada aktivitas sesuai periode)' });
  return [...options.values()].sort((a, b) => a.name.localeCompare(b.name, 'id'));
}
export function dailyCallCsv(report) {
  const headers = ['No','Salesman','Tanggal','Time-In','Time-Out','Duration (Min)','Customer ID','Customer Name','Sub Channel','Freq','Itny','Plan Call','Actual Call','Effective Call','SKU Sold','Nilai order disetujui (Rp)','Reason','Remark','Deviation (Meters)','Distance Warning','Anomali Durasi','Klaster penugasan','Konteks penugasan','Dibuat pada (UTC)','Dasar laporan'];
  return toCsv([headers,...(report.rows || []).map(r=>[r.no,r.salesmanName,r.date,r.timeIn,r.timeOut,r.durationMinutes,r.customerId,r.customerName,r.subChannel,r.freq,r.itny,r.planCall,r.actualCall,r.effectiveCall,r.skuSold,r.orderAmount,r.reason,r.remark,r.deviationMeters,r.distanceWarning,r.isDurationAnomaly?'YA':'TIDAK',r.clusterName,r.assignmentHistorical?'Tersimpan':'Belum terverifikasi',report.basis?.generatedAt,reportBasisText(report.basis)])]);
}

// Daily report rows distinguish performed calls (IN) from completed visits (OUT).
export function dailyCompletion(rows = []) {
  const planned=rows.filter(r=>r.planCall==='Y');
  const completed=planned.filter(r=>Boolean(r.rawTimeOut));
  const exceptions=planned.filter(r=>r.isSkipped);
  const actual=planned.filter(r=>r.actualCall==='Y').length;
  const remaining=planned.filter(r=>!r.rawTimeOut&&!r.isSkipped).length;
  return { completed:completed.length,remaining,complianceRate:planned.length?Math.round(actual/planned.length*100):0,status:!planned.length?'Belum ada PJP':remaining===0?(exceptions.length?'Tuntas dengan pengecualian':'Selesai'):actual?'Sedang Kunjungan':'Belum Mulai' };
}
