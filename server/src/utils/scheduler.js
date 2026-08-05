import cron from 'node-cron';
import { generateDailyPjps } from '../modules/pjp/pjp.service.js';

export const initScheduler = () => {
  // Run daily at 03:00 AM (0 3 * * *)
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler]: Starting daily PJP generation job...');
    try {
      const result = await generateDailyPjps();
      console.log('[Scheduler]: PJP Generation finished successfully:', result.message);
    } catch (error) {
      console.error('[Scheduler]: Failed to generate daily PJPs:', error);
    }
  });

  console.log('[Scheduler]: Daily PJP cron job initialized (Scheduled for 03:00 AM daily).');
};
