import { generateTodayPjpsAllSales } from './pjp.helpers.js';
export const generateDailyPjps = async () => {
  const count = await generateTodayPjpsAllSales();
  return { count, message: `PJP hari ini disiapkan (${count} rute baru)` };
};
