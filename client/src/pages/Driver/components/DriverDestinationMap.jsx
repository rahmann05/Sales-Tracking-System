import {projectOperationalOutlet} from '../../../../../shared/outlet-location.mjs';
import {DriverGoogleDestinationMap} from './DriverGoogleDestinationMap';
import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import {DriverMapFit} from './DriverMapFit';
import React from 'react';
import {MapContainer,TileLayer,Marker,Popup} from 'react-leaflet';
import L from 'leaflet';
import {validOutletPoint,deliveryNavigationUrl} from '../../../../../shared/driver-workspace.mjs';
import {deliveryStopLabel} from '../../Warehouse/deliveryLabels';
export function DriverDestinationMap({stops,selectedId,onSelect}){
 const mapPolicy=useFeaturePolicy('MAPS');
 const valid=React.useMemo(()=>stops.map(s=>({...s,outlet:projectOperationalOutlet(s.outlet)})).filter(s=>validOutletPoint(s.outlet)),[stops]);
 if(!mapPolicy.canStart)return <p className="app-notice" role="status">{mapPolicy.reason} Gunakan daftar alamat tujuan.</p>;
 if(!valid.length)return <p className="admin-empty">Koordinat tujuan belum tersedia. Hubungi Kepala Gudang untuk memeriksa data outlet.</p>;
 if(valid.some(s=>s.outlet.googleMapsOnly))return <DriverGoogleDestinationMap stops={valid} selectedId={selectedId} onSelect={onSelect}/>;
 return <MapContainer className="logistics-destination-map" center={[Number(valid[0].outlet.latitude),Number(valid[0].outlet.longitude)]} zoom={12} scrollWheelZoom={false}><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><DriverMapFit stops={valid} selectedId={selectedId}/>{valid.map(stop=><Marker key={stop.id} position={[Number(stop.outlet.latitude),Number(stop.outlet.longitude)]} icon={L.divIcon({className:'logistics-map-marker',html:`<span>${stops.findIndex(s=>s.id===stop.id)+1}</span>`,iconSize:[32,32],iconAnchor:[16,16]})} eventHandlers={{click:()=>onSelect(stop.id)}}><Popup><strong>{stop.outlet?.name}</strong><p>{deliveryStopLabel(stop.status)}</p><a href={deliveryNavigationUrl(stop.outlet)} target="_blank" rel="noopener noreferrer">Buka navigasi</a></Popup></Marker>)}</MapContainer>;
}
