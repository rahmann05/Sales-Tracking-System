import {canDomainAction} from './domain-permissions.mjs';
import {featureAvailable,visitPolicy} from './operational-policy.mjs';
import {processPolicyValues} from './process-policy.mjs';
export const activeVisitStatuses=['ARRIVED','IN_VISIT','ORDERED'];
export const completedVisitStatuses=['VISITED','COMPLETED'];
export function salesVisitActions({stop,isLocked=false,settings={},user}){
 const frozen=processPolicyValues(stop?.policySnapshot,settings),policy=visitPolicy(frozen);
 const active=activeVisitStatuses.includes(stop?.status),complete=completedVisitStatuses.includes(stop?.status),sales=user?.role==='SALES'&&!user.deletedAt;
 return {frozen,policy,active,complete,lockedEntry:isLocked&&!active&&!complete,
  canStart:stop?.status==='PENDING'&&!isLocked&&canDomainAction(user,'SALES_VISIT')&&featureAvailable(settings,'SALES_VISITS'),
  canComplete:Boolean(sales&&active),
  canRequestException:canDomainAction(user,'REQUEST_EXCEPTION')&&featureAvailable(settings,'UNLOCK'),
  canReportClosed:Boolean(sales&&user.permissions?.can_request_reroute!==false&&featureAvailable(settings,'REROUTE')&&stop?.status!=='ORDERED'),
  canOrder:Boolean(sales&&user.permissions?.can_create_order!==false&&featureAvailable(settings,'ORDERS')&&stop?.status!=='ORDERED'&&(active||(stop?.status==='PENDING'&&(policy.mode==='OPTIONAL'||frozen.ORDER_REQUIRE_CHECKIN===false))||(complete&&frozen.ORDER_ALLOW_AFTER_VISIT===true))),
 };
}
