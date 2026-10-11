export function setWorkspaceValues(values,{replace=false}={}){
 const url=new URL(window.location.href);
 for(const [key,value] of Object.entries(values))if(value==null||value==='')url.searchParams.delete(key);else url.searchParams.set(key,String(value));
 window.history[replace?'replaceState':'pushState'](null,'',url);
 window.dispatchEvent(new Event('workspace-state-changed'));
}
