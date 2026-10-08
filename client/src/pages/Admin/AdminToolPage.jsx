import React from 'react';
import {useApp} from '../../context/AppContext';
import {TAB_IDS} from '../../constants/navigation';
import {getAdminActiveGroup} from '../../constants/adminNavigation';
import {ProductCatalogManager} from './components/ProductCatalogManager';
import {PjpCodeGeneration} from './components/PjpCodeGeneration';
import {CodingMasterForms} from './components/CodingMasterForms';
import {StaffAttendanceReport} from '../../shared/components/common/StaffAttendanceReport';
const components={
  [TAB_IDS.ADMIN_PRODUCTS]:ProductCatalogManager,
  [TAB_IDS.ADMIN_PJP]:PjpCodeGeneration,
  [TAB_IDS.ADMIN_MASTERS]:CodingMasterForms,
  [TAB_IDS.ADMIN_ATTENDANCE]:StaffAttendanceReport,
};
export function AdminToolPage(){
  const {user,activeTab}=useApp();
  const item=getAdminActiveGroup(user,activeTab)?.items.find(tab=>tab.id===activeTab);
  const Component=components[activeTab];
  return <div className="workspace-page admin-tool-page"><header className="admin-page-heading"><div><p className="admin-eyebrow">Administrasi</p><h1>{item?.label}</h1><p>{item?.description}</p></div></header>{Component&&<Component/>}</div>;
}
