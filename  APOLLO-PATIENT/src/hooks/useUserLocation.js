import { useState, useCallback, useEffect } from 'react';

// Kharghar, Navi Mumbai — safe fallback when permission denied or GPS unavailable
const KHARGHAR_NAVI_MUMBAI = { latitude: 19.0473, longitude: 73.0694 };

/**
 * useUserLocation
 *
 * Provides the patient's live browser geolocation.
 *
 * Design notes:
 *  - Does NOT auto-request on mount (browsers require a user gesture on many
 *    origins; auto-requesting without explanation also feels invasive).
 *  - Exposes `requestLocation()` — bind this to an "Allow" button.
 *  - Falls back gracefully to Kharghar, Navi Mumbai if denied/unavailable so
 *    the booking flow never breaks.
 *
 * Returns:
 *   latitude         — number
 *   longitude        — number
 *   loading          — boolean (GPS request in-flight)
 *   error            — string | null  (human-readable reason)
 *   permissionDenied — boolean
 *   isFallback       — boolean (true when using city-centre fallback)
 *   locationReady    — boolean (true once the user has explicitly acted)
 *   requestLocation  — () => void  (call from "Allow" button click)
 */
export function useUserLocation() {
  const [latitude, setLatitude]               = useState(() => {
    try {
      const saved = localStorage.getItem('user_gps_coords');
      if (saved) {
        return JSON.parse(saved).latitude;
      }
    } catch (_) {}
    return KHARGHAR_NAVI_MUMBAI.latitude;
  });
  const [longitude, setLongitude]             = useState(() => {
    try {
      const saved = localStorage.getItem('user_gps_coords');
      if (saved) {
        return JSON.parse(saved).longitude;
      }
    } catch (_) {}
    return KHARGHAR_NAVI_MUMBAI.longitude;
  });
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isFallback, setIsFallback]           = useState(true);
  const [locationReady, setLocationReady]     = useState(true);

  const applyFallback = useCallback((reason) => {
    setLatitude(KHARGHAR_NAVI_MUMBAI.latitude);
    setLongitude(KHARGHAR_NAVI_MUMBAI.longitude);
    setIsFallback(true);
    setLocationReady(true);
    setError(reason || 'Using Kharghar, Navi Mumbai fallback.');
    setLoading(false);
  }, []);

  const requestLocation = useCallback(() => {
    // Guard: geolocation API not available (non-secure context, old browser, etc.)
    if (!navigator.geolocation) {
      applyFallback('Geolocation not supported by this browser.');
      return;
    }

    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsFallback(false);
        setLocationReady(true);
        setLoading(false);
        try {
          localStorage.setItem('user_gps_coords', JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }));
        } catch (_) {}
        console.log('[useUserLocation] Live coords obtained:', position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          applyFallback('Location permission denied.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          applyFallback('Location unavailable.');
        } else if (err.code === err.TIMEOUT) {
          applyFallback('Location request timed out.');
        } else {
          applyFallback('Could not determine location.');
        }
        console.warn('[useUserLocation] Geolocation error:', err.message);
      },
      {
        enableHighAccuracy: false, // battery-friendly for a booking flow
        timeout: 8000,
        maximumAge: 60000         // cache for 60s so repeat bookings are fast
      }
    );
  }, [applyFallback]);

  // Auto-request location if not yet fetched and permission not denied
  useEffect(() => {
    if (!latitude && !longitude && !permissionDenied && !locationReady) {
      requestLocation();
    }
  }, [latitude, longitude, permissionDenied, locationReady, requestLocation]);

  return {
    latitude,
    longitude,
    loading,
    error,
    permissionDenied,
    isFallback,
    locationReady,
    requestLocation
  };
}
