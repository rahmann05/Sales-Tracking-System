import {before,after} from 'node:test';
import {prisma} from '../../src/config/prisma.js';
import {invalidateConfigCache} from '../../src/modules/config/services/dynamic-config.service.js';
import {invalidatePolicyCache} from '../../src/modules/config/services/policy-resolver.service.js';

// Unit tests explicitly use the default company policy, without connecting to a real database.
export function useDefaultPolicy(){
 let original;
 before(()=>{original=prisma.systemConfig.findMany;prisma.systemConfig.findMany=async()=>[];invalidateConfigCache();invalidatePolicyCache();});
 after(()=>{prisma.systemConfig.findMany=original;invalidateConfigCache();invalidatePolicyCache();});
}
