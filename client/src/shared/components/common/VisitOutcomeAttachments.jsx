import React from 'react';
import {validVisitAttachment} from '../../../../../shared/visit-outcome.mjs';
export function VisitOutcomeAttachments({value}){
 const files=(value?.attachments||[]).filter(a=>validVisitAttachment(a.dataUrl));
 if(!files.length)return null;
 return <details><summary>Lampiran hasil kunjungan ({files.length})</summary><ul>{files.map((a,i)=><li key={i}><a href={a.dataUrl} download={a.name}>{a.name}</a></li>)}</ul></details>;
}
