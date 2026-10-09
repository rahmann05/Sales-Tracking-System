export function locationExpired(record,hours,now=Date.now()){
 if(!record||!(Number(hours)>0))return false;
 const time=+(new Date(record.observedAt||record.receivedAt));
 return !Number.isFinite(time)||now-time>Number(hours)*3600000;
}
