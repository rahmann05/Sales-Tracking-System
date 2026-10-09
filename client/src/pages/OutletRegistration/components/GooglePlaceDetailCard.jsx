import React from 'react';
import {LuMapPin,LuExternalLink} from 'react-icons/lu';
/** Selected public place profile; device GPS remains a separate physical location. */
export const GooglePlaceDetailCard=({place,currentLat,currentLng,searchedQuery})=>{
  const hasGps=currentLat!=null&&currentLng!=null&&Number.isFinite(Number(currentLat))&&Number.isFinite(Number(currentLng))&&Math.abs(Number(currentLat))<=90&&Math.abs(Number(currentLng))<=180;
  const mapsUrl=place?.mapUrl||place?.googleMapsUrl||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place?.address||place?.name||'')}`;
  return <div className="p-4 rounded-xl border border-border-glass bg-surface space-y-3 text-sm">
    <div><h4 className="font-semibold m-0">{place?'Profil tempat terpilih':'Profil tempat belum dipilih'}</h4><p className="text-on-surface-variant mt-2 leading-relaxed">{place?'Periksa kesesuaian profil ini dengan outlet yang Anda kunjungi.':searchedQuery?`Pilih hasil pencarian untuk “${searchedQuery}” atau lengkapi alamat manual.`:'Ketik nama outlet untuk mencari profil tempat di Google Maps.'}</p></div>
    {place&&<>
      {place.photoUrl&&<img src={place.photoUrl} alt={place.name} className="w-full h-36 object-cover rounded-lg"/>}
      <div><strong>{place.name}</strong>{place.categoryName&&<p className="text-on-surface-variant mt-1">{place.categoryName}</p>}</div>
      <p className="leading-relaxed">{place.address||'Alamat profil belum tersedia.'}</p>
      {place.rating!=null&&<p className="text-on-surface-variant">Rating Google: {place.rating}{place.userRatingsTotal!=null?` · ${place.userRatingsTotal} ulasan`:''}</p>}
      {place.openingHoursText&&<p className="leading-relaxed">{place.openingHoursText}</p>}
      {place.phone&&<p><a href={`tel:${place.phone.replace(/[^+\d]/g,'')}`} className="text-primary underline inline-flex items-center min-h-11">{place.phone}</a></p>}
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-2 min-h-11"><LuExternalLink/> Lihat di {place.source==='OSM_NOMINATIM'?'OpenStreetMap':'Google Maps'}</a>
    </>}
    <div className="border-t border-border-glass pt-3"><p className="flex items-center gap-2 font-medium"><LuMapPin/> GPS perangkat</p><p className="text-on-surface-variant mt-2 break-words">{hasGps?`${currentLat}, ${currentLng}`:'Belum tersedia. Ambil GPS saat berada di outlet.'}</p><p className="text-xs text-on-surface-variant mt-2 leading-relaxed">Titik GPS perangkat digunakan sebagai lokasi fisik pengajuan.</p></div>
  </div>;
};
