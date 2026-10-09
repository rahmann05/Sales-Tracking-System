import { usersApi } from '../../services/api';
import { useState, useEffect } from 'react';

/**
 * useLiveGeolocation - Live GPS tracking.
 * Single Responsibility: watches device geolocation while a user
 * is logged in and exposes the latest known position.
 */
export const useLiveGeolocation = (user,settings={},shiftActive=false,visitActive=false) => {
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Only track device GPS hardware for field roles that need real-time location check-in
    if (!user || user.role!=='SALES' || settings.SALES_TRACKING_MODE==='OFF' || settings.SALES_TRACKING_MODE==='SHIFT'&&!shiftActive || settings.SALES_TRACKING_MODE==='VISIT'&&!visitActive) {
      setCurrentLocation(null);
      return;
    }

    if (!navigator.geolocation) return;

    let active=true,lastReport = 0;
    let lastLat = null;
    let lastLng = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if(!active)return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (user.role==='SALES' && Date.now()-lastReport>=(settings.TRACKING_SEND_INTERVAL_SECONDS||30)*1000) {
          lastReport=Date.now();
          const loc={lat,lng};
          localStorage.setItem('user_gps_location',JSON.stringify(loc));
          window.dispatchEvent(new CustomEvent('gps_location_updated',{detail:loc}));
          usersApi.updateLocation({latitude:lat,longitude:lng,accuracy:pos.coords.accuracy,observedAt:new Date(pos.timestamp).toISOString(),speed:pos.coords.speed || 0,heading:pos.coords.heading || 0}).catch(()=>{});
        }
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
          accuracy: Number.isFinite(pos.coords.accuracy)?Math.round(pos.coords.accuracy):null,
        });
      },
      (err) => {
        console.warn('[useLiveGeolocation] Geolocation notice:', err.message);
      },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 20000 }
    );

    return () => {active=false;navigator.geolocation.clearWatch(watchId);};
  }, [user?.id,user?.role,settings.SALES_TRACKING_MODE,settings.TRACKING_SEND_INTERVAL_SECONDS,shiftActive,visitActive]);

  return currentLocation;
};
