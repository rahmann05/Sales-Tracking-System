import { useCallback, useEffect, useState } from 'react';
import { TAB_IDS } from '../../constants/navigation';
const readTab = () => {const value=window.location.hash.slice(1);return Object.values(TAB_IDS).includes(value)?value:TAB_IDS.ROLE_WORKSPACE;};
export function useBrowserNavigation(user) {
  const [activeTab,setTab] = useState(readTab);
  const setActiveTab = useCallback(value=>{
    if (!Object.values(TAB_IDS).includes(value)) return;
    if (window.location.hash !== `#${value}`) window.history.pushState(null,'',`#${value}`);
    setTab(value);
  },[]);
  useEffect(()=>{const sync=()=>setTab(readTab());window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync);};},[]);
  useEffect(()=>{if(!user){window.history.replaceState(null,'',window.location.pathname+window.location.search);setTab(TAB_IDS.ROLE_WORKSPACE);}},[user?.id]);
  return [activeTab,setActiveTab];
}
