import {useApp} from '../../context/AppContext';
import {featureAvailable,BUSINESS_FEATURES} from '../../../../shared/operational-policy.mjs';

// Mirrors the server's NEW_WORK gate. Existing work and historical reads remain available.
export function useFeaturePolicy(feature){
 const {settings,settingsReady}=useApp();
 const canStart=Boolean(settingsReady)&&featureAvailable(settings,feature);
 const label=BUSINESS_FEATURES.find(item=>item.id===feature)?.label||'Fitur';
 return {canStart,reason:canStart?'':!settingsReady?'Memuat aturan operasional…':`${label}: pekerjaan baru dijeda atau dinonaktifkan Admin.`,settings};
}
