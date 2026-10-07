import {decideRoute} from './route-decision.service.js';
export const submitReroute = (actorId,requestId,replacementOutletId) => decideRoute(actorId,requestId,'REROUTE',replacementOutletId);
