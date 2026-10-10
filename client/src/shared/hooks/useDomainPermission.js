import {useApp} from '../../context/AppContext';
import {canDomainAction} from '../../../../shared/domain-permissions.mjs';
export function useDomainPermission(action){const {user}=useApp();return canDomainAction(user,action);}
