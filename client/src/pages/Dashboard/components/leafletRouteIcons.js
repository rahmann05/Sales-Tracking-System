import React from 'react';

import L from 'leaflet';

// Helper custom Leaflet live sales GPS icon generator
export // Helper custom Leaflet live sales GPS icon generator
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
    popupAnchor: [0, -22],
  });
};

// Helper custom Leaflet pin icon generator
export const createCustomPinIcon = (color = '#2563eb', isSelected = false, label = null) => {
  const safeColor = typeof color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#2563eb';
  const rawLabel = label != null && String(label).trim() !== '' ? String(label).trim() : '';
  const safeLabel = rawLabel
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  const width = isSelected ? 34 : safeLabel ? 28 : 24;
  const height = Math.round((width * 44) / 34);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 44" width="${width}" height="${height}">
      <path fill="${safeColor}" stroke="#ffffff" stroke-width="${isSelected ? 2.4 : 1.8}" d="M17 2C9.268 2 3 8.268 3 16c0 9.6 14 25 14 25s14-15.4 14-25C31 8.268 24.732 2 17 2z"/>
      ${
        safeLabel
          ? `<text x="17" y="20.2" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="${safeLabel.length >= 3 ? 9.5 : 12.5}" font-weight="800">${safeLabel}</text>`
          : '<circle cx="17" cy="16" r="4" fill="#ffffff"/>'
      }
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
  });
};

// Sub-component to handle map click events
