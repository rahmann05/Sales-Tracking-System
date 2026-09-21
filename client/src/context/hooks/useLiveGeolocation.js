import { useState, useEffect } from 'react';

/**
 * useLiveGeolocation - Live GPS tracking.
 * Single Responsibility: watches device geolocation while a user
 * is logged in and exposes the latest known position.
 */
export const useLiveGeolocation = (user) => {
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (!user) {
      setCurrentLocation(null);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        console.warn('[useLiveGeolocation] Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  return currentLocation;
};
