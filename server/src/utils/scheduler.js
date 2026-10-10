import {maintainGoogleLocations} from '../modules/outlets/services/outlet-google-location.service.js';
import {rollOutletFieldPjps} from '../modules/outlets/services/outlet-field-pjp.service.js';
import {remindVehicleServices} from '../modules/vehicles/services/service-reminders.service.js';
import {retainSystemHistory} from '../modules/notifications/services/history-retention.service.js';
import {scanMissingOut} from '../modules/attention/operational-exceptions.service.js';
import cron from 'node-cron';
import { generateDailyPjps } from '../modules/pjp/pjp.service.js';
import { runAttentionEscalation } from '../modules/attention/attention-escalation.service.js';
import { schedulerMonitor, nextDailyPjp } from './scheduler-health.js';
import {dispatchNotifications} from '../modules/notifications/services/notification-delivery.service.js';
import {purgeExpiredLocations} from '../modules/users/services/location-retention.service.js';
import {runValidationJobs} from '../modules/outlets/services/outlet-validation-job.service.js';
import {purgeOutletProviderContent} from '../modules/outlets/services/outlet-provider-content.service.js';
import {prisma} from '../config/prisma.js';
import {runScheduledPublications} from '../modules/pjp/services/publication-schedule.service.js';
import {runAssignmentSchedules} from '../modules/config/services/assignment-schedules.service.js';
import {runOutletChanges} from '../modules/outlets/services/outlet-change-queue.service.js';

export const initScheduler = () => {
  schedulerMonitor.register('OUTLET_CHANGE_QUEUE','Perubahan master outlet tertunda',Date.now()+30000,30000);
  setInterval(()=>{schedulerMonitor.run('OUTLET_CHANGE_QUEUE',runOutletChanges,now=>now+30000).catch(()=>console.error('[Scheduler]: Outlet change queue failed.'));},30000).unref();
  schedulerMonitor.register('ASSIGNMENT_SCHEDULE','Penugasan dan akhir delegasi',Date.now()+30000,30000);
  setInterval(()=>{schedulerMonitor.run('ASSIGNMENT_SCHEDULE',runAssignmentSchedules,now=>now+30000).catch(()=>console.error('[Scheduler]: Assignment schedule failed.'));},30000).unref();
  schedulerMonitor.register('PJP_PUBLICATION','Penerbitan PJP terjadwal',Date.now()+30000,30000);
  setInterval(()=>{schedulerMonitor.run('PJP_PUBLICATION',runScheduledPublications,now=>now+30000).catch(()=>console.error('[Scheduler]: Scheduled PJP publication failed.'));},30000).unref();
  schedulerMonitor.register('OUTLET_GOOGLE_LOCATION','Lokasi operasional Google',Date.now()+60000,60000);
  setInterval(()=>{schedulerMonitor.run('OUTLET_GOOGLE_LOCATION',maintainGoogleLocations,now=>now+60000).catch(()=>console.error('[Scheduler]: Google location maintenance failed.'));},60000).unref();
  schedulerMonitor.register('OUTLET_FIELD_PJP','Agenda validasi outlet',Date.now()+60000,60000);
  setInterval(()=>{schedulerMonitor.run('OUTLET_FIELD_PJP',rollOutletFieldPjps,now=>now+60000).catch(()=>console.error('[Scheduler]: Outlet field agenda failed.'));},60000).unref();
  schedulerMonitor.register('OUTLET_VALIDATION','Pemeriksaan Google terjadwal',Date.now()+15000,15000);
  setInterval(()=>{schedulerMonitor.run('OUTLET_VALIDATION',async()=>{await purgeOutletProviderContent(prisma);return runValidationJobs();},now=>now+15000).catch(()=>console.error('[Scheduler]: Outlet validation job failed.'));},15000).unref();
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
