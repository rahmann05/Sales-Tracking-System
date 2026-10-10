import {auditFailed} from './supervision-checklist.mjs';
import {wibDateKey} from './visit-metrics.mjs';
export function automaticFollowUp(record,items,answers,values,now=Date.now()){
 if(!values.FOLLOW_UP_AUTO_ENABLED||record.followUp)return null;
 const mode=values.FOLLOW_UP_AUTO_TRIGGER||'SELECTED_FAILURE';
 const failed=items.filter(q=>auditFailed(q,answers[q.key])&&(mode!=='SELECTED_FAILURE'||q.autoFollowUp));
 const elapsed=(now-Date.parse(record.checkInAt))/60000,sla=elapsed>=Number(values.FOLLOW_UP_AUTO_SLA_MINUTES??120);
 const useFailure=['ANY_FAILURE','SELECTED_FAILURE','FAILURE_OR_SLA'].includes(mode)&&failed.length>0,useSla=['SLA','FAILURE_OR_SLA'].includes(mode)&&sla;
 if(!useFailure&&!useSla)return null;
 const sources=[...(useFailure?failed.map(q=>({key:q.key,label:q.label,value:answers[q.key]})):[]),...(useSla?[{key:'VISIT_SLA',label:'Durasi supervisi melampaui ambang',value:Math.floor(elapsed)}]:[])];
 return {dueDate:wibDateKey(now+Number(values.FOLLOW_UP_AUTO_DUE_DAYS??1)*86400000),note:`Tindak lanjuti temuan supervisi: ${sources.map(s=>s.label).join('; ')}.`.slice(0,4000),source:{type:'AUTOMATIC_SUPERVISION',activityId:record.id,trigger:mode,items:sources,at:new Date(now).toISOString()}};
}
