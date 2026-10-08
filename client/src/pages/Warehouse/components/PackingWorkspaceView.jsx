import React from 'react';
import {WarehousePackingWorkspaceView} from './WarehousePackingWorkspaceView';
import {AdminPackingWorkspace} from '../../../pages/Admin/components/AdminPackingWorkspace';
export function PackingWorkspaceView(props){
  return props.admin?<AdminPackingWorkspace {...props}/>:<WarehousePackingWorkspaceView {...props}/>;
}
