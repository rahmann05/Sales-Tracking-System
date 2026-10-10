// Audit vocabulary, never an authorization substitute. Inputs and wrappers do not commit business work.
import {BUSINESS_ACTIONS} from './business-actions.mjs';
import {requestFeature} from './feature-policy.mjs';
export const OPERATION_INTENTS=['NAVIGATION_FILTER','READ_HISTORY','LOCAL_INPUT','START_WORK','CONTINUE_WORK','DECISION','MASTER_CHANGE','GOVERNANCE','DELEGATED_ACTION'];
export const OPERATION_DOMAINS={
 CORE:{features:[],access:'Authenticated identity; navigation checks role and allowed tabs',policy:'Live session/role; no business completion inferred'},
 SYSTEM:{features:[],access:'Admin can_manage_system_config; assignment also requires its domain permission',policy:'Live for new rules; process snapshots and explicit migration for existing work'},
 USERS:{features:[],access:'Admin can_manage_users / can_manage_roles; recovery and open-work protection',policy:'Fresh identity under approval:actors lock'},
 CATALOG:{features:['PRODUCTS','VEHICLES'],access:'Admin master grants; Sales product creation only where allowed; vehicle role bounds retained',policy:'Live new/edit master; import preview revision/token and idempotent commit; stable identity, no stock'},
 ORDERS:{features:['ORDERS','PRODUCTS'],access:'Owner Sales for creation; Admin/SPV current team, stage, can_approve_order and explicit operation grants',policy:'Live availability for new order; snapshot approval; retry before new-work rejection'},
 OUTLET_MASTER:{features:['OUTLET_MASTER'],access:'Admin master permissions; scoped read for other authorized roles',policy:'Live master field rules; lock/version/change queue; no silent overwrite'},
 REGISTRATION:{features:['REGISTRATION','MAPS'],access:'Registration grant; Sales owner / current team SPV / Admin stage and activation role',policy:'Live for submission; snapshot for revision/decision; duplicate and coordinate invariants'},
 OUTLET_REVIEW:{features:['OUTLET_REVIEW','MAPS'],access:'Admin/SPV review/run/apply/assign grants and outlet scope; Sales assigned field task',policy:'Optional case; evidence/proposal revision; new field task separately gated; existing results preserved'},
 SALES:{features:['SALES_VISITS','OFF_PJP','ORDERS','REROUTE','UNLOCK'],access:'Sales owner and start/exception grants; SPV/Admin current review scope',policy:'Live new start; visit snapshot on finish; no synthetic OUT; retry distinct from new work'},
 SUPERVISION:{features:['SHIFT','SPV_VISITS','FOLLOW_UP','REROUTE','UNLOCK'],access:'Admin/SPV start and current team; own active visit recovery; separate followup/review permissions',policy:'Snapshot audit/finish; followup creation separately gated; existing visit not hidden by new-start restrictions'},
 PLANNING:{features:['PJP','CLUSTERS','TEAMS'],access:'Admin/SPV planning/team grants and territory scope',policy:'Live publication/calendar/team checks; existing publication cancellation remains possible'},
 DELIVERY:{features:['DELIVERY','PACKING','RETURNS','VEHICLES'],access:'Admin/warehouse stage grants and assigned PIC; Driver only own route and results',policy:'Live new document; snapshot preparation/attendance; continue active route and reconcile history'},
 REPORTS:{features:['REPORTS','EXPORT'],access:'Role/team report read; Admin target/calendar/archive grants; export permission',policy:'Live new archive/export; stored archive and idempotent retry preserved'},
 MAPS:{features:['MAPS','TEAMS'],access:'Operational map/team scope and location access',policy:'Live layers/tracking; location freshness stated; never fabricate real-time GPS'},
 EVIDENCE:{features:[],access:'Delegated to owning form and server evidence validator',policy:'Camera/GPS is draft evidence until authorized owner commits; snapshot where process requires'},
 WRAPPER:{features:[],access:'Delegate to caller domain and its authorized API; wrapper does not grant access',policy:'Input/navigation wrappers carry no independent business policy'},
 PREVIEW:{features:[],access:'Local admin-preview fixtures; no production mutation',policy:'Demo-only control'},
};
export const UI_DELEGATION_CONTRACTS={
 'Card.jsx':{handlers:['{onClick}'],intents:OPERATION_INTENTS,rule:'Generic card only invokes caller callback. Caller sites are indexed; no independent permission or feature grant.'},
 'ShiftAttendanceWidget.jsx':{handlers:['{start}','{handler}'],intents:['START_WORK','CONTINUE_WORK'],actions:BUSINESS_ACTIONS.STAFF,rule:'SHIFT_IN checks current start permission/feature. SHIFT_OUT completes the current owner shift using frozen evidence rules.'},
};
export function endpointSemantics(url,method,body={}){
 const p=url.replace(/^\/api\/v1\//,''),feature=requestFeature(url,method,body),base={availability:feature?{feature:feature[0],newWork:feature[1]}:{feature:'CORE',newWork:false}};
 const domain=p.startsWith('config')?'SYSTEM':/^(?:users|roles)(?:\/|$)/.test(p)?'USERS':p.startsWith('reports')||p.startsWith('daily-calls')?'REPORTS':p.startsWith('routing')?'MAPS':p.startsWith('outlets/')&&/review|validat|field-task|google-location/.test(p)?'OUTLET_REVIEW':p.startsWith('outlets')?'OUTLET_MASTER':p.startsWith('customer-registrations')?'REGISTRATION':p.startsWith('route-changes')||p.startsWith('staff-attendance')||p.startsWith('attention')?'SUPERVISION':p.startsWith('absensi')?'SALES':p.startsWith('orders')?'ORDERS':p.startsWith('delivery')?'DELIVERY':/^(products|vehicles|divisions)/.test(p)?'CATALOG':/^(pjp|clusters|teams)/.test(p)?'PLANNING':'CORE';
 const result=(intent,domain,extra={})=>({...base,intent,domain,contract:OPERATION_DOMAINS[domain],...extra});
 if(method==='GET'||method==='HEAD')return result('READ_HISTORY',domain);
 if(p==='staff-attendance')return result('DELEGATED_ACTION','SUPERVISION',{variants:BUSINESS_ACTIONS.STAFF});
 if(/^delivery\/routes\/[^/]+\/actions$/.test(p))return result('DELEGATED_ACTION','DELIVERY',{variants:BUSINESS_ACTIONS.TRIP});
 if(/\/digital$/.test(p))return result('DECISION','OUTLET_REVIEW',{variants:BUSINESS_ACTIONS.OUTLET_DIGITAL});
 if(/field-tasks\//.test(p))return result('CONTINUE_WORK','OUTLET_REVIEW',{variants:BUSINESS_ACTIONS.OUTLET_FIELD});
 if(/validation-jobs\//.test(p))return result('CONTINUE_WORK','OUTLET_REVIEW',{variants:BUSINESS_ACTIONS.OUTLET_BATCH});
 if(p.startsWith('config/'))return result(/preview|simulate|\/options/.test(p)?'READ_HISTORY':'GOVERNANCE','SYSTEM');
 if(p==='config')return result('GOVERNANCE','SYSTEM');
 if(p.startsWith('auth/'))return result('GOVERNANCE','CORE');
 if(p==='users/location')return result('CONTINUE_WORK','MAPS');
 if(/^(?:users|roles)(?:\/|$)/.test(p))return result('GOVERNANCE','USERS');
 if(/(?:preview|impact|nearest-outlets)$/.test(p)||p==='outlets/duplicates'||p.startsWith('routing/'))return result('READ_HISTORY',domain);
 if(p.startsWith('attention/'))return result(p.endsWith('/clarify')?'CONTINUE_WORK':'DECISION','SUPERVISION');
 if(p.startsWith('reports/'))return result(p==='reports/archives'?'START_WORK':'GOVERNANCE','REPORTS');
 if(p.startsWith('notifications/'))return result('CONTINUE_WORK','CORE');
 if(/(?:approve|reject|validate|finalize|reroute|revisit|\/skip|batch-approve|\/review)$/.test(p)||/unlock-requests/.test(p))return result('DECISION',domain);
 if(/assignment|change-queue.*cancel|cancel-schedule|cancel-published|cancel-remainder|\/out$|\/return$|maintenance|condition|\/promise$/.test(p))return result('CONTINUE_WORK',domain);
 if(domain==='CATALOG'||domain==='OUTLET_MASTER'||domain==='PLANNING'&&!p.startsWith('pjp/'))return result('MASTER_CHANGE',domain);
 return result(feature?.[1]?'START_WORK':'CONTINUE_WORK',domain);
}
export function uiOperationDomain(file){
 if(file.includes('/admin-preview/'))return 'PREVIEW';
 if(/(?:Camera|Evidence|Gps|GPS|ReceiptInput)|\/camera\//.test(file))return 'EVIDENCE';
 if(/(?:UserManagement|UserModal|UserForm|UserDirectory|RoleManagement|RoleModal|RoleCardSelector|Permission|RoleTemplate)/.test(file))return 'USERS';
 if(/(?:Policy|Config|AssignmentSchedule|AutoDelegation|SystemAudit|NotificationDelivery)/.test(file))return 'SYSTEM';
 if(/(?:ProductCatalog|ProductForm|CodingMaster)/.test(file))return 'CATALOG';
 if(/(?:AdminApproval|Order|Product)/.test(file))return 'ORDERS';
 if(file.includes('/OutletManagement/'))return 'OUTLET_MASTER';
 if(/\/(?:OutletRegistration|OutletApproval|OutletRegistrationReport)\//.test(file))return 'REGISTRATION';
 if(/OutletValidation|OutletReview|OutletField|ProposalActions|GoogleLocation|AttentionLocation/.test(file))return 'OUTLET_REVIEW';
 if(/MasterImportPanel/.test(file))return 'CATALOG';
 if(/RouteReviewAssignment|AttentionException|Shift(?:Attendance|Correction|Evidence)/.test(file))return 'SUPERVISION';
 if(/\/Sales\//.test(file))return 'SALES';
 if(/\/Supervisor\/|FollowUp/.test(file))return 'SUPERVISION';
 if(/\/RoutePlanning\/|PjpCodeGeneration/.test(file))return 'PLANNING';
 if(/AdminPacking|AdminRoutes/.test(file))return 'DELIVERY';
 if(/UnlockRequestCard/.test(file))return 'SUPERVISION';
 if(/\/(?:Warehouse|Driver)\//.test(file))return 'DELIVERY';
 if(/\/(?:Reports|DailyCallMonitor)\/|ReportArchive/.test(file))return 'REPORTS';
 if(/\/(?:Dashboard|TeamTracking)\//.test(file))return 'MAPS';
 if(file.includes('/shared/components/common/'))return 'WRAPPER';
 if(/\/shared\/components\/map\//.test(file))return 'MAPS';
 if(/\/shared\/components\/layout\/|\/Login\/|\/AppContent\.|\/AppRouter\.|AdminLandingPage/.test(file))return 'CORE';
 return null;
}
export function classifyUiOperation({tag,event,handler='',file,submitHandler=''}){
 const text=(handler||submitHandler).replace(/\s+/g,' '),domain=uiOperationDomain(file);
 if(domain==='PREVIEW')return 'LOCAL_INPUT';
 if(/(?:RouteCard|SalesOutletItemCard|RouteReferenceCard|SidebarNavItem)\.jsx$/.test(file)&&/onClick/.test(text))return 'NAVIGATION_FILTER';
 if(/(?:onChange|onBulkChange|onResetToTemplate|onLocation|onEvidence|onSignature|onNotes|onChecklist|onFollowUp|onCapture|onRetake)/.test(event))return 'LOCAL_INPUT';
 if(file.includes('/Login/')&&/Submit/.test(text))return 'GOVERNANCE';
 if(/finalize|Finalize/.test(text))return 'DECISION';
 if(/(?:handleSaveNik|handleUpdateCluster|handleImportSpreadsheet)/.test(text))return 'MASTER_CHANGE';
 if(/ReportArchivePanel/.test(file)&&/\{save\}/.test(text))return 'START_WORK';
 if(/(?:ReportCalendarEditor|SalesTargetEditor)/.test(file)&&/submit/.test(text))return 'GOVERNANCE';
 if(/(?:OutletValidationJobs|FieldTaskReview)/.test(file)&&/act\(|action\(/.test(text))return 'CONTINUE_WORK';
 if(/(?:OrderFulfillmentPanel)/.test(file)&&/save\(/.test(text))return 'CONTINUE_WORK';
 if(/(?:onRevise|confirmOffPjp)/.test(text))return 'START_WORK';
 if(/\.saveAudit/.test(text))return 'CONTINUE_WORK';
 if(/(?:onMapClick|handleFallbackClick|onOutlets|onGoBack|updateFilter|\.next\b|\{back\}|closeModal|this.handleReset)/.test(text))return 'NAVIGATION_FILTER';
 if(/\bonChange\(/.test(text))return 'LOCAL_INPUT';
 if(/(?:\{\(\) => \{\}\}|handleUnlockGooglePlace|stop\.current=true|applySuggestions|importTemplates|copyNext|\{capture\}|\{gps\}|field\('photo')/.test(text))return 'LOCAL_INPUT';
 if(/(?:\.suggest\b|onRetry|view\(item|clearNotifications)/.test(text))return 'READ_HISTORY';
 if(tag==='a')return 'NAVIGATION_FILTER';
 if(!text)return ['input','select','textarea'].includes(tag)?'LOCAL_INPUT':tag==='form'?'DELEGATED_ACTION':'READ_HISTORY';
 if(/(?:onExport|exportTo|exportCustomer|handleExport|handlePrint|download\(|\{download\}|exportValues|exportSuspicious|onOpenPdf|openDocs|setPrint)/i.test(text))return 'READ_HISTORY';
 if(/(?:AbsenIn|VISIT_IN|SHIFT_IN|ConfirmOffPjp|onInputOrder|handleSalesAbsenOffPJP|onClosedReport|RequestUnlock|ReportClosed|createIssue|p\.publish|p\.schedule\(|b\.generate)/.test(text))return 'START_WORK';
 if(/(?:AbsenOut|VISIT_OUT|SHIFT_OUT|onSaveAudit|onMarkDelivered|onMarkRejected|cancelPublished|cancelSchedule|retry\(|RELEASE|RECALL|retryAuto|resolveIssue|onRecord)/.test(text))return 'CONTINUE_WORK';
 if(/(?:decide\(|digital\(|onApprove|handleApprove|onReject|handleReject|submitRejection|ConfirmReject|handleDecision|ACCEPT|REJECT|onActivate|onRecheck)/.test(text))return 'DECISION';
 if(/(?:handleStatusUpdate|onStatusUpdate|send\(|cancel\(row|cancel\(.*id)/.test(text))return 'CONTINUE_WORK';
 if(/(?:handleCreateRole|handleUpdateTemplate|editor\.clearDraft|\{copy\})/.test(text))return 'GOVERNANCE';
 if(/(?:onChanged|\{saved\}|dispatchEvent\(new CustomEvent\('operational-data-changed'|onRefreshAddress)/.test(text))return 'READ_HISTORY';
 if(/(?:handleLogin|handleLogout|onLogin|onLogout)/.test(text))return 'GOVERNANCE';
 if(/(?:onGoBack|handleBackToHub|goToWorkspace|onHandleIncident|handleEditUser|handleEditPermissions|onEdit|handleOpen|resumeEditing)/.test(text))return 'NAVIGATION_FILTER';
 if(/(?:onCapture|handleCapture|handleRetake|onRetake|onSignature|onEvidence|saveGps|draft\.edit|draft\.field|draft\.setValue|\.setOutletName|\.setCustomerName|\.setPhone|handleAddressChange|onQtyChange|updateProductQty|moveStop|addPackingList|removePackingList|updateField|bulk\(|\{add\}|update\(items|update\(\[|onInherit|onReset|handleApplyTemplate|handleCloneChange|editor\.inherit|editor\.discard|current\.click\(|onNativeFileInput|handleNativeFileInput)/.test(text))return 'LOCAL_INPUT';
 if(event==='onError'||event.startsWith('onPointer')||domain==='EVIDENCE')return 'LOCAL_INPUT';
 if(/(?:Api\.|request\(|onSubmit|handleSubmit|submitForm|\{submit\}|\{save\}|onSave|handleConfirm|\{apply\}|\{assign\}|handleDelete|onDelete|\.save\b|\.publish\b|\.restore\b|\.cancelSchedule\b|onConfirm|onRecord)/.test(text)||event==='onSubmit'){
  if(/preventDefault\(\);setQuery/.test(text))return 'NAVIGATION_FILTER';
  if(domain==='SYSTEM'||domain==='USERS')return 'GOVERNANCE';
  if(domain==='OUTLET_MASTER'||domain==='CATALOG')return 'MASTER_CHANGE';
  if(domain==='REGISTRATION')return /Finalize|Approval|Report|Revis/.test(file)?'CONTINUE_WORK':'START_WORK';
  if(domain==='PLANNING')return /Cluster/.test(file)?'MASTER_CHANGE':'START_WORK';
  if(domain==='ORDERS')return /Approval|Review/.test(file)?'DECISION':/Product/.test(file)?'MASTER_CHANGE':'START_WORK';
  if(domain==='DELIVERY')return /Create|Form|Catalog|Master|Import/.test(file)?'START_WORK':'CONTINUE_WORK';
  if(domain==='SALES'||domain==='SUPERVISION'||domain==='OUTLET_REVIEW')return 'CONTINUE_WORK';
  return 'DELEGATED_ACTION';
 }
 if(event==='onChange'||event==='onInput'||event==='onBlur'||['input','select','textarea'].includes(tag))return 'LOCAL_INPUT';
 if(/(?:set[A-Z]|select|Select|navigate|Navigate|\bgo\(|onOpen|open|Open|onClose|onCancel|\{close\}|\{reset\}|\{cancel\}|\{leave\}|\{stay\}|toggle|Toggle|change\(|move\(|addItem|addInvoice|removeItem|removeInvoice|onRetake|onCapture|changeAction|scrollIntoView|\.focus\(|\.fit\(|\{edit\}|\bedit\(|\bchoose\(|change\('candidateIds')/.test(text))return 'NAVIGATION_FILTER';
 if(/(?:reload|Reload|refresh|Refresh|load|Load|fetch|Fetch|review|Review|preview|Preview|simulate|\{more\}|locate|Locate|detectGPS|DetectGPS|read\(|markNotification|markAllRead|MarkAllRead)/.test(text))return 'READ_HISTORY';
 return 'DELEGATED_ACTION';
}
