import React from 'react';
import {AttentionPanel} from '../../shared/components/common/AttentionPanel';
export function SupervisorAttentionPage(){
  return <div className="workspace-page spv-workspace"><header className="spv-heading"><div><p className="admin-eyebrow">Supervisi / Penyelesaian pekerjaan</p><h1>Tindak lanjut</h1><p>Periksa penanggung jawab, tenggat, bukti, dan tahap pemeriksaan pekerjaan tim.</p></div></header><div className="spv-attention"><AttentionPanel/></div></div>;
}
