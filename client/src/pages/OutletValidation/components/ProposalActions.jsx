import React from 'react';
import {useFormDraft} from '../../../shared/hooks/useFormDraft';
export function ProposalActions({scope,disabled,act,digital}){
 const draft=useFormDraft(`outlet-proposal-decision:${scope}`,{reason:''});
 return <form className="app-form" onSubmit={e=>{e.preventDefault();act(()=>digital('APPLY',{reason:draft.value.reason}));}}><label className="app-field">Alasan pemeriksa<textarea required minLength={10} maxLength={2000} value={draft.value.reason} disabled={disabled} onChange={e=>draft.field('reason')(e.target.value)}/></label><div className="app-actions"><button className="app-button app-button-primary" disabled={disabled}>Setujui & terapkan perubahan</button><button type="button" className="app-button" disabled={disabled||draft.value.reason.trim().length<10} onClick={()=>act(()=>digital('RETURN',{reason:draft.value.reason}))}>Kembalikan usulan</button></div></form>;
}
