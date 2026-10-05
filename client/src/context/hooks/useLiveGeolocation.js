import { useState, useEffect } from 'react';

/**
 * useLiveGeolocation - Live GPS tracking.
 * Single Responsibility: watches device geolocation while a user
 * is logged in and exposes the latest known position.
 */
export const useLiveGeolocation = (user) => {
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Only track device GPS hardware for field roles that need real-time location check-in
    if (!user || (user.role !== 'SALES' && user.role !== 'SUPIR')) {
      setCurrentLocation(null);
      return;
    }

    if (!navigator.geolocation) return;

    let lastLat = null;
    let lastLng = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Skip re-rendering if position didn't meaningfully change (> 5 meters)
        if (
          lastLat !== null &&
          lastLng !== null &&
          Math.abs(lat - lastLat) < 0.00005 &&
          Math.abs(lng - lastLng) < 0.00005
        ) {
          return;
        }

        lastLat = lat;
        lastLng = lng;

        setCurrentLocation({
          lat,
          lng,
          accuracy: Math.round(pos.coords.accuracy || 10),
        });
      },
      (err) => {
        console.warn('[useLiveGeolocation] Geolocation notice:', err.message);
      },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user?.id, user?.role]);

  return currentLocation;
};
