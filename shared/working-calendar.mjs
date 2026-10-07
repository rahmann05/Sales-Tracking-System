export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const workingDays = (value = '1,2,3,4,5,6') => [...new Set(String(value).split(',').map(Number))].filter(day => Number.isInteger(day) && day >= 0 && day <= 6).sort((a,b) => (a || 7) - (b || 7));
export function monthWorkingDays(year, month, configuredDays, todayKey) {
  const days = workingDays(configuredDays);
  let total = 0, elapsed = 0;
  for (let day = 1; day <= new Date(Date.UTC(year, month, 0)).getUTCDate(); day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (!days.includes(date.getUTCDay())) continue;
    total++;
    if (date.toISOString().slice(0,10) <= todayKey) elapsed++;
  }
  return { total, elapsed };
}
