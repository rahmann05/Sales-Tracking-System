import React from 'react';

import L from 'leaflet';








// Helper custom Leaflet live sales GPS icon generator
export
// Helper custom Leaflet live sales GPS icon generator
const createSalesLivePinIcon = () => {
  const svg = `
    <div style="position:relative; width:42px; height:42px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; width:40px; height:40px; border-radius:50%; background:#2563eb; opacity:0.35; animation:pulse 2s infinite;"></div>
      <div style="width:32px; height:32px; border-radius:50%; background:#1d4ed8; border:3px solid #ffffff; box-shadow:0 4px 8px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:#ffffff;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-sales-live-marker',
    html: svg,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22]
  });
};

// Helper custom Leaflet pin icon generator
export const createCustomPinIcon = (color = '#2563eb', isSelected = false) => {
  const size = isSelected ? 34 : 26;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

// Sub-component to handle map click events
