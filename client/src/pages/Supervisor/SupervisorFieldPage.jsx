import React from 'react';
import {SupervisorFieldView} from './components/SupervisorFieldView';
import {wibDateKey} from '../../../../shared/visit-metrics.mjs';
export function SupervisorFieldPage(){
  return <div className="workspace-page spv-workspace"><header className="spv-heading"><div><p className="admin-eyebrow">Supervisor / Aktivitas pribadi</p><h1>Kunjungan saya</h1><p>Kelola shift dan supervisi Anda pada {wibDateKey()} WIB.</p></div></header><SupervisorFieldView selectedDate={wibDateKey()}/></div>;
}
