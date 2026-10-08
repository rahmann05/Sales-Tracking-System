import React from 'react';
import {useApp} from '../../context/AppContext';
import {WorkspaceMenuHome} from '../../shared/components/layout/WorkspaceMenuHome';
import {getLogisticsNavigationGroups} from '../../constants/logisticsNavigation';
export function WarehousePage(){const {user,setActiveTab}=useApp();return <WorkspaceMenuHome className="warehouse-home" role="Kepala Gudang" title="Ruang kerja gudang" description="Siapkan muatan, pantau perjalanan, dan tuntaskan pengiriman dari satu tempat." groups={getLogisticsNavigationGroups(user)} onNavigate={setActiveTab}/>;}
