// Titik bengkel yang diinput Admin berasal dari Google Maps. Tautan pendek tidak dapat dibuka tanpa jaringan,
// sehingga pengguna diminta membuka tautan lengkap atau menempelkan koordinat "lintang, bujur".
const finitePoint=(latitude,longitude)=>Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180&&!(latitude===0&&longitude===0);
const num=value=>Number(String(value).replace(',','.'));
export function parseGoogleMapsPoint(input){
 const text=String(input||'').trim();
 if(!text)return {error:'Tempel tautan Google Maps atau koordinat bengkel.'};
 let decoded=text;try{decoded=decodeURIComponent(text);}catch{}
 const patterns=[
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /[?&](?:q|query|ll|destination|center)=(-?\d+(?:\.\d+)?)(?:,|\s)\s*(-?\d+(?:\.\d+)?)/,
  /^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/,
 ];
 for(const pattern of patterns){
  const match=decoded.match(pattern);
  if(!match)continue;
  const latitude=num(match[1]),longitude=num(match[2]);
  if(finitePoint(latitude,longitude))return {latitude,longitude,mapsUrl:/^https?:\/\//i.test(text)?text:`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`};
 }
 if(/^https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(text))return {error:'Tautan pendek Google Maps tidak dapat dibaca. Buka tautan di peta, salin alamat lengkapnya, atau tempel koordinat.'};
 return {error:'Titik tidak terbaca. Gunakan tautan Google Maps yang memuat koordinat atau format "-6.9175, 107.6191".'};
}
export const googleMapsPointUrl=(latitude,longitude)=>finitePoint(Number(latitude),Number(longitude))?`https://www.google.com/maps/search/?api=1&query=${Number(latitude)},${Number(longitude)}`:null;
