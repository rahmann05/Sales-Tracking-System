export const WORKSPACE_DEFAULTS={
 ATTENTION_DEFAULT_FILTER:['ALL','MINE','REVIEW','OVERDUE','UNASSIGNED','UNSCHEDULED'],
 ATTENTION_DEFAULT_CATEGORY:['ALL','ORDER','PACKING','TRIP','PREPARATION','ISSUE','VISIT','EXCEPTION','OUTLET_REVIEW','OUTLET_LOCATION','RETURN'],
 MASTER_OUTLET_DEFAULT_STATUS:['ACTIVE','INACTIVE','ALL'],
 OUTLET_REVIEW_DEFAULT_STAGE:['ALL','OPEN','REVIEW','WAITING_FIELD','SUBMITTED','COMPLETED','CANCELLED'],
 ORDER_REVIEW_DEFAULT_STATUS:['PENDING','ALL','APPROVED','REJECTED'],
};
export function attentionCategory(value,role){return WORKSPACE_DEFAULTS.ATTENTION_DEFAULT_CATEGORY.includes(value)&&(role!=='SUPERVISOR'||['ALL','ORDER','VISIT','EXCEPTION','OUTLET_REVIEW','OUTLET_LOCATION'].includes(value))?value:'ALL';}
export function workspaceChoice(key,value,fallback){return WORKSPACE_DEFAULTS[key]?.includes(value)?value:fallback??WORKSPACE_DEFAULTS[key]?.[0];}
export const ATTENTION_WIDGETS={total:'Total pekerjaan',overdue:'Lewat tenggat',awaitingReview:'Menunggu pemeriksaan',missingOwner:'Belum ada PIC',missingDeadline:'Belum ada tenggat'};
