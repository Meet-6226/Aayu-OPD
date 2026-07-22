/**
 * googleMapsService.js
 *
 * Real road-based distance, duration, and traffic using Google Maps APIs:
 *  - Distance Matrix API  → road distance + travel duration + traffic duration
 *  - Geocoding API        → reverse-geocode lat/lng to human-readable address
 *
 * APIs used (all billable — keep calls minimal):
 *  - Distance Matrix: $5 per 1000 elements (origin-destination pair)
 *  - Geocoding:       $5 per 1000 requests
 *
 * Design:
 *  - Results cached in sessionStorage so re-renders don't re-hit the API.
 *  - Falls back gracefully (returns null) if API key is missing or quota exceeded.
 */

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ── Geocoding ──────────────────────────────────────────────────────────────────

/**
 * Reverse geocode a lat/lng pair to a human-readable address string.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string|null>} formatted_address or null on failure
 */
export async function reverseGeocode(lat, lng) {
  if (!MAPS_API_KEY) return null;
  const cacheKey = `geocode_${lat.toFixed(4)}_${lng.toFixed(4)}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch (_) {}

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;

    // Use the most specific result
    const address = data.results[0].formatted_address;
    try { sessionStorage.setItem(cacheKey, address); } catch (_) {}
    return address;
  } catch (err) {
    console.warn('[GoogleMaps] reverseGeocode failed:', err.message);
    return null;
  }
}

// ── Distance Matrix (road distance + traffic) ─────────────────────────────────

/**
 * Get road distance, travel duration, and traffic-aware duration in traffic
 * between user coordinates and a hospital's coordinates.
 *
 * @param {number} originLat
 * @param {number} originLng
 * @param {number} destLat
 * @param {number} destLng
 * @returns {Promise<{
 *   distanceKm: number,          // road distance in km
 *   distanceText: string,        // e.g. "12.4 km"
 *   durationMins: number,        // normal travel time in mins
 *   durationText: string,        // e.g. "28 mins"
 *   durationInTrafficMins: number|null,  // traffic-aware duration (null if unavailable)
 *   durationInTrafficText: string|null,
 *   trafficDelayMins: number,    // extra mins due to traffic (0 if no traffic data)
 *   congestionLevel: 'Low'|'Moderate'|'High',
 *   congestionScore: number,     // 0.1–0.95 normalised
 * }|null>}
 */
export async function getRoadDistanceAndTraffic(originLat, originLng, destLat, destLng) {
  if (!MAPS_API_KEY) {
    console.warn('[GoogleMaps] No API key — skipping Distance Matrix call');
    return null;
  }

  const cacheKey = `distmat_${originLat.toFixed(4)}_${originLng.toFixed(4)}_${destLat.toFixed(4)}_${destLng.toFixed(4)}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  try {
    const origin = `${originLat},${originLng}`;
    const destination = `${destLat},${destLng}`;
    // departure_time=now enables traffic model (requires billing to be enabled)
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${origin}` +
      `&destinations=${destination}` +
      `&mode=driving` +
      `&departure_time=now` +
      `&traffic_model=best_guess` +
      `&units=metric` +
      `&key=${MAPS_API_KEY}`;

    let data = null;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Distance Matrix HTTP ${res.status}`);
      data = await res.json();
    } catch (corsErr) {
      console.warn('[GoogleMaps] Direct Distance Matrix REST fetch blocked by browser CORS, using Haversine calculation fallback.');
      return null;
    }

    if (data.status !== 'OK') {
      console.warn('[GoogleMaps] Distance Matrix status:', data.status, data.error_message);
      return null;
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      console.warn('[GoogleMaps] Element status not OK:', element?.status);
      return null;
    }

    const distanceKm   = element.distance.value / 1000;  // metres → km
    const durationMins = Math.round(element.duration.value / 60);
    const durationInTrafficMins = element.duration_in_traffic
      ? Math.round(element.duration_in_traffic.value / 60)
      : null;

    const trafficDelayMins =
      durationInTrafficMins != null
        ? Math.max(0, durationInTrafficMins - durationMins)
        : 0;

    // Derive congestion score/level from traffic delay ratio
    let congestionScore = 0.3;
    if (durationInTrafficMins != null && durationMins > 0) {
      const ratio = durationInTrafficMins / durationMins;
      if (ratio >= 1.5)      congestionScore = 0.85;
      else if (ratio >= 1.25) congestionScore = 0.65;
      else if (ratio >= 1.10) congestionScore = 0.45;
      else                    congestionScore = 0.25;
    }

    let congestionLevel = 'Low';
    if (congestionScore >= 0.65)      congestionLevel = 'High';
    else if (congestionScore >= 0.40) congestionLevel = 'Moderate';

    const result = {
      distanceKm:             Math.round(distanceKm * 100) / 100,
      distanceText:           element.distance.text,
      durationMins,
      durationText:           element.duration.text,
      durationInTrafficMins,
      durationInTrafficText:  element.duration_in_traffic?.text ?? null,
      trafficDelayMins,
      congestionLevel,
      congestionScore:        Math.round(congestionScore * 100) / 100,
    };

    try { sessionStorage.setItem(cacheKey, JSON.stringify(result)); } catch (_) {}
    console.log('[GoogleMaps] Distance Matrix result:', result);
    return result;
  } catch (err) {
    console.warn('[GoogleMaps] getRoadDistanceAndTraffic failed:', err.message);
    return null;
  }
}

/**
 * Get a Google Maps directions URL for user → hospital (opens in browser/app).
 * @param {number} originLat
 * @param {number} originLng
 * @param {number} destLat
 * @param {number} destLng
 * @returns {string}
 */
export function getDirectionsUrl(originLat, originLng, destLat, destLng) {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
}
