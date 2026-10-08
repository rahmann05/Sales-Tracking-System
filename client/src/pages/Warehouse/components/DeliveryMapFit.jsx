import {useEffect} from 'react';
import {useMap} from 'react-leaflet';
export function DeliveryMapFit({points}){
  const map=useMap();
  const coordinates=JSON.stringify(points);
  useEffect(()=>{const bounds=JSON.parse(coordinates);map.invalidateSize();if(bounds.length)map.fitBounds(bounds,{padding:[30,30],maxZoom:14});},[map,coordinates]);
  return null;
}
