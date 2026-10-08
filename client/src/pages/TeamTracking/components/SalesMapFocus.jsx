import {useEffect} from 'react';
import {useMap} from 'react-leaflet';
export function SalesMapFocus({rows,selectedId}){
  const map=useMap();
  const signature=rows.map(row=>`${row.salesId}:${row.latitude}:${row.longitude}`).join('|');
  useEffect(()=>{
    const selected=rows.find(row=>row.salesId===selectedId);
    if(selected)map.setView([Number(selected.latitude),Number(selected.longitude)],14);
    else if(rows.length)map.fitBounds(rows.map(row=>[Number(row.latitude),Number(row.longitude)]),{padding:[35,35],maxZoom:14});
  },[map,selectedId,signature]);
  return null;
}
