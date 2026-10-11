import {canDomainAction} from './domain-permissions.mjs';
import {followUpAllowed} from './follow-up-policy.mjs';

export const issueIndependent=issue=>(issue.history||[]).some(event=>['LOCATION_DISCREPANCY','TRIP_ENDPOINT_DISCREPANCY'].includes(event.action));
export function issueResponsibleRole(reference,kind){
 if(kind==='GOODS')return 'KEPALA_GUDANG';
 return reference.orderId?'ADMIN':reference.salesVisitId?'SUPERVISOR':'KEPALA_GUDANG';
}
// A deliberate transfer can cross Admin/warehouse queues, without granting
// warehouse staff the right to decide independent location cases.
export function issueForOwner(issue,person){
 if(['ADMIN','KEPALA_GUDANG'].includes(person?.role)&&!issueIndependent(issue))return {...issue,ownerId:person.id,responsibleRole:person.role};
 return {...issue,ownerId:person?.id};
}
export function canHandleIssue(person,issue){
 if(!person||person.deletedAt)return false;
 if(issueIndependent(issue)&&person.role!=='ADMIN')return false;
 if(person.role==='SUPERVISOR')return issue.responsibleRole==='SUPERVISOR'&&issue.supervisorId===person.id&&followUpAllowed(person,'review');
 if(!canDomainAction(person,'RESOLVE_DELIVERY_ISSUE'))return false;
 if(person.role==='SUPIR')return issue.ownerId===person.id&&person.permissions?.can_access_driver_map!==false;
 return person.permissions?.can_monitor_delivery!==false&&(person.role==='ADMIN'||person.role==='KEPALA_GUDANG'&&(!issue.responsibleRole||issue.responsibleRole==='KEPALA_GUDANG'));
}
export function issueRecipients(issue,people){
 if(issue.ownerId)return people.filter(person=>person.id===issue.ownerId&&canHandleIssue(person,issue));
 const primary=people.filter(person=>person.role===(issue.responsibleRole||'KEPALA_GUDANG')&&canHandleIssue(person,issue));
 return primary.length?primary:people.filter(person=>person.role==='ADMIN'&&canHandleIssue(person,issue));
}
