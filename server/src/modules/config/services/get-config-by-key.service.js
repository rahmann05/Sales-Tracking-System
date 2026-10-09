/** getConfigByKey - single-responsibility service (extracted from config.service.js). */
import { prisma } from '../../../config/prisma.js';
import {CONFIG_PARAMS} from '../../../../../shared/config.mjs';
import {getDynamicConfig} from './dynamic-config.service.js';


export const getConfigByKey = async (key) => {
  const definition=CONFIG_PARAMS.find(param=>param.key===key);
  if(definition)return getDynamicConfig(key,definition.defaultValue);
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });
  return config ? config.value : null;
};
