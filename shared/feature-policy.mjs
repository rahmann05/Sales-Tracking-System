import {actionFeature} from './business-actions.mjs';
// Explicit business intent; GETs retain historical access, even when new work is paused.
export function requestFeature(path,method='GET',body={}){
 const p=String(path||'').replace(/^\/api\/v1\//,'').split('?')[0];
 if(p.startsWith('absensi/off-pjp'))return ['OFF_PJP',method==='POST'];
 if(p.startsWith('absensi'))return ['SALES_VISITS',/\/(in|start)$/.test(p)];
 if(p.startsWith('staff-attendance/follow-ups'))return ['FOLLOW_UP',false];
 if(p==='staff-attendance'&&method==='POST')return actionFeature('STAFF',body.action)||['SPV_VISITS',false];
 if(/^delivery\/routes\/[^/]+\/actions$/.test(p)&&method==='POST')return actionFeature('TRIP',body.action)||['DELIVERY',false];
 if(p.startsWith('staff-attendance'))return ['SHIFT',false];
 if(p.startsWith('route-changes'))return ['REROUTE',method==='POST'&&p==='route-changes'];
 if(p.startsWith('outlets')&&/unlock|\/lock/.test(p))return ['UNLOCK',/unlock-request|\/lock$/.test(p)&&method==='POST'];
 if(p.startsWith('outlets')&&/review|validat/.test(p))return ['OUTLET_REVIEW',method==='POST'];
 if(p.startsWith('outlets'))return ['OUTLET_MASTER',!['GET','HEAD'].includes(method)&&!p.includes('/coordinates')];
 if(/^customer-registrations\/(search-places|reverse-geocode)$/.test(p))return ['MAPS',true];
 if(p.startsWith('customer-registrations'))return ['REGISTRATION',method==='POST'&&p==='customer-registrations'];
 if(p.startsWith('delivery/packing-lists'))return ['PACKING',method==='POST'&&p==='delivery/packing-lists'];
 if(p.startsWith('delivery/stops')&&p.endsWith('/return'))return ['RETURNS',false];
 if(p.startsWith('delivery'))return ['DELIVERY',method==='POST'&&p==='delivery/routes'];
 const module=p.split('/')[0];
 const feature={pjp:'PJP',clusters:'CLUSTERS',teams:'TEAMS',orders:'ORDERS',products:'PRODUCTS',vehicles:'VEHICLES',reports:'REPORTS',notifications:'NOTIFICATIONS',routing:'MAPS','daily-calls':'REPORTS'}[module];
 const newWork=['CLUSTERS','TEAMS','PRODUCTS','PJP','VEHICLES'].includes(feature)?!['GET','HEAD'].includes(method)&&!/(preview|impact|nearest-outlets|condition|maintenance)$/.test(p):feature==='MAPS'?method==='POST':method==='POST'&&p===module;
 return feature?[feature,newWork]:null;
}
export function featureDecision(values,path,method,body){
 const target=requestFeature(path,method,body);if(!target)return {allowed:true};
 const [feature,newWork]=target,mode=values?.[`FEATURE_${feature}_MODE`]||'ACTIVE';
 return {allowed:mode==='ACTIVE'||!newWork,feature,mode,newWork};
}
export const TAB_FEATURES={
 'sales-visits':'SALES_VISITS','sales-orders':'ORDERS','sales-follow-up':'FOLLOW_UP','spv-field':'SPV_VISITS',
 'admin-products':'PRODUCTS','admin-pjp':'PJP','route-planning':'PJP','create-cluster':'CLUSTERS','master-clusters':'CLUSTERS',
 'team-tracking':'TEAMS','outlet-management':'OUTLET_MASTER','outlet-registration':'REGISTRATION','outlet-approval':'REGISTRATION','outlet-registration-report':'REGISTRATION',
 'outlet-validation':'OUTLET_REVIEW','reports':'REPORTS','daily-call-monitor':'REPORTS',
 'delivery-packing-list':'PACKING','delivery-routes':'DELIVERY','delivery-monitor':'DELIVERY','delivery-driver-map':'DELIVERY','driver-trips':'DELIVERY','warehouse-vehicles':'VEHICLES',
 'dashboard':'MAPS',
};
