import {getDynamicConfig} from '../../config/config.service.js';
import {reviewPeople} from '../../config/services/approval-readiness.service.js';
import {issueRecipients} from '../../../../../shared/operational-issues.mjs';
import {policyNotifications} from '../../notifications/services/notification-policy.service.js';
export const issueDeadline=hours=>Number(hours)>0?new Date(Date.now()+Number(hours)*3600000):null;
export async function automaticIssue(db,data){
 const hours=await getDynamicConfig('DELIVERY_ISSUE_DEFAULT_HOURS',24);
 const issue=await db.deliveryIssue.create({data:{...data,ownerId:null,responsibleRole:data.responsibleRole||'KEPALA_GUDANG',dueAt:data.dueAt===undefined?issueDeadline(hours):data.dueAt}});
 const recipients=issueRecipients(issue,await reviewPeople(db));
 await policyNotifications(db,{data:recipients.filter(person=>person.id!==data.createdById).map(person=>({userId:person.id,type:'DELIVERY_FOLLOW_UP',title:issue.title,message:issue.reason,payload:{issueId:issue.id,routeId:issue.routeId,stopId:issue.stopId}}))});
 return issue;
}
