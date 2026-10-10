export function routeChangeWorkflow(request,values={}){
 const saved=request.workflow;
 const mode=saved?.mode||((values.REROUTE_REQUIRE_ADMIN_APPROVAL||saved?.legacyRequireAdmin)?'LEGACY_SEQUENTIAL':'SUPERVISOR_OR_ADMIN');
 const proposal=saved?.proposal||(request.type==='REROUTE'&&request.handledBy&&request.replacementOutletId?{action:'REROUTE',actorId:request.handledBy,target:request.replacementOutletId}:null);
 const stage=proposal?'ADMIN':mode==='ADMIN'?'ADMIN':'SUPERVISOR';
 const assignment=saved?.assignment?.stage===stage&&(!saved.assignment.validUntil||Date.parse(saved.assignment.validUntil)>Date.now())?saved.assignment:null;
 const roleEligible=actor=>Boolean(actor&&!actor.deletedAt&&actor.permissions?.can_review_route_change!==false&&actor.id!==request.reportedBy&&(proposal?actor.role==='ADMIN'&&actor.id!==proposal.actorId:mode==='ADMIN'?actor.role==='ADMIN':mode==='SEQUENTIAL'?actor.role==='SUPERVISOR':['SUPERVISOR','ADMIN'].includes(actor.role)));
 return {mode,proposal,stage,assignment,roleEligible,canDecide:actor=>roleEligible(actor)&&(!assignment?.ownerId||assignment.ownerId===actor.id)};
}
export function routeReviewerEligible(request,actor,people=[]){
 const flow=routeChangeWorkflow(request),applicant=people.find(p=>p.id===request.reportedBy);
 return flow.canDecide(actor)&&(actor.role==='ADMIN'||flow.assignment?.ownerId===actor.id||actor.id===applicant?.supervisorId);
}
export const ROUTE_DECISION_MODES={INHERIT:'Ikuti aturan reroute sebelumnya',SUPERVISOR_OR_ADMIN:'Satu tahap: Supervisor atau Admin',ADMIN:'Satu tahap: Admin',SEQUENTIAL:'Dua tahap: usulan Supervisor → keputusan Admin'};
export function routeChangeReviewGaps(request,people){
 const applicant=people.find(p=>p.id===request.reportedBy),flow=routeChangeWorkflow(request);
 const eligible=people.filter(p=>routeReviewerEligible(request,p,[applicant].filter(Boolean)));
 const gaps=eligible.length?[]:[flow.stage];
 if(flow.mode==='SEQUENTIAL'&&!flow.proposal&&!people.some(p=>!p.deletedAt&&p.role==='ADMIN'&&p.permissions?.can_review_route_change!==false&&p.id!==request.reportedBy))gaps.push('ADMIN');
 return [...new Set(gaps)];
}
