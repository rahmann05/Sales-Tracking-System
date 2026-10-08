import {saveConfigs} from './save-configs.service.js';
export const upsertConfig=async(key,value,actor)=>{const result=await saveConfigs({[key]:value},actor);return result[key];};
