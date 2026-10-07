import {decideRoute} from './route-decision.service.js';
export const rejectReroute = (actorId,requestId) => decideRoute(actorId,requestId,'REJECT');
