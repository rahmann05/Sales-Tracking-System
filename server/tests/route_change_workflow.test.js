import test from 'node:test';
import assert from 'node:assert/strict';
import {routeChangeWorkflow,routeChangeReviewGaps} from '../../shared/route-change-workflow.mjs';
test('Frozen route-change stage controls distinct actors for both skip and reroute',()=>{
 const sales={id:'sales',role:'SALES',supervisorId:'spv'},spv={id:'spv',role:'SUPERVISOR'},admin={id:'admin',role:'ADMIN'};
 const request={reportedBy:'sales',workflow:{mode:'SEQUENTIAL',proposal:null}};
 assert.equal(routeChangeWorkflow(request).canDecide(spv),true);assert.equal(routeChangeWorkflow(request).canDecide(admin),false);
 assert.deepEqual(routeChangeReviewGaps(request,[sales,spv]),['ADMIN']);assert.deepEqual(routeChangeReviewGaps(request,[sales,spv,admin]),[]);
 const proposal={...request,workflow:{mode:'SEQUENTIAL',proposal:{action:'SKIP',actorId:'spv'}}};
 assert.equal(routeChangeWorkflow(proposal).stage,'ADMIN');assert.equal(routeChangeWorkflow(proposal).canDecide(admin),true);
 assert.equal(routeChangeWorkflow(proposal).canDecide({...spv,role:'ADMIN'}),false);
 assert.deepEqual(routeChangeReviewGaps(proposal,[sales,spv]),['ADMIN']);
 const legacy={reportedBy:'sales',type:'REROUTE',handledBy:'spv',replacementOutletId:'target'};
 assert.equal(routeChangeWorkflow(legacy).stage,'ADMIN');
});
