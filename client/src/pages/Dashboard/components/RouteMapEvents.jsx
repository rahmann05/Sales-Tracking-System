import React from 'react';
import { useMapEvents } from 'react-leaflet';









// Helper custom Leaflet live sales GPS icon generator

// Sub-component to handle map click events
export
// Helper custom Leaflet live sales GPS icon generator

// Sub-component to handle map click events
const MapEventsHandler = ({
  onMapClick
}) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    }
  });
  return null;
};

// Sub-component to pan & zoom map when selected outlet changes
