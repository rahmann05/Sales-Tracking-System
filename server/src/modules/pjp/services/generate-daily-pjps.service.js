import { generateTodayPjpsAllSales } from './pjp.helpers.js';
export const generateDailyPjps = async (codes) => {
  const count = await generateTodayPjpsAllSales(codes);
  return { count, message: `PJP hari ini disiapkan (${count} rute baru)` };
};
