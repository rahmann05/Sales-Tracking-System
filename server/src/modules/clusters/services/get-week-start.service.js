/** getWeekStart - single-responsibility service (extracted from cluster-generator.service.js). */
/** Dapatkan tanggal Senin dari minggu yang berisi `date` */
export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Minggu, 1=Senin ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};
