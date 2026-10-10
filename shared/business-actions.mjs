// Declares business intent, not authorization. Services still enforce scope, permissions and state.
const existing=(feature,names)=>Object.fromEntries(names.map(name=>[name,{feature,intent:'EXISTING_WORK'}]));
export const BUSINESS_ACTIONS={
 STAFF:{
  SHIFT_IN:{feature:'SHIFT',intent:'NEW_WORK'},SHIFT_OUT:{feature:'SHIFT',intent:'EXISTING_WORK'},
  VISIT_IN:{feature:'SPV_VISITS',intent:'NEW_WORK'},VISIT_OUT:{feature:'SPV_VISITS',intent:'EXISTING_WORK'},
  AUDIT:{feature:'SPV_VISITS',intent:'EXISTING_WORK',nestedCreation:'followUp is separately gated by FEATURE_FOLLOW_UP_MODE and assign permission'},
  OFF_PJP:{feature:'SPV_VISITS',intent:'NEW_WORK'},
 },
 TRIP:existing('DELIVERY',['ASSIGN_PREPARATION','PICK','CHECK','LOAD','START','RETURN','CLOSE','HOLD','RESUME','RESCHEDULE','CANCEL','LEGACY_ODOMETER']),
 PACKING:existing('PACKING',['RELEASE','RECALL']),
 OUTLET_REVIEW:existing('OUTLET_REVIEW',['KEEP','WAITING_FIELD','CORRECTED']),
 SHIFT_CORRECTION:existing('SHIFT',['PROPOSE','ACCEPT','REJECT','CANCEL']),
 OUTLET_DIGITAL:existing('OUTLET_REVIEW',['DIGITAL_KEEP','ADMIN_DIGITAL_KEEP','INTERNAL_KEEP','FIELD_KEEP','PROPOSE','APPLY','RETURN','CANCEL']),
 OUTLET_FIELD:existing('OUTLET_REVIEW',['SUBMIT','ACCEPT','RETURN','CANCEL']),
 OUTLET_BATCH:existing('OUTLET_REVIEW',['STOP','RESUME','RETRY']),
};
export const actionNames=group=>Object.keys(BUSINESS_ACTIONS[group]||{});
export const actionFeature=(group,action)=>{
 const rule=BUSINESS_ACTIONS[group]?.[action];return rule?[rule.feature,rule.intent==='NEW_WORK']:null;
};
export const BACKGROUND_CONTRACTS={
 OUTLET_GOOGLE_LOCATION:{purpose:'Lokasi Google disetujui dan retensi cache',consumer:'server/src/modules/outlets/services/outlet-google-location.service.js',rule:'OUTLET_GOOGLE_LOCATION_*; no expiry extension on failure; retention continues when disabled'},
 OUTLET_FIELD_PJP:{purpose:'Agenda tugas validasi berulang',consumer:'server/src/modules/outlets/services/outlet-field-pjp.service.js',rule:'Frozen OUTLET_FIELD_PJP_MODE; existing assignment continues without changing recurring templates or fabricating attendance; manual PJP codes remain required'},
 OUTLET_VALIDATION:{purpose:'Antrean Google dan retensi cache koordinat',consumer:'server/src/modules/outlets/services/outlet-validation-job.service.js',rule:'Effective OUTLET_REVIEW / MAPS availability, actor permission, provider budgets; expired provider cache is purged even when disabled'},
 HISTORY_RETENTION:{purpose:'Retensi histori',consumer:'server/src/modules/notifications/services/history-retention.service.js',rule:'NOTIFY_READ_RETENTION_DAYS / AUDIT_ACTIVE_RETENTION_DAYS; cleanup remains available when a feature is paused'},
 VEHICLE_SERVICE:{purpose:'Pengingat servis',consumer:'server/src/modules/vehicles/services/service-reminders.service.js',rule:'VEHICLE_SERVICE_SCHEDULED_REMINDERS / VEHICLE_SERVICE_REMINDERS_ENABLED and recipient policy'},
 GPS_RETENTION:{purpose:'Retensi lokasi',consumer:'server/src/modules/users/services/location-retention.service.js',rule:'TRACKING_LOCATION_RETENTION_HOURS; retention must continue when tracking is off'},
 NOTIFICATIONS:{purpose:'Outbox notifikasi',consumer:'server/src/modules/notifications/services/notification-delivery.service.js',rule:'Recipient NOTIFY_REALTIME_ENABLED and notification type policy'},
 SLA:{purpose:'Eskalasi pekerjaan',consumer:'server/src/modules/attention/attention-escalation.service.js',rule:'SLA_ESCALATION_DELAY_HOURS > 0 and work clock; does not fabricate completion'},
 PJP:{purpose:'Penerbitan rute harian',consumer:'server/src/modules/pjp/services/pjp.helpers.js',rule:'FEATURE_PJP_MODE, working calendar, manual/automatic codes and assigned routes'},
 MISSING_OUT:{purpose:'Pemeriksaan bukti keluar dan batas shift',consumer:'server/src/modules/attention/operational-exceptions.service.js',rule:'Frozen visit requireOut / SALES_MISSING_OUT_MINUTES and SHIFT_MAX_DURATION_HOURS / SHIFT_OVERNIGHT_POLICY; no synthetic checkout'},
};
export const SOCKET_CONTRACTS={
 'cache:invalidate':{scope:'AUTHENTICATED',purpose:'Refresh hint only; API retains authorization',consumer:'server/src/config/socket.js'},
 'notification':{scope:'PRIVATE_USER_ROOM',purpose:'Committed inbox/outbox with recipient policy',consumer:'server/src/modules/notifications/services/notification-delivery.service.js'},
 'policy:invalidate':{scope:'SERVER_ONLY',purpose:'Invalidate effective policy caches on other replicas',consumer:'server/src/config/socket.js'},
};
