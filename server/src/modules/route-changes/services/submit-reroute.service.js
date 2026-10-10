import {decideRoute} from './route-decision.service.js';
export const submitReroute = (actorId,requestId,replacementOutletId,reason=null) => decideRoute(actorId,requestId,'REROUTE',replacementOutletId,reason);
