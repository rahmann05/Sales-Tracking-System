import {scanMissingOut} from '../modules/attention/operational-exceptions.service.js';
import cron from 'node-cron';
import { generateDailyPjps } from '../modules/pjp/pjp.service.js';
import { runAttentionEscalation } from '../modules/attention/attention-escalation.service.js';
import { schedulerMonitor, nextDailyPjp } from './scheduler-health.js';
import {dispatchNotifications} from '../modules/notifications/services/notification-delivery.service.js';

export const initScheduler = () => {
  schedulerMonitor.register('NOTIFICATIONS','Siaran notifikasi setelah transaksi',Date.now()+5000,15000);
  setInterval(()=>{schedulerMonitor.run('NOTIFICATIONS',dispatchNotifications,now=>now+5000).catch(()=>console.error('[Scheduler]: Notification outbox scan failed.'));},5000).unref();
  schedulerMonitor.register('SLA', 'Pemindaian eskalasi SLA', Date.now() + 5 * 60000, 5 * 60000);
  schedulerMonitor.register('PJP', 'Pembuatan PJP harian · 03.00 WIB', nextDailyPjp(), 15 * 60000);
  cron.schedule('*/5 * * * *',async()=>{
    try{await scanMissingOut();}catch(error){console.error('Pemeriksaan OUT terlewat gagal:',error.message);}
    try{const result=await schedulerMonitor.run('SLA', runAttentionEscalation, now => now + 5 * 60000);if(result?.notified)console.log('[Scheduler]: SLA escalations sent:',result.notified);}
    catch(error){console.error('[Scheduler]: SLA escalation failed:',error.message);}
  },{timezone:'Asia/Jakarta'});
  // Run daily at 03:00 AM (0 3 * * *)
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler]: Starting daily PJP generation job...');
    try {
      const result = await schedulerMonitor.run('PJP', generateDailyPjps, nextDailyPjp);
      if(result)console.log('[Scheduler]: PJP Generation finished successfully:', result.message);
    } catch (error) {
      console.error('[Scheduler]: Failed to generate daily PJPs:', error);
    }
  }, { timezone: 'Asia/Jakarta' });

  console.log('[Scheduler]: Daily PJP cron job initialized (Scheduled for 03:00 AM daily).');
};
