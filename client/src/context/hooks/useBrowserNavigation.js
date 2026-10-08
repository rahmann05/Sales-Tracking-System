import { useCallback, useEffect, useState,useRef } from 'react';
import { TAB_IDS } from '../../constants/navigation';
const readTab = () => {const value=window.location.hash.slice(1);return Object.values(TAB_IDS).includes(value)?value:TAB_IDS.ROLE_WORKSPACE;};
export function useBrowserNavigation(user,sessionLoading=false) {
  const [activeTab,setTab] = useState(readTab);
  const current=useRef(activeTab);
  current.current=activeTab;
  const setActiveTab = useCallback(value=>{
    if (!Object.values(TAB_IDS).includes(value)) return;
    if(value===current.current)return;
    if(!window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true,detail:{tab:value}})))return;
    if (window.location.hash !== `#${value}`) window.history.pushState(null,'',`#${value}`);
    setTab(value);
  },[]);
  useEffect(()=>{const sync=()=>{const value=readTab();if(value===current.current)return;if(!window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true,detail:{tab:value}}))){window.history.replaceState(null,'',`#${current.current}`);return;}current.current=value;setTab(value);};window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync);};},[]);
  useEffect(()=>{if(!user&&!sessionLoading){window.history.replaceState(null,'',window.location.pathname+window.location.search);setTab(TAB_IDS.ROLE_WORKSPACE);}},[user?.id,sessionLoading]);
  return [activeTab,setActiveTab];
}
