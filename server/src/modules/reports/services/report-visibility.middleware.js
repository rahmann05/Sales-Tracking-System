import {getDynamicConfig} from '../../config/config.service.js';
import {redactReport,REPORT_VISIBILITY_KEYS} from '../../../../../shared/report-visibility.mjs';
export async function reportVisibility(req,res,next){
 try{
  const values=Object.fromEntries(await Promise.all(REPORT_VISIBILITY_KEYS.map(async key=>[key,await getDynamicConfig(key,true)])));
  const json=res.json.bind(res);
  res.json=body=>json(body?.data?{...body,data:redactReport(body.data,values)}:body);
  next();
 }catch(error){next(error);}
}
