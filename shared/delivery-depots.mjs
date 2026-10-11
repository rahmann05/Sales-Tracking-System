export const DEFAULT_DELIVERY_DEPOTS='A|Lokasi operasional A|-6.885229292442875|107.48966226359217\nB|Lokasi operasional B|-6.896783790758404|107.54886742790057';

export function parseDeliveryDepots(value){
 const lines=String(value||'').split(/\r?\n|;/).map(line=>line.trim()).filter(Boolean);
 if(!lines.length||lines.length>12)throw new Error('Isi 1–12 lokasi operasional.');
 const locations=lines.map((line,index)=>{
  const parts=line.split('|').map(part=>part.trim());
  if(parts.length!==4)throw new Error(`Lokasi baris ${index+1}: gunakan kode|nama|latitude|longitude.`);
  const [id,name,latitudeRaw,longitudeRaw]=parts,latitude=Number(latitudeRaw),longitude=Number(longitudeRaw);
  if(!/^[A-Za-z0-9_-]{1,20}$/.test(id)||name.length<2||name.length>80||latitudeRaw===''||longitudeRaw===''||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw new Error(`Lokasi baris ${index+1}: kode, nama, atau koordinat tidak valid.`);
  return {id,name,latitude,longitude};
 });
 if(new Set(locations.map(location=>location.id)).size!==locations.length)throw new Error('Kode lokasi operasional tidak boleh sama.');
 return locations;
}

export function formatDeliveryDepots(value){
 return parseDeliveryDepots(value).map(location=>`${location.id}|${location.name}|${location.latitude}|${location.longitude}`).join('\n');
}
