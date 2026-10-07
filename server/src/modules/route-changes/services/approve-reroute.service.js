import {decideRoute} from './route-decision.service.js';
export const approveReroute = (actorId,requestId) => decideRoute(actorId,requestId,'APPROVE');
