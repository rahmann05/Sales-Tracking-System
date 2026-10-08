import React from 'react';
import {useApp} from '../../context/AppContext';
import {WorkspaceMenuHome} from '../../shared/components/layout/WorkspaceMenuHome';
import {getLogisticsNavigationGroups} from '../../constants/logisticsNavigation';
export function DriverPage(){const {user,setActiveTab}=useApp();return <WorkspaceMenuHome className="driver-home" role="Driver" title="Ruang kerja Driver" description="Buka trip yang ditugaskan dan lanjutkan ke tujuan berikutnya." groups={getLogisticsNavigationGroups(user)} onNavigate={setActiveTab}/>;}
