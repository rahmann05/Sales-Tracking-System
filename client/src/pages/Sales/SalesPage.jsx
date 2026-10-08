import React from 'react';
import {useApp} from '../../context/AppContext';
import {getSalesNavigationGroups} from '../../constants/salesNavigation';
import {WorkspaceMenuHome} from '../../shared/components/layout/WorkspaceMenuHome';
export function SalesPage(){
  const {user,setActiveTab}=useApp();
  return <WorkspaceMenuHome role="Sales" title="Kunjungi. Catat. Tuntaskan." description="Pilih pekerjaan untuk menjalankan kunjungan dan melayani pelanggan Anda." groups={getSalesNavigationGroups(user)} onNavigate={setActiveTab} className="sales-home"/>;
}
