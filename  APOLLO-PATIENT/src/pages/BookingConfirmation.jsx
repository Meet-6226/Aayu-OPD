import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Briefcase, 
  Heart, 
  GraduationCap, 
  Activity, 
  Loader2,
  Gift,
  MapPin,
  Navigation,
  Cloud,
  Car,
  Home,
  ArrowRight
} from 'lucide-react';
import { runTransaction, doc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { predictNoShowRisk } from '../services/mlApi';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { useAuth } from '../hooks/useAuth';
import { triggerAppointmentBookingDemo } from '../utils/demoTriggers';
import { formatAppointmentDate, formatAppointmentTime, validateAppointmentData } from '../utils/dataFormat';
import { daysBetween } from '../utils/appTime';
import { useUserLocation } from '../hooks/useUserLocation';
import { calculateDistanceKm } from '../utils/calculateDistance';
import { APOLLO_HOSPITALS } from '../utils/hospitalLocation';
import { getWeatherForecast, isWithinForecastWindow } from '../utils/weatherService';
import { estimateTrafficLevel } from '../utils/trafficEstimate';

// Calculate days between appointment date and today — IST-anchored via appTime.js
const calculateLeadTimeDays = (appDateStr) => {
  if (!appDateStr) return 0;
  const diff = daysBetween(appDateStr);
  return diff < 0 ? 0 : diff;
};

// Calculate dynamic travel time, recommended departure, and traffic peaks
const getTravelDetails = (distance, trafficLevel, appointmentTime) => {
  if (!distance) return null;
  
  let mode = 'driving';
  let timeMins = 0;
  let formattedTime = '';
  let delayMins = trafficLevel === 'High' ? 25 : trafficLevel === 'Moderate' ? 12 : 3;

  if (distance > 60) {
    // Inter-city (e.g., Nagpur to Hyderabad)
    mode = 'long-distance';
    timeMins = Math.round((distance / 65) * 60) + delayMins;
    const hrs = Math.floor(timeMins / 60);
    const mins = timeMins % 60;
    formattedTime = `${hrs}h ${mins}m (Highway Drive)`;
  } else {
    // Local city commute (average city speed 30 km/h)
    mode = 'driving';
    timeMins = Math.round((distance / 30) * 60) + delayMins;
    formattedTime = timeMins > 60 
      ? `${Math.floor(timeMins / 60)}h ${timeMins % 60}m` 
      : `${timeMins} mins`;
  }

  // Parse appointment time to estimate departure time
  let departureTimeStr = 'N/A';
  try {
    if (appointmentTime) {
      const [timePart, meridiem] = appointmentTime.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      // Convert to 24 hour minutes
      let apptMinutes = hours * 60 + minutes;
      if (meridiem === 'PM' && hours !== 12) apptMinutes += 12 * 60;
      if (meridiem === 'AM' && hours === 12) apptMinutes = 0;

      // Arrive 15 mins early
      let targetArrivalMinutes = apptMinutes - 15;
      let departureMinutes = targetArrivalMinutes - timeMins;
      if (departureMinutes < 0) departureMinutes += 24 * 60; // wrap around day

      const depHours = Math.floor(departureMinutes / 60);
      const depMins = departureMinutes % 60;
      const depMeridiem = depHours >= 12 ? 'PM' : 'AM';
      const displayHours = depHours % 12 === 0 ? 12 : depHours % 12;
      const displayMins = depMins.toString().padStart(2, '0');
      departureTimeStr = `${displayHours}:${displayMins} ${depMeridiem}`;
    }
  } catch (e) {
    console.error('Error parsing departure time', e);
  }

  // Check if appointment is during peak traffic (8:30 AM - 10:30 AM, 5:00 PM - 7:30 PM)
  let isPeak = false;
  if (appointmentTime) {
    const lower = appointmentTime.toLowerCase();
    if (
      lower.includes('8:30') || lower.includes('9:00') || lower.includes('9:30') || 
      lower.includes('10:00') || lower.includes('10:30') || lower.includes('5:00') || 
      lower.includes('5:30') || lower.includes('6:00') || lower.includes('6:30') || 
      lower.includes('7:00') || lower.includes('7:30')
    ) {
      isPeak = true;
    }
  }

  return { mode, formattedTime, departureTime: departureTimeStr, isPeak, delayMins };
};

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, updateMockSession } = useAuth();

  const [selectedPersona, setSelectedPersona] = useState('Professional');
  const [processing, setProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Family contact details for Elderly persona
  const [familyContact, setFamilyContact] = useState({
    name: '',
    phone: '',
    relation: 'Son/Daughter'
  });

  // ── Geolocation ─────────────────────────────────────────────────────────────
  const {
    latitude: userLat,
    longitude: userLon,
    loading: locationLoading,
    permissionDenied,
    isFallback,
    locationReady,
    requestLocation
  } = useUserLocation();

  // Derived closest hospital and distance (recalculated whenever coords change)
  const closestHospitalDetails = (locationReady && userLat != null && userLon != null)
    ? (() => {
        let minDistance = Infinity;
        let closest = APOLLO_HOSPITALS[0];
        for (const hospital of APOLLO_HOSPITALS) {
          const dist = calculateDistanceKm(userLat, userLon, hospital.latitude, hospital.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            closest = hospital;
          }
        }
        return { hospital: closest, distance: minDistance };
      })()
    : { hospital: APOLLO_HOSPITALS[0], distance: null };

  const closestHospital = closestHospitalDetails.hospital;
  const realDistanceKm = closestHospitalDetails.distance;
  // ── End Geolocation ──────────────────────────────────────────────────────────

  // ── Weather Forecast ────────────────────────────────────────────────────────
  const [weatherData, setWeatherData] = useState(null);  // null = not yet fetched
  const [weatherLoading, setWeatherLoading] = useState(false);

  const booking = location.state;

  // Auto-fetch forecast as soon as we know the appointment date or closest hospital.
  // Uses CLOSEST HOSPITAL coordinates (weather affects travel TO that hospital).
  useEffect(() => {
    if (!booking?.dateString) return;
    if (!isWithinForecastWindow(booking.dateString)) {
      // Beyond 5-day window — set a placeholder immediately
      setWeatherData({
        willRain: false,
        condition: 'Unknown',
        description: 'forecast not yet available (>5 days ahead)',
        temperature: null,
        humidity: null,
        isForecastAvailable: false,
        isBeyondWindow: true,
      });
      return;
    }
    setWeatherLoading(true);
    getWeatherForecast(
      closestHospital.latitude,
      closestHospital.longitude,
      booking.dateString
    ).then(data => {
      setWeatherData(data);
      setWeatherLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.dateString, closestHospital]);
  // ── End Weather Forecast ─────────────────────────────────────────────────────

  // ── Traffic Congestion Estimate ──────────────────────────────────────────────────
  // Rule-based: no paid API required. Derived from appointment time + rain data.
  // Re-derived on every render (cheap pure function, no async needed).
  const trafficInfo = (booking?.dateString && booking?.time)
    ? estimateTrafficLevel(
        // Combine date + time into a single datetime string for getHours()
        `${booking.dateString}T${booking.time.replace(/\s*(AM|PM)/i, '')}`,
        weatherData?.willRain ?? false
      )
    : null;
  // ── End Traffic Estimate ──────────────────────────────────────────────────────────

  // Redirect to doctors search if user lands on this page without a slot selected
  useEffect(() => {
    if (!booking || !booking.slotId) {
      navigate('/doctors');
    }
  }, [booking, navigate]);

  if (!booking || !booking.slotId) {
    return null;
  }

  const personas = [
    {
      id: 'Professional',
      title: 'Working Professional',
      description: 'Reminders scheduled 48h and 24h prior, focused on planning office leave.',
      icon: Briefcase
    },
    {
      id: 'Elderly',
      title: 'Elderly / Dependent',
      description: 'Reminders in regional languages, loops in family members automatically.',
      icon: Heart
    },
    {
      id: 'Student',
      title: 'Student',
      description: 'Casual notifications, focus on quick digital slots or online joins.',
      icon: GraduationCap
    },
    {
      id: 'Other',
      title: 'Standard',
      description: 'Default healthcare reminders at 24h notice.',
      icon: Activity
    }
  ];

  // Dynamic WhatsApp previews
  const getWhatsAppPreviewText = () => {
    const timeText = `${booking.date} at ${booking.time}`;
    const patientName = authUser?.name || 'Priya Sharma';
    
    switch (selectedPersona) {
      case 'Professional':
        return `Hi ${patientName}! Your appointment with ${booking.doctorName} is scheduled for ${timeText}. Plan your leave today to avoid delay. Reply 1 to confirm, 2 to reschedule.`;
      case 'Elderly':
        return `Pranam. Appointment of Smt./Shri. ${patientName} is scheduled with ${booking.doctorName} on ${booking.date}, ${booking.time}. Reminder sent to family contact ${familyContact.name || 'Caretaker'} (+91 ${familyContact.phone || 'XXXXXXXXXX'}). Reply 1 to confirm.`;
      case 'Student':
        return `Hey ${patientName}! Ready for your consult with ${booking.doctorName} on ${timeText}? Friendly nudge: don't skip! Reply 1 to confirm.`;
      default:
        return `Appointment confirmed: ${patientName} with ${booking.doctorName}. ${timeText}. Location: Apollo Hospitals. Reply 1 to confirm.`;
    }
  };

  const handleDone = async () => {
    if (processing) return;
    setProcessing(true);
    setBookingError('');

    try {
      const patientId = authUser.uid;
      const slotRef = doc(db, COLLECTIONS.DOCTOR_SLOTS, booking.slotId);

      // Generate dynamic booking ID
      const random4Digit = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `APL-2026-${random4Digit}`;

      // Set up documents references
      const appointmentRef = doc(collection(db, COLLECTIONS.APPOINTMENTS));
      const appointmentId = appointmentRef.id;
      const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));

      // Parse fee to integer
      const feesNum = parseInt(booking.fees.toString().replace(/\D/g, ''), 10) || 0;

      // Map UI persona to database key
      let dbPersona = 'default';
      if (selectedPersona === 'Professional') dbPersona = 'working_professional';
      else if (selectedPersona === 'Elderly') dbPersona = 'elderly';
      else if (selectedPersona === 'Student') dbPersona = 'student';

      const leadDays = calculateLeadTimeDays(booking.dateString);
      const randomRoom = `OPD ${Math.floor(101 + Math.random() * 299)}`;

      const appointmentData = {
        patientId,
        doctorId: booking.doctorId,
        doctorName: booking.doctorName,
        department: booking.dept,
        appointmentDate: formatAppointmentDate(booking.dateString),
        appointmentTime: formatAppointmentTime(booking.time),
        bookingDate: serverTimestamp(),
        leadTimeDays: leadDays,
        status: "confirmed",
        consultationFee: feesNum,
        riskScore: null,
        riskLevel: null,
        persona: dbPersona,
        familyNotified: false,
        reminderSent48h: false,
        reminderSent24h: false,
        reminderSentMorning: false,
        reminderSentFinal: false,
        patientConfirmed: false,
        bookingId,
        hospital: closestHospital.name,
        room: randomRoom,
        notes: "",
        cancelledReason: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const notificationData = {
        patientId,
        type: "confirmed",
        title: "Booking Confirmed",
        body: `Your appointment with ${booking.doctorName} on ${booking.date} at ${booking.time} is confirmed.`,
        read: false,
        appointmentId: appointmentId,
        channel: "system",
        createdAt: serverTimestamp()
      };

      // Validate schema contract before writing — fail loud
      validateAppointmentData(appointmentData);

      // Atomic Transaction: check slot availability before writing documents
      await runTransaction(db, async (transaction) => {
        // 1. Read slot document
        const slotSnap = await transaction.get(slotRef);
        if (!slotSnap.exists()) {
          throw new Error('slot-not-found');
        }

        const slotData = slotSnap.data();
        if (!slotData.isAvailable) {
          throw new Error('slot-already-booked');
        }

        // 2. Read current patient data to update visits
        const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
        const patientSnap = await transaction.get(patientRef);
        let currentVisits = 0;
        if (patientSnap.exists()) {
          currentVisits = patientSnap.data().totalVisits || 0;
        }

        // 3. Write appointment document
        transaction.set(appointmentRef, appointmentData);

        // 4. Update Slot reference
        transaction.update(slotRef, {
          isAvailable: false,
          appointmentId: appointmentId
        });

        // 5. Update patient stats
        const patientUpdate = {
          totalVisits: currentVisits + 1,
          persona: dbPersona,
          updatedAt: serverTimestamp()
        };

        if (selectedPersona === 'Elderly') {
          patientUpdate.familyContactName = familyContact.name;
          patientUpdate.familyContactPhone = familyContact.phone;
          patientUpdate.familyContactRelation = familyContact.relation;
        }

        if (patientSnap.exists()) {
          transaction.update(patientRef, patientUpdate);
        } else {
          // If the patient document was cleared during seeding but the user is still logged in locally,
          // dynamically re-create the patient document to prevent crash!
          const newPatientData = {
            uid: patientId,
            name: authUser?.name || "User",
            phone: authUser?.phone || "",
            email: authUser?.email || "",
            age: authUser?.age || 0,
            gender: authUser?.gender || "",
            city: authUser?.city || "",
            bloodGroup: authUser?.bloodGroup || "",
            trustScore: 100,
            totalNoShows: 0,
            preferences: authUser?.preferences || {
              whatsapp: true,
              sms: false,
              voiceCall: false,
              email: false
            },
            createdAt: serverTimestamp(),
            ...patientUpdate
          };
          transaction.set(patientRef, newPatientData);
        }

        // 6. Write notification document
        transaction.set(notificationRef, notificationData);
      });

      // ── Geolocation: save last known location to patient doc ────────────────
      // Do this as a best-effort update outside the atomic transaction so it
      // never blocks the booking commit.
      if (locationReady && userLat != null && userLon != null && realDistanceKm != null) {
        try {
          const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
          await updateDoc(patientRef, {
            lastKnownLocation: {
              latitude: userLat,
              longitude: userLon,
              distanceFromHospitalKm: realDistanceKm,
              closestHospitalName: closestHospital.name,
              isFallback: isFallback,
              updatedAt: serverTimestamp()
            },
            updatedAt: serverTimestamp()
          });
          console.log(`[Location] Saved to Firestore — ${realDistanceKm} km from Apollo${isFallback ? ' (fallback)' : ''}`);
        } catch (e) {
          console.warn('[Location] Failed to save lastKnownLocation:', e);
        }
      }
      // ── End Geolocation save ─────────────────────────────────────────────────

      // ── ML Risk Scoring (non-blocking) ─────────────────────────────────────
      // Fire-and-forget: enriches the appointment doc with XGBoost prediction.
      // Never blocks the booking UX; falls back silently if Render is cold-starting.
      // Uses real geolocation distance + live weather when available.
      const effectiveDistanceKm =
        realDistanceKm ??
        authUser.lastKnownLocation?.distanceFromHospitalKm ??
        authUser.distanceKm ??
        10;

      // Real weather_rain from OpenWeatherMap — falls back to false (neutral) if
      // API is unavailable, key is missing, or appointment is >5 days ahead.
      const weatherRain = weatherData?.willRain ?? false;

      console.log(`[ML] Using distance_km = ${effectiveDistanceKm} km (${realDistanceKm ? (isFallback ? 'city fallback' : 'live GPS') : 'stored/default'})`);
      console.log(`[ML] Using weather_rain = ${weatherRain} (${weatherData?.isForecastAvailable ? 'live forecast' : 'fallback/unavailable'}: ${weatherData?.condition ?? 'unknown'})`);
      console.log(`[ML] Traffic estimate: ${trafficInfo?.level ?? 'N/A'} (score=${trafficInfo?.congestionScore ?? '-'}) — factors: ${trafficInfo?.factors?.join(', ') ?? 'none'}`);

      predictNoShowRisk({
        patientNoShows:    authUser.totalNoShows  || 0,
        patientVisits:     (authUser.totalVisits  || 0) + 1,
        distanceKm:        effectiveDistanceKm,
        leadTimeDays:      leadDays,
        patientAge:        authUser.age           || 30,
        patientGender:     authUser.gender        || 'male',
        appointmentDate:   booking.dateString,
        appointmentTime:   booking.time,
        department:        booking.dept,
        persona:           dbPersona,
        familyNotified:           selectedPersona === 'Elderly' && !!familyContact.name,
        consultationType:         'new',
        patientName:              authUser.name          || 'Patient',
        weatherRain,
        trafficCongestionScore:   trafficInfo?.congestionScore  ?? 0.3,
      }).then(async (mlResult) => {
        try {
          await updateDoc(appointmentRef, {
            riskScore:          mlResult.risk_score,
            riskLevel:          mlResult.risk_level,
            shapFactors:        mlResult.shap_factors,
            mlSummary:          mlResult.summary,
            modelVersion:       mlResult.model_version,
            distanceKmUsed:     effectiveDistanceKm,
            locationSource:     realDistanceKm
                                  ? (isFallback ? 'city_fallback' : 'live_gps')
                                  : 'stored_default',
            // Weather fields persisted alongside ML result
            weatherRainUsed:    weatherRain,
            weatherCondition:   weatherData?.condition    ?? 'Unknown',
            weatherDescription: weatherData?.description  ?? 'unavailable',
            weatherTemperature: weatherData?.temperature  ?? null,
            weatherSource:      weatherData?.isForecastAvailable ? 'live_owm' : 'fallback',
            // Traffic estimate (rule-based, PRD feature: Weather/traffic on appointment day)
            trafficLevel:       trafficInfo?.level            ?? 'Unknown',
            trafficScore:       trafficInfo?.congestionScore  ?? null,
            trafficFactors:     trafficInfo?.factors          ?? [],
            updatedAt:          serverTimestamp(),
          });
          console.log(`[ML] Risk scored: ${mlResult.risk_score}% (${mlResult.risk_level}) — model: ${mlResult.model_version}`);
        } catch (e) {
          console.warn('[ML] Failed to write risk score to Firestore:', e);
        }
      }).catch((e) => {
        console.warn('[ML] predictNoShowRisk rejected unexpectedly:', e);
      });
      // ── End ML Risk Scoring ─────────────────────────────────────────────────

      // Update mock local state if needed
      const localUpdate = {
        totalVisits: (authUser.totalVisits || 0) + 1,
        persona: dbPersona
      };
      if (selectedPersona === 'Elderly') {
        localUpdate.familyContactName = familyContact.name;
        localUpdate.familyContactPhone = familyContact.phone;
        localUpdate.familyContactRelation = familyContact.relation;
      }
      updateMockSession(localUpdate);

      // Trigger booking notifications and calls
      try {
        triggerAppointmentBookingDemo(appointmentData, authUser);
      } catch (e) {
        console.error("Booking triggers failed:", e);
      }

      // Trigger success check overlay
      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 1500);

    } catch (error) {
      console.error("Booking transaction failed:", error);
      if (error.message === 'slot-already-booked') {
        setBookingError("This slot was just booked. Please select another time.");
        setTimeout(() => {
          navigate(`/doctor/${booking.doctorId}`);
        }, 3000);
      } else {
        setBookingError("Something went wrong during confirmation. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center font-sans text-center px-4">
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 max-w-[400px] w-full text-center">
          <div className="inline-flex items-center justify-center p-3 bg-mint-green rounded-full text-primary-teal mb-4 shrink-0">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="font-display font-bold text-2xl text-text-dark">
            Booking Confirmed!
          </h1>
          <p className="text-sm text-text-light mt-2">
            Your appointment has been booked. Redirecting to your appointments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[660px] mx-auto px-4 sm:px-6 py-10 bg-transparent font-sans text-text-medium flex flex-col items-center">
      
      {/* ── Progress Indicators & Breadcrumbs ── */}
      <div className="flex items-center justify-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-[#9ca3af] mb-5 font-display select-none">
        <span>1. Select Doctor</span>
        <span className="text-gray-300">&rarr;</span>
        <span className="text-primary-teal bg-primary-teal/5 border border-primary-teal/10 px-2.5 py-1 rounded-lg font-semibold animate-pulse-glow">2. Review & Confirm</span>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-text-dark tracking-tight">
          Review & Confirm Booking
        </h1>
        <p className="text-sm text-text-light mt-2 max-w-[440px] mx-auto leading-relaxed">
          Verify your commute delay estimates, local weather parameters, and choose your notification preferences before finalizing.
        </p>
      </div>

      {/* ── Real-world Parameters Grid (Distance, Weather, Traffic) ── */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        
        {/* 1. Distance Card */}
        <div className="glass-panel border border-white/60 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg glow-shadow-teal text-left">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold text-[#0d9488] tracking-widest uppercase font-display">Distance</span>
            <div className="p-1 bg-[#0d9488]/10 rounded-lg text-[#0d9488]">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          {locationReady ? (
            <div>
              <p className="text-xl font-extrabold text-text-dark font-display">
                {realDistanceKm != null ? `${realDistanceKm.toFixed(1)} km` : 'Calculating...'}
              </p>
              <p className="text-[9.5px] text-[#0d9488] font-bold leading-tight truncate mt-1" title={closestHospital.name}>
                to Apollo {closestHospital.city}
              </p>
              <p className="text-[9px] text-text-light mt-0.5 leading-none">
                {isFallback ? 'City average (fallback)' : 'Live GPS track'}
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={requestLocation}
                disabled={locationLoading}
                className="w-full py-1.5 bg-teal-50 hover:bg-teal-100/80 text-primary-teal text-[11px] font-bold rounded-lg border border-primary-teal/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {locationLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Navigation className="h-3 w-3" />
                )}
                <span>Get GPS Distance</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Weather Card */}
        <div className="glass-panel border border-white/60 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg glow-shadow-teal text-left">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase font-display">Weather</span>
            <div className="p-1 bg-blue-500/10 rounded-lg text-blue-500">
              <Cloud className="h-4 w-4" />
            </div>
          </div>
          {weatherLoading ? (
            <div className="flex items-center space-x-1.5 py-1">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              <span className="text-[10.5px] text-text-light font-bold">Checking...</span>
            </div>
          ) : weatherData?.isForecastAvailable ? (
            <div>
              <p className="text-xl font-extrabold text-text-dark font-display leading-none">
                {weatherData.temperature != null ? `${weatherData.temperature}°C` : 'N/A'}
              </p>
              <p className="text-[10px] text-text-light mt-1.5 truncate capitalize leading-tight">
                {weatherData.description}
                {weatherData.willRain && <span className="text-blue-600 font-extrabold block mt-0.5">· Rain forecast</span>}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-bold text-text-medium leading-tight">
                {weatherData?.isBeyondWindow ? '5+ Days Out' : 'Unavailable'}
              </p>
              <p className="text-[10px] text-text-light mt-0.5 leading-tight">
                {weatherData?.isBeyondWindow ? 'Forecast pending' : 'Neutral average'}
              </p>
            </div>
          )}
        </div>

        {/* 3. Traffic Card */}
        {trafficInfo ? (
          <div className={`glass-panel border rounded-2xl p-4.5 flex flex-col justify-between shadow-lg glow-shadow-teal text-left`}>
            <div className="flex items-center justify-between mb-2.5">
              <span className={`text-[10px] font-bold tracking-widest uppercase font-display ${
                trafficInfo.level === 'High'
                  ? 'text-red-500'
                  : trafficInfo.level === 'Moderate'
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}>Traffic</span>
              <div className={`p-1 rounded-lg ${
                trafficInfo.level === 'High'
                  ? 'bg-red-500/10 text-red-500'
                  : trafficInfo.level === 'Moderate'
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                <Car className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className={`text-xl font-extrabold font-display leading-none ${
                  trafficInfo.level === 'High'
                    ? 'text-red-600'
                    : trafficInfo.level === 'Moderate'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>{trafficInfo.level}</span>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    trafficInfo.level === 'High'
                      ? 'bg-red-400'
                      : trafficInfo.level === 'Moderate'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    trafficInfo.level === 'High'
                      ? 'bg-red-500'
                      : trafficInfo.level === 'Moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}></span>
                </span>
              </div>
              <p className="text-[10px] text-text-light mt-1.5 leading-tight truncate">
                {trafficInfo.level === 'High' ? 'Allow extra buffer time' : trafficInfo.level === 'Moderate' ? 'Expected delays' : 'Clear roads'}
              </p>
            </div>
          </div>
        ) : (
          <div className="glass-panel border border-white/60 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg glow-shadow-teal text-left">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-text-light tracking-widest uppercase font-display">Traffic</span>
              <div className="p-1 bg-gray-100 rounded-lg text-text-light">
                <Car className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-text-medium leading-none">Unavailable</p>
              <p className="text-[10px] text-text-light mt-1.5 leading-tight">Waiting for coordinates</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Route & Commute Planner Card ── */}
      {locationReady && realDistanceKm != null && (() => {
        const travel = getTravelDetails(realDistanceKm, trafficInfo?.level, booking?.time);
        if (!travel) return null;
        return (
          <div className="w-full bg-white border border-border-custom rounded-2xl p-5 mb-6 shadow-sm text-left">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1 bg-primary-teal/10 rounded-lg text-primary-teal">
                <Navigation className="h-4 w-4 animate-pulse" />
              </div>
              <h4 className="text-xs font-bold text-text-dark tracking-wider uppercase font-display">
                ROUTE COMMUTE PLANNER
              </h4>
            </div>

            {/* Visual Timeline Track */}
            <div className="relative flex items-center justify-between px-6 py-4 bg-slate-50/50 border border-[#e5e7eb]/40 rounded-2xl mb-5">
              {/* Connecting progress line */}
              <div className="absolute left-[54px] right-[54px] top-1/2 h-[3px] bg-gradient-to-r from-teal-400 via-amber-300 to-primary-teal -translate-y-1/2 z-0"></div>

              {/* Node 1: Start */}
              <div className="relative z-10 flex flex-col items-center select-none">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/10">
                  <Home className="h-4.5 w-4.5" />
                </div>
                <span className="text-[10px] font-bold text-text-dark mt-2.5">Depart Home</span>
                <span className="text-[11.5px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md mt-1">{travel.departureTime}</span>
              </div>

              {/* Node 2: Transit */}
              <div className="relative z-10 flex flex-col items-center select-none">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                  travel.isPeak ? 'bg-amber-500 text-white shadow-amber-500/10' : 'bg-green-500 text-white shadow-green-500/10'
                }`}>
                  <Car className="h-4.5 w-4.5 animate-bounce" />
                </div>
                <span className="text-[10px] font-bold text-text-dark mt-2.5">Transit</span>
                <span className="text-[11px] text-text-medium font-bold mt-1.5">{travel.formattedTime}</span>
              </div>

              {/* Node 3: Arrival */}
              <div className="relative z-10 flex flex-col items-center select-none">
                <div className="w-10 h-10 rounded-xl bg-primary-teal text-white flex items-center justify-center shadow-md shadow-primary-teal/10">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <span className="text-[10px] font-bold text-text-dark mt-2.5">Apollo OPD</span>
                <span className="text-[11px] font-bold text-primary-teal bg-light-teal border border-primary-teal/10 px-1.5 py-0.5 rounded-md mt-1.5">
                  Arrival
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Departure time and travel time */}
              <div className="space-y-2 bg-[#f8fafc] border border-[#e5e7eb]/45 rounded-xl p-4.5 flex flex-col justify-center">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-text-medium">Est. Commute Time:</span>
                  <span className="text-text-dark">{travel.formattedTime}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-text-medium">Target Arrival Window:</span>
                  <span className="text-primary-teal">15 min buffer added</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2.5 border-t border-[#e5e7eb]/40 font-bold">
                  <span className="text-text-medium">Recommended Departure:</span>
                  <span className="text-[#0d9488] text-sm">{travel.departureTime}</span>
                </div>
              </div>

              {/* Traffic insights */}
              <div className="flex flex-col justify-center space-y-2 p-4 bg-[#f8fafc] rounded-xl border border-[#e5e7eb]/45">
                <div className="flex items-center space-x-1.5">
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                    travel.isPeak 
                      ? 'bg-red-50 text-red-600 border border-red-100' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {travel.isPeak ? 'PEAK TRAFFIC WINDOW' : 'OPTIMAL TRAVEL WINDOW'}
                  </span>
                </div>
                <p className="text-[11.5px] text-text-medium leading-relaxed font-medium">
                  {travel.isPeak 
                    ? `⚠️ Your visit matches standard peak traffic hours (8:30-10:30 AM / 5:00-7:30 PM). Delay margin applied: +${travel.delayMins}m.`
                    : `Road status is optimal. Standard traffic latency applied: +${travel.delayMins}m.`
                  }
                </p>
                {realDistanceKm > 60 && (
                  <p className="text-[9.5px] text-amber-700 bg-amber-500/[0.05] border border-amber-500/10 px-2 py-1 rounded-lg font-bold leading-normal">
                    ℹ️ Inter-City Highway Travel ({realDistanceKm.toFixed(0)} km): Route duration expects steady state traffic conditions.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Booking Error Notice */}
      {bookingError && (
        <div className="w-full bg-[#fff3d6] border border-amber-200/40 text-amber-900 text-xs font-semibold p-4 rounded-xl mb-6 text-center leading-normal">
          {bookingError}
        </div>
      )}

      {/* ── Appointment Details summary card ── */}
      <div className="w-full bg-white border border-[#f3f4f6] rounded-2xl p-5 mb-8 shadow-[0_4px_25px_rgba(0,0,0,0.015)] relative overflow-hidden text-left">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-teal/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="flex justify-between items-start pb-4 border-b border-[#f3f4f6] relative">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-light-teal flex items-center justify-center shrink-0 border border-primary-teal/10">
              <span className="text-[14px] font-bold text-primary-teal">
                {booking.doctorName ? booking.doctorName.replace(/^Dr\.\s+/i, '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-text-dark text-[15px]">{booking.doctorName}</h3>
              <p className="text-[11px] text-primary-teal font-semibold mt-0.5 uppercase tracking-wider">{booking.dept}</p>
            </div>
          </div>
          <span className="bg-[#e6f4ea] text-[#137333] text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Pay at Clinic
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-4 relative">
          <div className="space-y-1">
            <p className="text-[#9ca3af] uppercase tracking-wider text-[9px] font-bold">Appointment Slot</p>
            <p className="font-semibold text-text-dark">{booking.date}</p>
            <p className="text-text-medium font-medium">{booking.time}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#9ca3af] uppercase tracking-wider text-[9px] font-bold">Consultation Fee</p>
            <p className="font-extrabold text-text-dark text-base">{booking.fees}</p>
            <p className="text-[10px] text-text-light">Apollo Hospitals · Jubilee Hills</p>
          </div>
        </div>
      </div>

      {/* ── Persona Selection ── */}
      <div className="w-full space-y-4 mb-8 text-left">
        <div>
          <h2 className="font-display font-bold text-base text-text-dark tracking-tight flex items-center gap-1.5">
            <span>Notification Persona</span>
            <span className="text-[9px] bg-primary-teal/10 text-primary-teal px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Risk Tuning</span>
          </h2>
          <p className="text-xs text-text-light mt-1.5">
            Choose a profile that matches your schedule. This trains the ML model to optimize reminders.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {personas.map((persona) => {
            const IconComponent = persona.icon;
            const isSelected = selectedPersona === persona.id;
            return (
              <div
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={`border rounded-2xl p-4 flex items-start justify-between cursor-pointer transition-all duration-300 hover:translate-y-[-1px] ${
                  isSelected
                    ? 'border-primary-teal bg-gradient-to-br from-teal-50/20 via-white to-white shadow-[0_4px_20px_rgba(13,148,136,0.06)]'
                    : 'border-border-custom hover:border-gray-300 bg-white hover:shadow-[0_4px_15px_rgba(0,0,0,0.01)]'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                    isSelected ? 'bg-primary-teal text-white' : 'bg-[#f3f4f6] text-primary-teal'
                  }`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className={`text-[13px] font-bold ${isSelected ? 'text-primary-teal' : 'text-text-dark'}`}>
                      {persona.title}
                    </h4>
                    <p className="text-xs text-text-light mt-1 leading-relaxed max-w-[420px]">
                      {persona.description}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 pt-0.5 ml-2">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-primary-teal bg-primary-teal text-white' : 'border-border-custom bg-white'
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white fill-none stroke-current" strokeWidth="3" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Elderly Persona Form */}
      {selectedPersona === 'Elderly' && (
        <div className="w-full bg-[#fcfdfe] border border-border-custom rounded-2xl p-5 mb-8 space-y-4 shadow-[0_4px_15px_rgba(0,0,0,0.005)] text-left">
          <h3 className="text-[13px] font-bold text-text-dark flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-[#137333]" />
            <span>Family Caretaker Contact (Verification Loop)</span>
          </h3>
          <p className="text-[11px] text-text-light leading-relaxed">
            The Elderly persona requires a verification caretaker mobile. The AI model sends parallel updates to avoid skipped visits.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="block text-text-light font-semibold mb-1">Caretaker Name</label>
              <input
                type="text"
                value={familyContact.name}
                onChange={(e) => setFamilyContact({ ...familyContact, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-border-custom bg-white rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 text-text-dark transition-colors"
                placeholder="e.g. Ramesh Sharma"
              />
            </div>
            <div>
              <label className="block text-text-light font-semibold mb-1">Caretaker Mobile</label>
              <input
                type="text"
                value={familyContact.phone}
                onChange={(e) => setFamilyContact({ ...familyContact, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-border-custom bg-white rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 text-text-dark transition-colors"
                placeholder="e.g. 9876543210"
              />
            </div>
            <div>
              <label className="block text-text-light font-semibold mb-1">Relationship</label>
              <select
                value={familyContact.relation}
                onChange={(e) => setFamilyContact({ ...familyContact, relation: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-border-custom bg-white rounded-xl focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 text-text-dark transition-colors"
              >
                <option>Son/Daughter</option>
                <option>Spouse</option>
                <option>Sibling</option>
                <option>Caretaker</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Enable WhatsApp Reminders Card */}
      {!authUser?.whatsappOptedIn && (
        <div className="w-full bg-white border border-border-custom rounded-2xl p-5 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#25D366]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          
          <div className="flex items-center space-x-2.5 relative">
            <div className="w-8 h-8 rounded-full bg-[#e8faf0] flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-[#25D366] fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 .953 11.453.953 6.014.953 1.59 5.325 1.586 10.75c-.001 1.7.447 3.361 1.299 4.816L1.87 20.27l4.777-1.116z" />
              </svg>
            </div>
            <h4 className="text-[14px] font-bold text-gray-900 leading-tight">
              Instant WhatsApp Updates
            </h4>
          </div>

          <p className="text-[12px] text-gray-600 mt-2.5 leading-relaxed text-left">
            Stay updated with real-time risk notices, delay announcements, and confirmation details directly on WhatsApp.
          </p>

          <div className="bg-[#fffbeb] border border-amber-100 rounded-xl py-2 px-3 flex items-start space-x-2 mt-3 text-left">
            <Gift className="h-[14px] w-[14px] text-amber-600 shrink-0 mt-0.5" />
            <span className="text-[11px] font-medium text-amber-800 leading-snug">
              Get 10% off your consultation fee instantly upon activating WhatsApp updates.
            </span>
          </div>

          <a
            href="https://wa.me/14155238886?text=I%20want%20to%20receive%20appointment%20reminders%20on%20WhatsApp"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-4.5 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all duration-200 shadow-[0_4px_15px_rgba(37,211,102,0.15)] hover:shadow-[0_4px_20px_rgba(37,211,102,0.25)] hover:translate-y-[-1px]"
          >
            <span>Enable WhatsApp Updates &rarr;</span>
          </a>

          <p className="text-[10px] text-gray-400 text-center mt-2.5 w-full block">
            🔒 Double encrypted. No spam. You can opt-out anytime.
          </p>
        </div>
      )}

      {/* Done CTA */}
      <button
        onClick={handleDone}
        disabled={processing}
        className={`w-full py-4 rounded-xl font-bold text-sm text-center flex items-center justify-center space-x-2 transition-all duration-300 shadow-md ${
          processing
            ? 'bg-gray-100 text-[#9ca3af] cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white hover:from-[#0f766e] hover:to-[#115e59] cursor-pointer shadow-[0_4px_20px_rgba(13,148,136,0.25)] hover:shadow-[0_6px_25px_rgba(13,148,136,0.35)] hover:translate-y-[-1px]'
        }`}
      >
        {processing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span>Confirm Booking &rarr;</span>
        )}
      </button>

    </div>
  );
}
