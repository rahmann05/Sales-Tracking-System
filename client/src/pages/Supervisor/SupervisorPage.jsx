import React from 'react';
import {useApp} from '../../context/AppContext';
import {getSupervisorNavigationGroups} from '../../constants/supervisorNavigation';
import {WorkspaceMenuHome} from '../../shared/components/layout/WorkspaceMenuHome';
export function SupervisorPage(){
  const {user,setActiveTab}=useApp();
  return <WorkspaceMenuHome role="Supervisor" title="Awasi tim. Arahkan langkah." description="Pilih pekerjaan untuk mendampingi dan mengevaluasi tim Anda." groups={getSupervisorNavigationGroups(user)} onNavigate={setActiveTab} className="spv-home"/>;
}
