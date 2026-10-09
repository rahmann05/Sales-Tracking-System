import {INITIAL_FORM} from './registrationInitialForm';
export function registrationRevisionFields(item,requestId) {
 return {...INITIAL_FORM,...Object.fromEntries(Object.keys(INITIAL_FORM).filter(k=>item[k]!==undefined).map(k=>[k,item[k]])),registrationCode:item.registrationCode,divisionName:item.divisionName,divisionId:item.divisionId,locationEvidence:item.locationEvidence || undefined,visitDays:String(item.visitDays || '').split(',').filter(Boolean),revisionId:item.id,revisionUpdatedAt:item.updatedAt,revisionReason:'',submissionRequestId:requestId};
}
