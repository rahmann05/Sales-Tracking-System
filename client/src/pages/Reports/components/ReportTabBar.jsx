import React from 'react';
import {useApp} from '../../../context/AppContext';
import {LuPhoneCall,LuCalendarRange,LuTrendingUp} from 'react-icons/lu';

const tabs=[{id:'DAILY',label:'Harian',icon:LuPhoneCall},{id:'WEEKLY',label:'Mingguan',icon:LuCalendarRange},{id:'MTD',label:'Bulanan',icon:LuTrendingUp}];
export function ReportTabBar({activeTab,onSelectTab}) {
  const {settings}=useApp();
  return <nav className="report-period-tabs" aria-label="Periode laporan">{tabs.filter(t=>t.id!=='WEEKLY'||settings.REPORT_WEEKLY_ENABLED).filter(t=>t.id!=='MTD'||settings.REPORT_MTD_ENABLED).map(({id,label,icon:Icon})=><button key={id} type="button" aria-pressed={activeTab===id} onClick={()=>onSelectTab(id)}><Icon aria-hidden="true"/>{label}</button>)}</nav>;
}
