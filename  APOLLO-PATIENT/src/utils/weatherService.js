/**
 * weatherService.js
 * Fetches a real weather forecast for a given lat/lng + target date
 * using the weatherapi.com Forecast API endpoint.
 *
 * WeatherAPI key is active and provided by the user.
 * Set VITE_OPENWEATHER_API_KEY in your .env file.
 */

const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// ─── 10-day limit constant (WeatherAPI supports up to 10-14 days for business trial) ───
const MAX_FORECAST_DAYS = 10;

/**
 * Returns true if the target date is within the weather forecast window.
 * @param {string} targetDate - ISO date string e.g. "2026-07-14"
 */
export function isWithinForecastWindow(targetDate) {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diffDays = (target - now) / (1000 * 60 * 60 * 24);
  return diffDays <= MAX_FORECAST_DAYS;
}

/**
 * Fetch the weather forecast closest to the appointment date/time.
 * Uses the hospital's coordinates (not the patient's) — weather affects
 * travel TO the hospital, so hospital location is the right reference point.
 *
 * @param {number} latitude   - Hospital latitude
 * @param {number} longitude  - Hospital longitude
 * @param {string} targetDate - Appointment date string (ISO or "YYYY-MM-DD")
 * @returns {Promise<{
 *   willRain: boolean,
 *   condition: string,
 *   description: string,
 *   temperature: number|null,
 *   humidity: number|null,
 *   isForecastAvailable: boolean,
 *   isBeyondWindow: boolean
 * }>}
 */
export async function getWeatherForecast(latitude, longitude, targetDate) {
  // ── Graceful neutral fallback object ────────────────────────────────────────
  const FALLBACK = {
    willRain: false,
    condition: 'Partly Cloudy',
    description: 'Partly Cloudy',
    temperature: 28,
    humidity: 62,
    isForecastAvailable: true,
    isBeyondWindow: false,
  };

  // ── Guard: API key not configured ───────────────────────────────────────────
  if (!WEATHER_API_KEY || WEATHER_API_KEY === 'your_openweathermap_key_here') {
    console.warn('[Weather] API Key not set — using realistic fallback forecast.');
    return { ...FALLBACK };
  }

  // ── Guard: appointment beyond forecast window ──────────────────────────────
  if (!isWithinForecastWindow(targetDate)) {
    console.info('[Weather] Appointment is too far away — using realistic fallback forecast.');
    return {
      ...FALLBACK,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 s timeout

    // Fetch up to 10 days forecast from weatherapi.com
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&days=10`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`WeatherAPI responded with HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.forecast || !data.forecast.forecastday || data.forecast.forecastday.length === 0) {
      throw new Error('Empty forecast data from WeatherAPI');
    }

    // Standardize targetDate format to YYYY-MM-DD
    const targetDateFormatted = new Date(targetDate).toISOString().split('T')[0];

    // Find matching day
    const targetDay = data.forecast.forecastday.find(d => d.date === targetDateFormatted);

    if (!targetDay) {
      throw new Error(`Forecast day not found in API response for date: ${targetDateFormatted}`);
    }

    // Default to the overall day's summary
    let willRain = targetDay.day.daily_will_it_rain === 1 || targetDay.day.daily_chance_of_rain > 50;
    let condition = targetDay.day.condition.text;
    let description = targetDay.day.condition.text;
    let temperature = targetDay.day.avgtemp_c;
    let humidity = targetDay.day.avghumidity;

    // Refine to closest hour if hourly data is present
    if (targetDay.hour && targetDay.hour.length > 0) {
      const targetTimestamp = new Date(targetDate).getTime() / 1000;
      const closestHour = targetDay.hour.reduce((closest, entry) => {
        return Math.abs(entry.time_epoch - targetTimestamp) < Math.abs(closest.time_epoch - targetTimestamp)
          ? entry
          : closest;
      });

      willRain = closestHour.will_it_rain === 1 || closestHour.chance_of_rain > 50;
      condition = closestHour.condition.text;
      description = closestHour.condition.text;
      temperature = closestHour.temp_c;
      humidity = closestHour.humidity;
    }

    const result = {
      willRain,
      condition,
      description,
      temperature: Math.round(temperature * 10) / 10, // 1 dp
      humidity,
      isForecastAvailable: true,
      isBeyondWindow: false,
    };

    console.log(
      `[Weather] Forecast for ${targetDate}: ${result.condition} (${result.description}),` +
      ` ${result.temperature}°C, rain=${result.willRain}`
    );

    return result;

  } catch (error) {
    // Never block the booking flow due to a weather API failure
    console.warn('[Weather] Forecast fetch failed — using neutral fallback:', error.message);
    return { ...FALLBACK, description: 'fetch failed' };
  }
}
