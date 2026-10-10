export function routeChangeWorkflow(request,values={}){
 const saved=request.workflow;
 const mode=saved?.mode||((values.REROUTE_REQUIRE_ADMIN_APPROVAL||saved?.legacyRequireAdmin)?'LEGACY_SEQUENTIAL':'SUPERVISOR_OR_ADMIN');
 const proposal=saved?.proposal||(request.type==='REROUTE'&&request.handledBy&&request.replacementOutletId?{action:'REROUTE',actorId:request.handledBy,target:request.replacementOutletId}:null);
 const stage=proposal?'ADMIN':mode==='ADMIN'?'ADMIN':'SUPERVISOR';
 return {mode,proposal,stage,canDecide:actor=>actor?.id!==request.reportedBy&&(proposal?actor?.role==='ADMIN'&&actor.id!==proposal.actorId:mode==='ADMIN'?actor?.role==='ADMIN':mode==='SEQUENTIAL'?actor?.role==='SUPERVISOR':['SUPERVISOR','ADMIN'].includes(actor?.role))};
}
export const ROUTE_DECISION_MODES={INHERIT:'Ikuti aturan reroute sebelumnya',SUPERVISOR_OR_ADMIN:'Satu tahap: Supervisor atau Admin',ADMIN:'Satu tahap: Admin',SEQUENTIAL:'Dua tahap: usulan Supervisor → keputusan Admin'};
export function routeChangeReviewGaps(request,people){
 const applicant=people.find(p=>p.id===request.reportedBy),flow=routeChangeWorkflow(request);
 const eligible=people.filter(p=>!p.deletedAt&&flow.canDecide(p)&&(p.role==='ADMIN'||p.id===applicant?.supervisorId));
 const gaps=eligible.length?[]:[flow.stage];
 if(flow.mode==='SEQUENTIAL'&&!flow.proposal&&!people.some(p=>!p.deletedAt&&p.role==='ADMIN'&&p.id!==request.reportedBy))gaps.push('ADMIN');
 return [...new Set(gaps)];
}
