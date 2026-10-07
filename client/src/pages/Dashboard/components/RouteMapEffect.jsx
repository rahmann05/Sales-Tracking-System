import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';









// Helper custom Leaflet live sales GPS icon generator

// Sub-component to handle map click events

// Sub-component to pan & zoom map when selected outlet changes
export
// Helper custom Leaflet live sales GPS icon generator

// Sub-component to handle map click events

// Sub-component to pan & zoom map when selected outlet changes
const MapEffect = ({
  selectedOutlet,
  selectedSales,
  salesLocation,
  center,
  zoom
}) => {
  const map = useMap();
  useEffect(() => {
    // Ensure map tiles load fully if container resizes shortly after mount
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);
  useEffect(() => {
    if (selectedOutlet?.latitude != null && selectedOutlet?.longitude != null) {
      map.flyTo([Number(selectedOutlet.latitude), Number(selectedOutlet.longitude)], 15, {
        duration: 1
      });
    }
  }, [selectedOutlet, map]);
  useEffect(() => {
    if (selectedSales?.stops?.[0]?.latitude != null) {
      const first = selectedSales.stops[0];
      map.flyTo([Number(first.latitude), Number(first.longitude)], 13, {
        duration: 1
      });
    }
  }, [selectedSales, map]);
  return null;
};
