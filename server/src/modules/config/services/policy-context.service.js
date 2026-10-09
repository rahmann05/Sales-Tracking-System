import {AsyncLocalStorage} from 'node:async_hooks';
const storage=new AsyncLocalStorage();
export const currentPolicy=()=>storage.getStore();
export const withPolicy=(policy,fn)=>storage.run(policy,fn);
