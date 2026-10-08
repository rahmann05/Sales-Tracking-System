import React from 'react';
import {useApp} from '../../context/AppContext';
import {LegacyAdminApprovalView} from './LegacyAdminApprovalView';
import {AdminOrderWorkspace} from './components/AdminOrderWorkspace';
export function AdminApprovalView(props){
  const {user}=useApp();
  return ['ADMIN','SUPERVISOR'].includes(user?.role)&&!props.embedded?<AdminOrderWorkspace {...props}/>:<LegacyAdminApprovalView {...props}/>;
}
