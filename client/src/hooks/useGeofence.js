import { useState, useCallback } from 'react';

/**
 * Custom Hook for Geofencing calculations (Haversine Formula)
 */
export const useGeofence = () => {
  const [userLocation, setUserLocation] = useState({ lat: -6.1685, lng: 106.7892 });

  /**
   * Calculate distance between two coordinates in meters using Haversine formula
   */
  const calculateDistanceMeters = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }, []);

  /**
   * Verify if target is inside allowed radius (e.g. 50 meters)
   */
  const isWithinGeofence = useCallback(
    (targetLat, targetLng, maxRadiusMeters = 50) => {
      const distance = calculateDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        targetLat,
        targetLng
      );
      return {
        isInside: distance <= maxRadiusMeters,
        distanceMeters: distance,
      };
    },
    [userLocation, calculateDistanceMeters]
  );

  return {
    userLocation,
    setUserLocation,
    calculateDistanceMeters,
    isWithinGeofence,
  };
};
