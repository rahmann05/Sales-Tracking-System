import {useEffect} from 'react';
import {useMap} from 'react-leaflet';
export function DriverMapFit({stops,selectedId}){const map=useMap();useEffect(()=>{map.invalidateSize();const selected=stops.find(s=>s.id===selectedId);if(selected)map.setView([Number(selected.outlet.latitude),Number(selected.outlet.longitude)],15);else if(stops.length)map.fitBounds(stops.map(s=>[Number(s.outlet.latitude),Number(s.outlet.longitude)]),{padding:[35,35],maxZoom:15});},[map,stops,selectedId]);return null;}
