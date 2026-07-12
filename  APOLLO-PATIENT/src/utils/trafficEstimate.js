/**
 * trafficEstimate.js
 *
 * Rule-based traffic congestion estimator for Indian metro cities.
 *
 * Rationale: Live traffic APIs (Google Maps, HERE, TomTom) require paid billing
 * accounts. Indian urban traffic is highly time-predictable — peak hours are
 * consistent across Hyderabad, Bengaluru, Mumbai, Delhi etc. — making a
 * rule-based model a legitimate and demo-safe alternative that still captures
 * the "Weather/traffic on appointment day" feature from our PRD.
 *
 * Factors modelled:
 *  - Time of day (morning rush, midday lull, evening rush, off-peak)
 *  - Day of week (weekday vs weekend)
 *  - Rain (worsens Indian city traffic significantly due to poor drainage)
 */

/**
 * Estimate traffic congestion for a given appointment datetime and rain status.
 *
 * @param {string|Date} appointmentDateTime  - Full appointment datetime (ISO or Date)
 * @param {boolean}     isRaining            - From real OWM weather forecast
 * @returns {{
 *   congestionScore: number,   // 0.1–0.95 normalised score
 *   level: 'Low'|'Moderate'|'High',
 *   description: string,
 *   factors: string[]          // human-readable list of what drove the score
 * }}
 */
export function estimateTrafficLevel(appointmentDateTime, isRaining = false) {
  const dt = new Date(appointmentDateTime);
  const hour      = dt.getHours();
  const dayOfWeek = dt.getDay(); // 0 = Sunday, 6 = Saturday

  let congestionScore = 0.3; // baseline — moderate background traffic
  const factors = [];

  // ── Time-of-day bands ─────────────────────────────────────────────────────
  const isMorningRush = hour >= 8  && hour <= 10;
  const isEveningRush = hour >= 17 && hour <= 20;
  const isMidday      = hour >= 11 && hour <= 16;
  const isOffPeak     = !isMorningRush && !isEveningRush && !isMidday;

  if (isMorningRush || isEveningRush) {
    congestionScore += 0.35;
    factors.push(`${isMorningRush ? 'morning' : 'evening'} rush hour (${hour}:00)`);
  } else if (isMidday) {
    congestionScore += 0.10;
    factors.push(`midday moderate traffic (${hour}:00)`);
  } else {
    congestionScore -= 0.10;
    factors.push(`off-peak hours (${hour}:00)`);
  }

  // ── Day-of-week ───────────────────────────────────────────────────────────
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  if (isWeekday) {
    congestionScore += 0.15;
    factors.push('weekday');
  } else {
    factors.push('weekend — lighter base traffic');
  }

  // ── Rain effect ───────────────────────────────────────────────────────────
  // Indian city roads flood easily; rain reliably causes slowdowns
  if (isRaining) {
    congestionScore += 0.25;
    factors.push('rain expected — road slowdowns likely');
  }

  // ── Clamp to [0.10, 0.95] ────────────────────────────────────────────────
  congestionScore = Math.max(0.10, Math.min(0.95, congestionScore));
  congestionScore = Math.round(congestionScore * 100) / 100; // 2 dp

  // ── Classify ─────────────────────────────────────────────────────────────
  let level;
  if (congestionScore >= 0.65) {
    level = 'High';
  } else if (congestionScore >= 0.40) {
    level = 'Moderate';
  } else {
    level = 'Low';
  }

  const description =
    level === 'High'
      ? 'Heavy traffic expected — allow extra travel time'
      : level === 'Moderate'
      ? 'Moderate traffic expected'
      : 'Light traffic expected';

  return { congestionScore, level, description, factors };
}
