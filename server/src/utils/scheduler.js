import {remindVehicleServices} from '../modules/vehicles/services/service-reminders.service.js';
import {retainSystemHistory} from '../modules/notifications/services/history-retention.service.js';
import {scanMissingOut} from '../modules/attention/operational-exceptions.service.js';
import cron from 'node-cron';
import { generateDailyPjps } from '../modules/pjp/pjp.service.js';
import { runAttentionEscalation } from '../modules/attention/attention-escalation.service.js';
import { schedulerMonitor, nextDailyPjp } from './scheduler-health.js';
import {dispatchNotifications} from '../modules/notifications/services/notification-delivery.service.js';
import {purgeExpiredLocations} from '../modules/users/services/location-retention.service.js';

export const initScheduler = () => {
  schedulerMonitor.register('HISTORY_RETENTION','Retensi notifikasi dan arsip audit',Date.now()+3600000,3600000);
  cron.schedule('0 * * * *',()=>{schedulerMonitor.run('HISTORY_RETENTION',retainSystemHistory,now=>now+3600000).catch(()=>console.error('[Scheduler]: History retention scan failed.'));},{timezone:'Asia/Jakarta'});
  schedulerMonitor.register('VEHICLE_SERVICE','Pengingat servis berkala',Date.now()+3600000,3600000);
  cron.schedule('0 * * * *',()=>{schedulerMonitor.run('VEHICLE_SERVICE',remindVehicleServices,now=>now+3600000).catch(()=>console.error('[Scheduler]: Vehicle service reminder scan failed.'));},{timezone:'Asia/Jakarta'});
  schedulerMonitor.register('GPS_RETENTION','Masa simpan telemetri GPS',Date.now()+3600000,3600000);
  cron.schedule('0 * * * *',()=>{schedulerMonitor.run('GPS_RETENTION',purgeExpiredLocations,now=>now+3600000).catch(()=>console.error('[Scheduler]: GPS telemetry retention scan failed.'));},{timezone:'Asia/Jakarta'});
  schedulerMonitor.register('NOTIFICATIONS','Siaran notifikasi setelah transaksi',Date.now()+5000,15000);
  setInterval(()=>{schedulerMonitor.run('NOTIFICATIONS',dispatchNotifications,now=>now+5000).catch(()=>console.error('[Scheduler]: Notification outbox scan failed.'));},5000).unref();
  schedulerMonitor.register('SLA', 'Pemindaian eskalasi SLA', Date.now() + 5 * 60000, 5 * 60000);
  schedulerMonitor.register('MISSING_OUT','Pemeriksaan OUT kunjungan dan batas shift',Date.now()+5*60000,5*60000);
  schedulerMonitor.register('PJP', 'Pembuatan PJP harian · 03.00 WIB', nextDailyPjp(), 15 * 60000);
  cron.schedule('*/5 * * * *',async()=>{
    try{await schedulerMonitor.run('MISSING_OUT',scanMissingOut,now=>now+5*60000);}catch(error){console.error('Pemeriksaan OUT terlewat gagal:',error.message);}
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
