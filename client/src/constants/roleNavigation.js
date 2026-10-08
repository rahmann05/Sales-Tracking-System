import {getAdminNavigationGroups,adminParentTab} from './adminNavigation';
import {getSupervisorNavigationGroups,supervisorParentTab} from './supervisorNavigation';
import {getSalesNavigationGroups} from './salesNavigation';
import {getLogisticsNavigationGroups} from './logisticsNavigation';
export const managedRoles=['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'];
export const roleHomeLabel=role=>({ADMIN:'Beranda admin',SUPERVISOR:'Beranda Supervisor',SALES:'Beranda Sales',KEPALA_GUDANG:'Beranda Gudang',SUPIR:'Beranda Driver'})[role]||'Beranda';
export const roleNavigationGroups=user=>user?.role==='ADMIN'?getAdminNavigationGroups(user):user?.role==='SUPERVISOR'?getSupervisorNavigationGroups(user):user?.role==='SALES'?getSalesNavigationGroups(user):getLogisticsNavigationGroups(user);
export const roleParentTab=(user,id)=>user?.role==='ADMIN'?adminParentTab(id):user?.role==='SUPERVISOR'?supervisorParentTab(id):id;
