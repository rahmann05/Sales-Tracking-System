export const OUTLET_COMPARISON_DEFAULTS={nameMatchPercent:70,addressMatchPercent:60,addressConflictPercent:20,alternativeNamePercent:65,ambiguityGapPercent:15,suggestionNamePercent:75,searchRadiusMeters:500,timeoutSeconds:10,evidenceDays:0};
export const OUTLET_COMPARISON_KEYS={nameMatchPercent:'OUTLET_REVIEW_NAME_MATCH_PERCENT',addressMatchPercent:'OUTLET_REVIEW_ADDRESS_MATCH_PERCENT',addressConflictPercent:'OUTLET_REVIEW_ADDRESS_CONFLICT_PERCENT',alternativeNamePercent:'OUTLET_REVIEW_ALTERNATIVE_NAME_PERCENT',ambiguityGapPercent:'OUTLET_REVIEW_AMBIGUITY_GAP_PERCENT',suggestionNamePercent:'OUTLET_REVIEW_SUGGESTION_NAME_PERCENT',searchRadiusMeters:'OUTLET_REVIEW_SEARCH_RADIUS_METERS',timeoutSeconds:'OUTLET_REVIEW_TIMEOUT_SECONDS',evidenceDays:'OUTLET_REVIEW_EVIDENCE_DAYS'};
export function outletEvidenceState(run,outlet,now=Date.now()){
 const changed=!!run&&['name','address','latitude','longitude','clusterId'].some(key=>run.snapshot?.[key]!==outlet?.[key]);
 const expiresAt=run?.result?.expiresAt,expiry=expiresAt?Date.parse(expiresAt):NaN;
 const expired=Number.isFinite(expiry)&&now>=expiry;
 return {changed,expired,stale:changed||expired};
}
export function outletReviewEvidenceState(runs=[],outlet,now=Date.now()){
 // A failed retry does not renew or replace the age of the last actual comparison.
 const reference=runs.find(run=>run.result?.code!=='ERROR'),unavailable=runs.length>0&&!reference;
 const state=outletEvidenceState(reference||runs[0],outlet,now);
 return {...state,unavailable,stale:state.stale||unavailable,expiresAt:reference?.result?.expiresAt||null};
}
