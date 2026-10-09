import React from 'react';
import {useApp} from '../../../context/AppContext';
import {TAB_FEATURES} from '../../../../../shared/feature-policy.mjs';
import {BUSINESS_FEATURES} from '../../../../../shared/operational-policy.mjs';
export function FeaturePolicyNotice(){
 const {activeTab,settings}=useApp(),feature=TAB_FEATURES[activeTab];
 const mode=settings[`FEATURE_${feature}_MODE`];if(!feature||!['OFF','PAUSED'].includes(mode))return null;
 return <div role="status" className="m-4 p-4 border rounded-xl bg-amber-50 text-amber-950"><strong>{BUSINESS_FEATURES.find(f=>f.id===feature)?.label}: {mode==='OFF'?'nonaktif':'pekerjaan baru dijeda'}</strong><p className="text-sm mt-1">Pembuatan pekerjaan baru dihentikan. Histori dan penyelesaian pekerjaan yang sudah ada tetap tersedia sesuai izin akun.</p></div>;
}
