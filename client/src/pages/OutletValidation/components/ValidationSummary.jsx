import React from 'react';
import {reviewLabels} from '../../OutletManagement/outletPresentation';
export function ValidationSummary({summary,status,onSelect}) {
 return <nav className="outlet-summary-strip" aria-label="Status kasus dalam cakupan Anda">{[['OPEN',reviewLabels.OPEN],['WAITING_FIELD',reviewLabels.WAITING_FIELD],['COMPLETED',reviewLabels.COMPLETED],['ALL','Semua kasus']].map(([id,label])=><button type="button" key={id} aria-pressed={status===id} onClick={()=>onSelect(id)}><span>{label}</span><strong>{id==='ALL'?Object.values(summary).reduce((a,b)=>a+b,0):summary[id]||0}</strong></button>)}</nav>;
}
