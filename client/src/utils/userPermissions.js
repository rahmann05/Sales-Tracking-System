import {BUILT_IN_ROLE_TEMPLATES} from '../constants/permissions';
export function effectiveUserPermissions(user,roles=[]){
 const code=user?.roleCode||user?.role,definition=roles.find(role=>role.code===code);
 const template=definition?.defaultPermissions||(user?.roleCode?{}:BUILT_IN_ROLE_TEMPLATES[user?.role])||{};
 return {...template,...user?.permissions};
}
