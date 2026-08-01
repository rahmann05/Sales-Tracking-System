import React, { useState } from 'react';
import { LuMapPin, LuPlus, LuMinus, LuLayers } from 'react-icons/lu';
import { Button } from '../../../components/common/Button';
import '../../../styles/pages/Dashboard.css';

/**
 * MapView Component (Single Responsibility: Real Google Maps Integration for Dashboard)
 * 1 File per Component
 */
export const MapView = ({ locationName = 'Jakarta Central Business District' }) => {
  const [zoom, setZoom] = useState(14);
  const [mapType, setMapType] = useState('m'); // 'm' for roadmap, 'k' for satellite
  const [currentLocation, setCurrentLocation] = useState(locationName);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 1, 20));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 1, 1));
  const handleToggleMapType = () => setMapType((prev) => (prev === 'm' ? 'k' : 'm'));

  // Encode location query for Real Google Maps
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    currentLocation || locationName
  )}&t=${mapType}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <>
      {/* Real Interactive Google Maps Container */}
      <div className="map-container overflow-hidden relative">
        <iframe
          title="Google Maps Salesflow Tracker"
          width="100%"
          height="100%"
          src={mapSrc}
          className="border-none w-full h-full filter saturate-[1.1] contrast-[1.05]"
          loading="lazy"
          allowFullScreen
        ></iframe>
      </div>

      {/* Floating Interactive Map Controls Top Right */}
      <div className="map-controls">
        {/* Recenter Button */}
        <Button
          variant="icon"
          icon={LuMapPin}
          onClick={() => setCurrentLocation('Jakarta Central Business District')}
          title="Recenter to Central CBD"
        />

        {/* Toggle Satellite / Roadmap Layer Button */}
        <Button
          variant="icon"
          icon={LuLayers}
          onClick={handleToggleMapType}
          title={mapType === 'm' ? 'Switch to Satellite View' : 'Switch to Roadmap View'}
        />

        {/* Zoom In / Zoom Out Control Group */}
        <div className="glass-card !p-0 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          <button
            className="w-10 h-10 border-none bg-transparent cursor-pointer border-b border-border-glass flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <LuPlus className="text-lg" />
          </button>
          <button
            className="w-10 h-10 border-none bg-transparent cursor-pointer flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <LuMinus className="text-lg" />
          </button>
        </div>
      </div>
    </>
  );
};
