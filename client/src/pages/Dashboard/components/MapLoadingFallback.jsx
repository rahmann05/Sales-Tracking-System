import React from 'react';
import { ClusterMapLegend } from './ClusterMapLegend';
import { SelectedSalesMapHeader } from './SelectedSalesMapHeader';
import '../../../styles/components/MapLoadingFallback.css';

/**
 * MapLoadingFallback Component
 * Single Responsibility: Render fallback iframe saat Google Maps SDK masih loading.
 */
export const MapLoadingFallback = ({
    allStopsCount,
    isSalesRole,
    selectedSales,
    onClearSelection,
    selectedOutlet,
    salesLocation,
}) => {
    const centerQuery = selectedOutlet
        ? `${selectedOutlet.latitude},${selectedOutlet.longitude}`
        : `${salesLocation.lat},${salesLocation.lng}`;
    const iframeSrc = `https://maps.google.com/maps?q=${encodeURIComponent(centerQuery)}&t=m&z=14&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="map-loading-fallback">
            <ClusterMapLegend totalOutletsCount={allStopsCount} />
            {!isSalesRole && selectedSales && (
                <SelectedSalesMapHeader selectedSales={selectedSales} onClearSelection={onClearSelection} />
            )}
            <iframe
                title="Google Maps JS SDK Loader"
                width="100%"
                height="100%"
                src={iframeSrc}
                className="map-loading-fallback__iframe"
                loading="lazy"
                allowFullScreen
            />
        </div>
    );
};
