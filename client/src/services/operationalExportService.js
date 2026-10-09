import {request} from './httpClient';
import {notifyError} from './notificationService';
async function allowed(domain){
 try{await request(`/config/access/export?domain=${encodeURIComponent(domain)}`);return true;}
 catch(error){notifyError(error.message);return false;}
}
export async function downloadOperationalFile(content,filename,mimeType,domain='REPORTS'){
 if(!await allowed(domain))return false;
 const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type:mimeType})),link=document.createElement('a');
 link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;
}
export async function printOperationalDocument(domain='REPORTS'){
 if(await allowed(domain))window.print();
}
