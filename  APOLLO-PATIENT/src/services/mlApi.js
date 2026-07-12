// Apollo No-Show ML API Client
// Calls the XGBoost FastAPI service deployed on Render.com

const ML_API_URL = import.meta.env.VITE_ML_API_URL || "https://apollo-opd.onrender.com";

/**
 * Call the ML /predict endpoint with appointment + patient context.
 * Always resolves — never throws. Falls back gracefully if Render is cold-starting.
 *
 * @param {Object} appointmentData
 * @returns {Promise<{risk_score, risk_level, shap_factors, summary, model_version}>}
 */
export async function predictNoShowRisk(appointmentData) {
  // Derive day-of-week from appointmentDate string (0=Sunday in JS, API expects 0=Monday)
  let dayOfWeek = 0;
  try {
    const d = new Date(appointmentData.appointmentDate);
    // Convert JS Sunday=0 → Monday=0 convention used by our model
    dayOfWeek = (d.getDay() + 6) % 7;
  } catch (_) { dayOfWeek = 0; }

  // Parse hour safely from "HH:MM AM/PM" or "HH:MM" formats
  let hourOfAppointment = 10;
  try {
    const timeStr = appointmentData.appointmentTime || "10:00";
    const [hStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    // Handle 12-hour format if present
    const isPM = timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.toLowerCase().includes('am');
    if (isPM && h !== 12) hourOfAppointment = h + 12;
    else if (isAM && h === 12) hourOfAppointment = 0;
    else hourOfAppointment = h;
  } catch (_) { hourOfAppointment = 10; }

  // Map persona to boolean flags
  const persona = appointmentData.persona || "";
  const isWorkingProfessional = persona === "working_professional";
  const isElderly = persona === "elderly";
  const isStudent = persona === "student";

  const payload = {
    past_no_show_count:      appointmentData.patientNoShows     || 0,
    past_visit_count:        Math.max(appointmentData.patientVisits || 1, 1),
    distance_km:             appointmentData.distanceKm          || 10,
    lead_time_days:          appointmentData.leadTimeDays        || 0,
    age:                     appointmentData.patientAge          || 30,
    gender:                  (appointmentData.patientGender || "male").toLowerCase(),
    day_of_week:             dayOfWeek,
    hour_of_appointment:     hourOfAppointment,
    department:              appointmentData.department          || "General Medicine",
    is_working_professional: isWorkingProfessional,
    is_elderly:              isElderly,
    is_student:              isStudent,
    persona_set:             !!persona,
    family_notified:         appointmentData.familyNotified      || false,
    weather_rain:            appointmentData.weatherRain ?? false,  // real OWM forecast
    traffic_congestion_score: appointmentData.trafficCongestionScore ?? 0.3, // from estimateTrafficLevel()
    consultation_type:       appointmentData.consultationType    || "new",
    doctor_avg_no_show_rate: 0.25,
    patient_name:            appointmentData.patientName         || "Patient",
  };

  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(`${ML_API_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`ML API responded with ${response.status}`);
    return await response.json();

  } catch (error) {
    console.warn('[mlApi] ML prediction fell back to default:', error.message);
    // Graceful fallback — app never crashes if Render free tier is sleeping
    return {
      risk_score:    50,
      risk_level:    "MEDIUM",
      shap_factors:  [],
      summary:       "Risk assessment pending (model waking up, please retry)",
      model_version: "fallback",
    };
  }
}

/**
 * Fetch live model performance metrics from /model-info.
 * Used by the DEMO-DAY admin Model Performance card.
 */
export async function fetchModelInfo() {
  try {
    const response = await fetch(`${ML_API_URL}/model-info`);
    if (!response.ok) throw new Error(`model-info responded with ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('[mlApi] model-info fetch failed:', error.message);
    return null;
  }
}

/**
 * Ping /health to wake the Render free tier service before demo.
 */
export async function wakeService() {
  try {
    const response = await fetch(`${ML_API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
