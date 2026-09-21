import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom Hook for Live Device GPS Tracking & Geofencing (Haversine Formula)
 * Supports real-time GPS tracking, accuracy threshold, and geofence distance calculation.
 */
export const useGeofence = (targetLat = null, targetLng = null, maxRadiusMeters = 50) => {
  const [gpsStatus, setGpsStatus] = useState('SEARCHING'); // 'SEARCHING', 'LOCKED', 'ERROR', 'UNSUPPORTED'
  const [gpsError, setGpsError] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy, timestamp }
  const watchIdRef = useRef(null);

  /**
   * Calculate distance between two coordinates in meters using Haversine formula
   */
  const calculateDistanceMeters = useCallback((lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
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

  // Request & watch live device GPS
  const refreshGpsLocation = useCallback(() => {
    setGpsStatus('SEARCHING');
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsStatus('UNSUPPORTED');
      setGpsError('Geolocation tidak didukung oleh browser ini.');
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setUserLocation({
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy),
        timestamp: new Date(position.timestamp).toLocaleTimeString(),
      });
      setGpsStatus('LOCKED');
      setGpsError(null);
    };

    const handleError = (error) => {
      setGpsStatus('ERROR');
      if (error.code === error.PERMISSION_DENIED) {
        setGpsError('Izin akses lokasi (GPS) ditolak. Harap aktifkan izin lokasi di browser/HP Anda.');
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setGpsError('Sinyal GPS tidak tersedia atau dinonaktifkan pada perangkat.');
      } else if (error.code === error.TIMEOUT) {
        setGpsError('Waktu pencarian sinyal GPS habis. Pastikan Anda berada di area terbuka.');
      } else {
        setGpsError('Gagal mendeteksi lokasi GPS: ' + error.message);
      }
    };

    // Get current position first
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });

    // Start watching position
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      });
    } catch (e) {
      // ignore watch errors
    }
  }, []);

  useEffect(() => {
    refreshGpsLocation();
    return () => {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [refreshGpsLocation]);

  /**
   * Verify if target is inside allowed radius (e.g. 50 meters)
   */
  const isWithinGeofence = useCallback(
    (tLat = targetLat, tLng = targetLng, radius = maxRadiusMeters) => {
      if (!userLocation || tLat == null || tLng == null) {
        return {
          isInside: false,
          distanceMeters: null,
          isGpsLocked: Boolean(userLocation),
        };
      }

      const distance = calculateDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        tLat,
        tLng
      );

      return {
        isInside: distance !== null && distance <= radius,
        distanceMeters: distance,
        isGpsLocked: true,
      };
    },
    [userLocation, targetLat, targetLng, maxRadiusMeters, calculateDistanceMeters]
  );

  return {
    userLocation,
    gpsStatus,
    gpsError,
    isGpsLocked: gpsStatus === 'LOCKED' && userLocation !== null,
    refreshGpsLocation,
    calculateDistanceMeters,
    isWithinGeofence,
  };
};
