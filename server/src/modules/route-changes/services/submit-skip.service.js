import {decideRoute} from './route-decision.service.js';
export const submitSkip = (actorId,requestId) => decideRoute(actorId,requestId,'SKIP');
