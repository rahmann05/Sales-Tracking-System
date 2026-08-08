import React from 'react';
import { InfoWindowF } from '@react-google-maps/api';
import { LuStore, LuMapPin, LuNavigation, LuExternalLink } from 'react-icons/lu';
import { getClusterInfo } from '../../../services/clusterColorService';
import { googleDirectionsService } from '../../../services/googleDirectionsService';
import { googlePlacesService } from '../../../services/googlePlacesService';
import '../../../styles/components/OutletInfoWindow.css';

/**
 * OutletInfoWindow Component
 * Single Responsibility: Render InfoWindow popup untuk outlet yang dipilih.
 */
export const OutletInfoWindow = ({ stop, salesLocation, onClose }) => {
    if (!stop || stop.latitude == null) return null;

    const clusterInfo = getClusterInfo(stop.clusterName, stop.callplanName);
    const outletName = stop.outletName || stop.customerName;
    const directionsUrl = googleDirectionsService.getDirectionsUrl(salesLocation, stop);
    const mapsUrl = googlePlacesService.getGoogleMapsUrl(stop.latitude, stop.longitude, stop.outletName);

    return (
        <InfoWindowF
            position={{ lat: stop.latitude, lng: stop.longitude }}
            onCloseClick={onClose}
        >
            <div className="outlet-info-window">
                <div className="outlet-info-window__header">
                    <span className="outlet-info-window__cluster">
                        <LuStore /> {clusterInfo.name}
                    </span>
                    <span className="outlet-info-window__source">Google Places API</span>
                </div>
                <h5 className="outlet-info-window__name">{outletName}</h5>
                <p className="outlet-info-window__address">
                    <LuMapPin className="outlet-info-window__address-icon" />
                    <span>{stop.address}</span>
                </p>
                <div className="outlet-info-window__actions">
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="outlet-info-window__nav-link"
                    >
                        <LuNavigation /> Navigasi Directions
                    </a>
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="outlet-info-window__maps-link"
                        title="Google Maps"
                    >
                        <LuExternalLink />
                    </a>
                </div>
            </div>
        </InfoWindowF>
    );
};
