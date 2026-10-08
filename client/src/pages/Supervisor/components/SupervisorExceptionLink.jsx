import React from 'react';
import {useApp} from '../../../context/AppContext';
import {useWorkspaceState} from '../../../shared/hooks/useWorkspaceState';
import {TAB_IDS} from '../../../constants/navigation';
export function SupervisorExceptionLink({row}){
  const {setActiveTab}=useApp();
  const [,setSection]=useWorkspaceState('spvApproval','orders'),[,setStatus]=useWorkspaceState('spvQueue','pending'),[,setRequest]=useWorkspaceState('spvRequest','');
  const [,setManualKind]=useWorkspaceState('manualKind','PJP'),[,setManualDetail]=useWorkspaceState('manualDetail',''),[,setManualStatus]=useWorkspaceState('manualStatus','PENDING');
  const exception=row.exception;
  const open=()=>{
    const kind=exception.kind;
    setSection(kind.startsWith('MANUAL')?'manual':kind==='OFF_PJP'?'offpjp':kind==='UNLOCK'?'unlock':'closed');
    setStatus(exception.pendingAdmin?'history':'pending');
    if(kind.startsWith('MANUAL')){setManualKind(kind==='MANUAL_PJP'?'PJP':'OFF_PJP');setManualStatus('PENDING');setManualDetail(exception.id);}
    else setRequest(`${kind==='OFF_PJP'?'attendance':kind==='UNLOCK'?'UNLOCK_REQUEST':'CLOSED_SHOP'}:${exception.id}`);
    setActiveTab(TAB_IDS.SPV_APPROVAL);
  };
  return <div className="app-actions"><button type="button" className="app-button" onClick={open}>Buka pemeriksaan permintaan</button>{!row.canDecide&&<p className="spv-note">Keputusan mengikuti kewenangan dan tahap permintaan.</p>}</div>;
}
