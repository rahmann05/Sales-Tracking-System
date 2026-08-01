import React, { useState } from 'react';
import { LuMapPin, LuNavigation, LuPlus, LuMinus, LuLayers } from 'react-icons/lu';
import { Card } from '../../../components/common/Card';

/**
 * RouteMapView Component (Single Responsibility: Real Google Maps View for Route Planning)
 * 1 File per Component
 */
export const RouteMapView = ({ selectedRouteName = 'Rute Central Business District' }) => {
  const [zoom, setZoom] = useState(13);
  const [mapType, setMapType] = useState('m'); // 'm' for roadmap, 'k' for satellite

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    selectedRouteName + ', Indonesia'
  )}&t=${mapType}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <Card variant="panel" className="!p-0 overflow-hidden shadow-lg border border-border-glass mb-8 relative">
      {/* Map Header Overlay */}
      <div className="p-4 bg-white/90 backdrop-blur-md border-b border-border-glass flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center text-lg">
            <LuNavigation />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Peta Real-Time Google Maps Rute Sales</h3>
            <span className="text-xs text-on-surface-variant font-medium">{selectedRouteName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMapType((prev) => (prev === 'm' ? 'k' : 'm'))}
            className="px-3 py-1.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-bold border border-border-glass flex items-center gap-1.5 hover:bg-surface-container transition-colors"
          >
            <LuLayers />
            <span>{mapType === 'm' ? 'Satellite View' : 'Roadmap View'}</span>
          </button>
        </div>
      </div>

      {/* Real Google Maps Container - Extended Mobile & Desktop Vertical Height */}
      <div className="w-full h-[560px] md:h-[620px] relative bg-surface-container">
        <iframe
          title="Google Maps Route Planning"
          width="100%"
          height="100%"
          src={mapSrc}
          className="border-none w-full h-full filter saturate-[1.05]"
          loading="lazy"
          allowFullScreen
        ></iframe>

        {/* Floating Zoom Controls Bottom Right */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col bg-white/90 backdrop-blur-md rounded-xl border border-border-glass shadow-md overflow-hidden">
          <button
            onClick={() => setZoom((prev) => Math.min(prev + 1, 20))}
            className="w-8 h-8 flex items-center justify-center text-on-surface border-b border-border-glass hover:bg-surface-container transition-colors"
            title="Zoom In"
          >
            <LuPlus className="text-sm" />
          </button>
          <button
            onClick={() => setZoom((prev) => Math.max(prev - 1, 1))}
            className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            title="Zoom Out"
          >
            <LuMinus className="text-sm" />
          </button>
        </div>
      </div>
    </Card>
  );
};
