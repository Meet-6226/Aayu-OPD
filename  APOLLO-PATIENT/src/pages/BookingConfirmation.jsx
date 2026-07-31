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
  ArrowRight,
  X
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
import { AAYU_CLINICS } from '../utils/hospitalLocation';
import { getWeatherForecast, isWithinForecastWindow } from '../utils/weatherService';
import { estimateTrafficLevel } from '../utils/trafficEstimate';
import { getRoadDistanceAndTraffic, reverseGeocode, getDirectionsUrl } from '../services/googleMapsService';
import { createVideoRoom } from '../services/videoCallService';

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

const getInitialPersona = (user) => {
  if (!user || !user.persona) return 'Professional';
  const p = user.persona;
  if (p === 'working_professional' || p === 'Professional') return 'Professional';
  if (p === 'elderly' || p === 'Elderly') return 'Elderly';
  if (p === 'student' || p === 'Student') return 'Student';
  return 'Other';
};

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, updateMockSession } = useAuth();

  const [selectedPersona, setSelectedPersona] = useState(() => getInitialPersona(authUser));
  const [processing, setProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [loadingStep, setLoadingStep] = useState('');

  // Family contact details for Elderly persona
  const [familyContact, setFamilyContact] = useState({
    name: authUser?.familyContactName || '',
    phone: authUser?.familyContactPhone || '',
    relation: authUser?.familyContactRelation || 'Son/Daughter'
  });

  useEffect(() => {
    if (authUser && authUser.persona) {
      const mapped = getInitialPersona(authUser);
      setSelectedPersona(mapped);
      if (authUser.familyContactName || authUser.familyContactPhone) {
        setFamilyContact({
          name: authUser.familyContactName || '',
          phone: authUser.familyContactPhone || '',
          relation: authUser.familyContactRelation || 'Son/Daughter'
        });
      }
    }
  }, [authUser]);

  const [predictionRisk, setPredictionRisk] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [isSimulatedHighRisk, setIsSimulatedHighRisk] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [generatedTokenCode, setGeneratedTokenCode] = useState('');
  const [incentiveClaimed, setIncentiveClaimed] = useState(false);

  // Ride booking simulation states
  const [selectedCab, setSelectedCab] = useState('ubergo');
  const [cabBookingStatus, setCabBookingStatus] = useState('idle'); // idle, booking, confirmed
  const [driverInfo, setDriverInfo] = useState(null);
  const [whatsappNotif, setWhatsappNotif] = useState(null);

  useEffect(() => {
    const handleWhatsApp = (e) => {
      setWhatsappNotif(e.detail);
    };
    window.addEventListener('whatsapp_dispatched', handleWhatsApp);
    return () => window.removeEventListener('whatsapp_dispatched', handleWhatsApp);
  }, []);

  // ── Google Maps real road data ─────────────────────────────────────────────
  const [mapsData, setMapsData] = useState(null);        // null = not yet fetched
  const [mapsLoading, setMapsLoading] = useState(false);
  const [userAddress, setUserAddress] = useState(null);  // reverse-geocoded address

  const handleBookCab = () => {
    if (cabBookingStatus !== 'idle') return;
    setCabBookingStatus('booking');
    setTimeout(() => {
      setCabBookingStatus('confirmed');
      setDriverInfo({
        name: 'Suresh Kumar',
        vehicle: 'White Maruti Dzire (TS-09-EX-4421)',
        rating: '4.9 ★',
        phone: '+91 98765 43210'
      });
    }, 2000);
  };

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
        let closest = AAYU_CLINICS[0];
        for (const hospital of AAYU_CLINICS) {
          const dist = calculateDistanceKm(userLat, userLon, hospital.latitude, hospital.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            closest = hospital;
          }
        }
        return { hospital: closest, distance: minDistance };
      })()
    : { hospital: AAYU_CLINICS[0], distance: null };

  const closestHospital = closestHospitalDetails.hospital;
  // Haversine straight-line distance (fallback when Google Maps unavailable)
  const haversineDistanceKm = closestHospitalDetails.distance;
  // Use Google Maps road distance if available, else fall back to Haversine
  const realDistanceKm = mapsData?.distanceKm ?? haversineDistanceKm;
  // ── End Geolocation ──────────────────────────────────────────────────────────

  // ── Google Maps: fetch road distance + traffic when user location is ready ──
  useEffect(() => {
    if (!locationReady || userLat == null || userLon == null || !closestHospital) return;
    if (mapsData || mapsLoading) return; // already fetched or fetching

    setMapsLoading(true);

    // Parallel: road data + reverse geocoding
    Promise.all([
      getRoadDistanceAndTraffic(userLat, userLon, closestHospital.latitude, closestHospital.longitude),
      reverseGeocode(userLat, userLon),
    ]).then(([roadData, address]) => {
      if (roadData) {
        setMapsData(roadData);
        console.log('[BookingConfirmation] Google Maps road data:', roadData);
      } else {
        console.warn('[BookingConfirmation] Google Maps unavailable, using Haversine fallback');
      }
      if (address) setUserAddress(address);
    }).catch(err => {
      console.warn('[BookingConfirmation] Google Maps fetch error:', err);
    }).finally(() => {
      setMapsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationReady, userLat, userLon, closestHospital]);
  // ── End Google Maps ──────────────────────────────────────────────────────────

  // ── Weather Forecast ────────────────────────────────────────────────────────
  const [weatherData, setWeatherData] = useState(null);  // null = not yet fetched
  const [weatherLoading, setWeatherLoading] = useState(false);

  const booking = location.state;
  const consultationMode = booking?.consultationMode || 'in_person';

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

  // ── Initial ML Risk Prediction ──────────────────────────────────────────────
  useEffect(() => {
    if (!booking || !locationReady || !closestHospital) return;
    
    setPredictionLoading(true);
    const dist = realDistanceKm ?? authUser.lastKnownLocation?.distanceFromHospitalKm ?? authUser.distanceKm ?? 10;
    const leadDays = calculateLeadTimeDays(booking.dateString);
    const weatherRain = weatherData?.willRain ?? false;
    let dbPersona = 'default';
    if (selectedPersona === 'Professional') dbPersona = 'working_professional';
    else if (selectedPersona === 'Elderly') dbPersona = 'elderly';
    else if (selectedPersona === 'Student') dbPersona = 'student';

    predictNoShowRisk({
      past_no_show_count:      authUser.totalNoShows  || 0,
      past_visit_count:        (authUser.totalVisits  || 0) + 1,
      distance_km:             dist,
      lead_time_days:          leadDays,
      age:                     authUser.age           || 30,
      gender:                  (authUser.gender        || 'male').toLowerCase(),
      appointmentDate:   booking.dateString,
      appointmentTime:   booking.time,
      department:        booking.dept,
      persona:           dbPersona,
      familyNotified:    selectedPersona === 'Elderly' && !!familyContact.name,
      consultationType:  'new',
      patientName:       authUser.name          || 'Patient',
      weatherRain,
      trafficCongestionScore: trafficInfo?.congestionScore ?? 0.3,
    }).then(res => {
      setPredictionRisk(res);
      setPredictionLoading(false);
    }).catch(err => {
      console.warn("Prediction on load failed:", err);
      setPredictionLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, locationReady, realDistanceKm, weatherData, selectedPersona, familyContact.name, closestHospital]);

  // ── Traffic Congestion Estimate ────────────────────────────────────────────────────
  // Primary: Google Maps real-time traffic (mapsData.congestionScore / congestionLevel)
  // Fallback: Rule-based estimate derived from appointment time + rain.
  const ruleBasedTrafficInfo = (booking?.dateString && booking?.time)
    ? estimateTrafficLevel(
        `${booking.dateString}T${booking.time.replace(/\s*(AM|PM)/i, '')}`,
        weatherData?.willRain ?? false
      )
    : null;

  // Merge: if Google Maps gave us real traffic data, use it; else use rule-based
  const trafficInfo = mapsData
    ? {
        congestionScore: mapsData.congestionScore,
        level: mapsData.congestionLevel,
        description:
          mapsData.trafficDelayMins > 0
            ? `+${mapsData.trafficDelayMins} min delay in current traffic`
            : 'Light traffic — no significant delays',
        factors: [
          `Google Maps live traffic`,
          mapsData.durationInTrafficText
            ? `${mapsData.durationInTrafficText} in traffic (normally ${mapsData.durationText})`
            : `${mapsData.durationText} drive`,
          ...(ruleBasedTrafficInfo?.factors ?? []),
        ],
        // Extra Google-specific fields for UI display
        isLive: true,
        durationText: mapsData.durationText,
        durationInTrafficText: mapsData.durationInTrafficText,
        distanceText: mapsData.distanceText,
        trafficDelayMins: mapsData.trafficDelayMins,
      }
    : ruleBasedTrafficInfo;
  // ── End Traffic Estimate ────────────────────────────────────────────────────────────

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
  const getWhatsAppPreviewText = (videoUrl = null) => {
    const timeText = `${booking.date} at ${booking.time}`;
    const patientName = authUser?.name || 'Priya Sharma';
    const isOnline = consultationMode === 'online';
    const joinLink = videoUrl ? `\n\nJoin here 10 minutes before your slot: ${videoUrl}` : '';
    
    if (isOnline) {
      return `Hello ${patientName}, your video consultation with ${booking.doctorName} is confirmed for ${timeText}. Please be ready on time with a stable internet connection.${joinLink} Reply 1 to confirm.`;
    }
    switch (selectedPersona) {
      case 'Professional':
        return `Hi ${patientName}! Your appointment with ${booking.doctorName} is scheduled for ${timeText}. Plan your leave today to avoid delay. Reply 1 to confirm, 2 to reschedule.`;
      case 'Elderly':
        return `Pranam. Appointment of Smt./Shri. ${patientName} is scheduled with ${booking.doctorName} on ${booking.date}, ${booking.time}. Reminder sent to family contact ${familyContact.name || 'Caretaker'} (+91 ${familyContact.phone || 'XXXXXXXXXX'}). Reply 1 to confirm.`;
      case 'Student':
        return `Hey ${patientName}! Ready for your consult with ${booking.doctorName} on ${timeText}? Friendly nudge: don't skip! Reply 1 to confirm.`;
      default:
        return `Appointment confirmed: ${patientName} with ${booking.doctorName}. ${timeText}. Location: Aayu Clinic. Reply 1 to confirm.`;
    }
  };

  const handleDone = async () => {
    if (processing) return;
    setProcessing(true);
    setBookingError('');
    setLoadingStep('Securing transactional database locks...');

    // Helper promise delay
    const delay = ms => new Promise(res => setTimeout(res, ms));

    try {
      await delay(800);
      setLoadingStep('Verifying slot availability on selected clinician schedule...');

      const patientId = authUser?.uid || authUser?.id || (authUser?.phoneNumber ? authUser.phoneNumber.replace(/\D/g, '') : null) || (authUser?.email ? authUser.email.replace(/[^a-zA-Z0-9_-]/g, '') : null) || 'patient_priya_demo';
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

      // Create Daily.co video room for online consultations
      let videoRoomUrl = null;
      let videoRoomName = null;
      if (consultationMode === 'online') {
        try {
          videoRoomUrl = await createVideoRoom(appointmentId, booking.dateString, booking.time);
          videoRoomName = `aayu-consult-${appointmentId}`;
          console.log('[VideoCall] Room created:', videoRoomUrl);
        } catch (e) {
          console.error('[VideoCall] Room creation failed, booking will continue:', e);
          videoRoomUrl = `https://aayu-test.daily.co/aayu-consult-${appointmentId}`;
          videoRoomName = `aayu-consult-${appointmentId}`;
        }
      }

      // Map UI persona to database key
      let dbPersona = 'default';
      if (selectedPersona === 'Professional') dbPersona = 'working_professional';
      else if (selectedPersona === 'Elderly') dbPersona = 'elderly';
      else if (selectedPersona === 'Student') dbPersona = 'student';

      const leadDays = calculateLeadTimeDays(booking.dateString);
      const randomRoom = `OPD ${Math.floor(101 + Math.random() * 299)}`;

      const patientName = authUser?.name || 'Priya Sharma';

      const appointmentData = {
        patientId,
        patientName,
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
        room: consultationMode === 'online' ? null : randomRoom,
        notes: "",
        cancelledReason: "",
        consultationMode,
        videoRoomUrl: videoRoomUrl || null,
        videoRoomName: videoRoomName || null,
        callStatus: consultationMode === 'online' ? 'not_started' : null,
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

      await delay(850);
      setLoadingStep('Running atomic MongoDB transaction updates...');

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
          console.log(`[Location] Saved to Firestore — ${realDistanceKm} km from Aayu${isFallback ? ' (fallback)' : ''}`);
        } catch (e) {
          console.warn('[Location] Failed to save lastKnownLocation:', e);
        }
      }

      await delay(900);
      setLoadingStep('Dispatching automated Twilio WhatsApp notifications...');

      // ── ML Risk Scoring (non-blocking) ─────────────────────────────────────
      const effectiveDistanceKm =
        realDistanceKm ??
        authUser.lastKnownLocation?.distanceFromHospitalKm ??
        authUser.distanceKm ??
        10;

      const weatherRain = weatherData?.willRain ?? false;

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
            weatherRainUsed:    weatherRain,
            weatherCondition:   weatherData?.condition    ?? 'Unknown',
            weatherDescription: weatherData?.description  ?? 'unavailable',
            weatherTemperature: weatherData?.temperature  ?? null,
            weatherSource:      weatherData?.isForecastAvailable ? 'live_owm' : 'fallback',
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

      await delay(700);
      setLoadingStep('Finalizing secure clinician connection...');
      await delay(450);

      // Trigger success check overlay
      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 3500);

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
      setLoadingStep('');
    }
  };

  const handleClaimRescheduleIncentive = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const patientId = authUser.uid;
      const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
      
      // Update patient profile in Firestore: increment priorityTokens
      const updatedTokens = (authUser.priorityTokens || 0) + 1;
      const tokenCode = `APL-PRI-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setGeneratedTokenCode(tokenCode);

      const newReward = {
        tokenCode,
        type: "Priority Access",
        discount: "15% Diagnostic Off",
        earnedAt: new Date().toISOString(),
        status: "active"
      };

      await updateDoc(patientRef, {
        priorityTokens: updatedTokens,
        earnedRewards: [
          ...(authUser.earnedRewards || []),
          newReward
        ],
        updatedAt: serverTimestamp()
      });

      updateMockSession({
        priorityTokens: updatedTokens,
        earnedRewards: [
          ...(authUser.earnedRewards || []),
          newReward
        ]
      });

      setIncentiveClaimed(true);
      setShowRewardModal(true);
    } catch (e) {
      console.error("Failed to claim incentive:", e);
      setBookingError("Failed to claim reward. Please try again.");
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
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-10 bg-transparent font-sans text-text-medium">
      
      {/* ── Progress Indicators & Breadcrumbs ── */}
      <div className="flex items-center justify-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-[#9ca3af] mb-5 font-display select-none">
        <span>1. Select Doctor</span>
        <span className="text-gray-300">&rarr;</span>
        <span className="text-[#0f766e] bg-[#f0fdfa] border border-[#ccfbf1] px-2.5 py-1 rounded-[6px] font-semibold">2. Review & Confirm</span>
      </div>

      {/* Title */}
      <div className="text-center mb-10 relative">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-text-dark tracking-tight">
          Review & Confirm Booking
        </h1>
        <p className="text-sm text-text-light mt-2 max-w-[440px] mx-auto leading-relaxed">
          Verify your commute delay estimates, local weather parameters, and choose your notification preferences before finalizing.
        </p>
        
        {/* Sim Trigger Link for Hackathon Demo */}
        <button
          onClick={() => setIsSimulatedHighRisk(!isSimulatedHighRisk)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary-teal bg-primary-teal/5 hover:bg-primary-teal/15 border border-primary-teal/15 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none active:scale-95"
        >
          {isSimulatedHighRisk ? 'Reset Risk Simulation' : 'Simulate High Risk'}
        </button>
      </div>

      {/* WhatsApp Dispatched Floating Notification Card */}
      {whatsappNotif && (
        <div className="w-full bg-emerald-900 text-white rounded-2xl p-4 mb-6 shadow-lg border border-emerald-500/30 flex items-start justify-between animate-fade-in text-left">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm mt-0.5">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">WhatsApp Notification Dispatched</span>
                <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded-full font-mono text-emerald-200">
                  {whatsappNotif.status === 'sent' ? 'Live Sent' : 'Daily 50-Msg Limit Logged'}
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-semibold mt-1">To: {whatsappNotif.phone}</p>
              <p className="text-xs text-white/90 bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/80 mt-1.5 font-mono leading-relaxed">
                "{whatsappNotif.body}"
              </p>
            </div>
          </div>
          <button 
            onClick={() => setWhatsappNotif(null)} 
            className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-1 bg-emerald-800/50 rounded-lg border border-emerald-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Commute & Personas (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* ── Route & Commute Planner Card ── */}
          {locationReady && realDistanceKm != null && (() => {
            const travel = getTravelDetails(realDistanceKm, trafficInfo?.level, booking?.time);
            if (!travel) return null;
            return (
              <div className="w-full bg-white border border-border-custom rounded-2xl p-5 shadow-sm text-left">
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
                    <span className="text-[10px] font-bold text-text-dark mt-2.5">Aayu Clinic</span>
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

                {/* Injected CSS keyframes for responsive car animation */}
                <style>{`
                                    @keyframes moveCar {
                    0% { left: 15%; top: 65%; transform: translate(-50%, -50%) rotate(0deg); }
                    20% { left: 25%; top: 65%; transform: translate(-50%, -50%) rotate(0deg); }
                    25% { left: 27%; top: 62%; transform: translate(-50%, -50%) rotate(-30deg); }
                    40% { left: 35%; top: 46%; transform: translate(-50%, -50%) rotate(-30deg); }
                    45% { left: 36.7%; top: 45%; transform: translate(-50%, -50%) rotate(0deg); }
                    65% { left: 53.3%; top: 45%; transform: translate(-50%, -50%) rotate(0deg); }
                    70% { left: 55%; top: 42%; transform: translate(-50%, -50%) rotate(-30deg); }
                    80% { left: 64%; top: 27%; transform: translate(-50%, -50%) rotate(-30deg); }
                    85% { left: 66.7%; top: 25%; transform: translate(-50%, -50%) rotate(0deg); }
                    100% { left: 75%; top: 25%; transform: translate(-50%, -50%) rotate(0deg); }
                  }
                  @keyframes dash {
                    to {
                      stroke-dashoffset: -40;
                    }
                  }
                `}</style>

                {/* Simulated Live Route Map */}
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=Aayu+One+Clinic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative h-[200px] w-full bg-[#f1f5f9] rounded-2xl overflow-hidden border border-slate-200 mt-5 shadow-inner select-none block group cursor-pointer hover:border-primary-teal transition-colors"
                  title="Click to open route in Google Maps"
                >
                  {/* Vector Map Layer */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Water Body (River) */}
                    <path d="M -20,180 Q 200,160 380,185 T 620,175" fill="none" stroke="#bae6fd" strokeWidth="24" strokeLinecap="round" opacity="0.6" />
                    <path d="M -20,180 Q 200,160 380,185 T 620,175" fill="none" stroke="#e0f2fe" strokeWidth="20" strokeLinecap="round" opacity="0.8" />
 
                    {/* Park Areas */}
                    <path d="M 180,120 C 180,110 220,110 250,115 C 280,120 290,140 290,160 C 290,175 220,180 180,175 Z" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1" opacity="0.9" />
                    <text x="235" y="145" fill="#15803d" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Central Park</text>
 
                    <rect x="470" y="10" width="110" height="60" rx="8" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1" opacity="0.8" />
                    <text x="525" y="32" fill="#15803d" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Clinic Green Zone</text>
 
                    {/* Secondary Roads (Under-layer/Casing) */}
                    <path d="M -10,35 L 610,35 M -10,75 L 610,75 M -10,115 L 610,115 M -10,155 L 610,155" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
                    <path d="M 110,-10 L 110,210 M 230,-10 L 230,210 M 350,-10 L 350,210 M 470,-10 L 470,210" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
                    <path d="M -10,190 L 210,-10 M 390,210 L 610,-10" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.9" />

                    {/* Secondary Roads (Top-layer) */}
                    <path d="M -10,35 L 610,35 M -10,75 L 610,75 M -10,115 L 610,115 M -10,155 L 610,155" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                    <path d="M 110,-10 L 110,210 M 230,-10 L 230,210 M 350,-10 L 350,210 M 470,-10 L 470,210" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                    <path d="M -10,190 L 210,-10 M 390,210 L 610,-10" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

                    {/* Metro Line (Blue) */}
                    <path d="M -10,100 L 610,100" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4 4" opacity="0.8" />
                    <text x="50" y="95" fill="#2563eb" fontSize="6.5" fontWeight="extrabold" fontFamily="sans-serif" opacity="0.8">Navi Mumbai Metro Line 1</text>
                    
                    {/* Metro Station Icon */}
                    <circle cx="230" cy="100" r="4.5" fill="white" stroke="#2563eb" strokeWidth="1.5" />
                    <circle cx="230" cy="100" r="2" fill="#2563eb" />
                    <text x="230" y="112" fill="#1e40af" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Kharghar Metro Station</text>

                    {/* Landmark Text Labels */}
                    <text x="60" y="150" fill="#64748b" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" opacity="0.7">Kharghar Station Rd</text>
                    <text x="360" y="70" fill="#64748b" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" opacity="0.7">Parsik Hill Rd</text>
                    <text x="120" y="25" fill="#64748b" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" opacity="0.7">Sion-Panvel Highway</text>

                    {/* GPS Navigation Route Track casing */}
                    <path 
                      d="M 90,130 C 120,130 130,130 150,130 C 180,130 190,90 220,90 L 320,90 C 350,90 370,50 400,50 L 450,50" 
                      fill="none" 
                      stroke={travel.isPeak ? '#fef3c7' : '#d1fae5'} 
                      strokeWidth="10" 
                      strokeLinecap="round"
                    />

                    {/* GPS Route Line background path */}
                    <path 
                      d="M 90,130 C 120,130 130,130 150,130 C 180,130 190,90 220,90 L 320,90 C 350,90 370,50 400,50 L 450,50" 
                      fill="none" 
                      stroke={travel.isPeak ? '#f59e0b' : '#10b981'} 
                      strokeWidth="5.5" 
                      strokeLinecap="round"
                    />

                    {/* GPS Route Line animating dash path */}
                    <path 
                      d="M 90,130 C 120,130 130,130 150,130 C 180,130 190,90 220,90 L 320,90 C 350,90 370,50 400,50 L 450,50" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                      strokeDasharray="6 6"
                      style={{ animation: 'dash 12s linear infinite' }}
                    />
                  </svg>

                  
                  {/* Home Node */}
                  <div className="absolute left-[15%] top-[65%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-teal-600 border border-white flex items-center justify-center shadow text-white">
                      <Home className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[8px] font-bold text-text-dark bg-white/95 px-1 py-0.2 rounded shadow mt-1 border border-slate-100">Home (Kharghar)</span>
                  </div>

                  {/* Hospital Node */}
                  <div className="absolute left-[75%] top-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-teal border-2 border-white flex items-center justify-center shadow text-white animate-pulse">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-[8px] font-bold text-primary-teal bg-white/95 px-1.5 py-0.2 rounded shadow mt-1 border border-teal-100">Apollo Hospital</span>
                  </div>

                  {/* Animating Car Marker along the path */}
                  <div 
                    className="absolute w-6 h-6 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-primary-teal"
                    style={{
                      animation: 'moveCar 8s ease-in-out infinite',
                    }}
                  >
                    <Car className="h-3.5 w-3.5" />
                  </div>

                  {/* Traffic Delay Float Overlay */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-sm text-left max-w-[220px]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[8.5px] font-bold text-red-600 uppercase tracking-wider font-display">Live Route Traffic</span>
                    </div>
                    <p className="text-[10px] font-semibold text-text-dark leading-tight">
                      {travel.isPeak 
                        ? 'Sion-Panvel Highway: Heavy Congestion (+15m delay)' 
                        : 'Clear flow: Normal speeds along Sion-Panvel route'}
                    </p>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm flex items-center space-x-1.5 hover:bg-slate-800 transition-colors">
                    <span className="text-[9px] font-bold text-white tracking-widest font-display">
                      {realDistanceKm.toFixed(1)} km · {travel.formattedTime}
                    </span>
                    <span className="text-[8px] font-bold text-teal-400 font-display border-l border-white/20 pl-1.5 shrink-0">MAPS ↗</span>
                  </div>
                </a>

                {/* Integrated Ride Services (Cab Facility) */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1.5">
                      <Car className="h-4.5 w-4.5 text-primary-teal" />
                      <h5 className="text-[12px] font-bold text-text-dark tracking-wider uppercase font-display">
                        INTEGRATED RIDE SERVICES
                      </h5>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Aayu Transit Partner
                    </span>
                  </div>

                  {cabBookingStatus === 'idle' && (
                    <>
                      <p className="text-[11px] text-text-light mb-3">
                        Ensure an on-time arrival. Pre-book your ride to Aayu Clinic with our transit partners:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'ubergo', name: 'Uber Go', price: '₹180', eta: '3 min away', desc: 'Standard sedan, fast response' },
                          { id: 'uberauto', name: 'Uber Auto', price: '₹110', eta: '5 min away', desc: 'Convenient 3-wheeler commute' },
                          { id: 'aayuassist', name: 'Aayu Assist Cab', price: '₹290', eta: '4 min away', desc: 'Wheelchair & oxygen assist, priority entry' }
                        ].map(opt => (
                          <div 
                            key={opt.id}
                            onClick={() => setSelectedCab(opt.id)}
                            className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                              selectedCab === opt.id 
                                ? 'border-primary-teal bg-teal-50/10' 
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${selectedCab === opt.id ? 'bg-primary-teal text-white' : 'bg-slate-100 text-slate-500'}`}>
                                <Car className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-text-dark">{opt.name}</span>
                                  <span className="text-[9.5px] font-medium text-text-light">({opt.eta})</span>
                                </div>
                                <p className="text-[10px] text-text-light mt-0.5 leading-snug">{opt.desc}</p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-primary-teal">{opt.price}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={handleBookCab}
                        className="w-full mt-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow cursor-pointer"
                      >
                        <span>Pre-book Ride with Uber &rarr;</span>
                      </button>
                    </>
                  )}

                  {cabBookingStatus === 'booking' && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center flex flex-col items-center justify-center animate-pulse">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-teal mb-2" />
                      <p className="text-xs font-bold text-text-dark">Connecting to drivers...</p>
                      <p className="text-[10px] text-text-light mt-1">Assigning the closest partner cab to your location</p>
                    </div>
                  )}

                  {cabBookingStatus === 'confirmed' && driverInfo && (
                    <div className="bg-emerald-50/45 border border-emerald-100 rounded-xl p-4.5 text-left transition-all">
                      <div className="flex items-center justify-between mb-3 border-b border-emerald-100/50 pb-2.5">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest font-display flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ride Confirmed
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Dispatched on Appointment Day
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                            {driverInfo.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-text-dark">{driverInfo.name}</span>
                              <span className="text-[10px] bg-white border border-emerald-200 px-1.5 py-0.2 rounded text-emerald-700 font-bold">{driverInfo.rating}</span>
                            </div>
                            <p className="text-[10.5px] text-text-light mt-0.5">{driverInfo.vehicle}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setCabBookingStatus('idle');
                            setDriverInfo(null);
                          }}
                          className="text-[10.5px] font-semibold text-red-600 hover:text-red-700 underline cursor-pointer"
                        >
                          Cancel Ride
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Persona Selection ── */}
          <div className="w-full bg-white border border-border-custom rounded-2xl p-5 shadow-sm text-left animate-fade-in">
            <div>
              <h2 className="font-display font-bold text-base text-text-dark tracking-tight flex items-center gap-1.5 flex-wrap">
                <span>Notification Persona</span>
                <span className="text-[9px] bg-primary-teal/10 text-primary-teal px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Risk Tuning</span>
                {authUser?.persona && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-300/50">
                    ✓ Pre-selected from your profile
                  </span>
                )}
              </h2>
              <p className="text-xs text-text-light mt-1.5">
                {authUser?.persona
                  ? "Your saved profile persona is pre-selected below. You can tune it for this specific appointment if needed."
                  : "Choose a profile that matches your schedule. This trains the ML model to optimize reminders."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mt-4">
              {personas.map((persona) => {
                const IconComponent = persona.icon;
                const isSelected = selectedPersona === persona.id;
                return (
                  <div
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona.id)}
                    className={`border rounded-xl p-4 flex items-start justify-between cursor-pointer transition-all duration-150 hover:translate-y-[-1px] ${
                      isSelected
                        ? 'border-[#0f766e] bg-white/60'
                        : 'border-[#E8ECEF] hover:border-[#0f766e]/30 bg-white'
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
            <div className="w-full bg-[#fcfdfe] border border-border-custom rounded-2xl p-5 space-y-4 shadow-[0_4px_15px_rgba(0,0,0,0.005)] text-left">
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

        </div>

        {/* RIGHT COLUMN: Summary & Confirmation (5 cols, sticky) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          
          {/* Booking Error Notice */}
          {bookingError && (
            <div className="w-full bg-white border border-amber-200/40 text-amber-900 text-xs font-semibold p-4 rounded-xl text-center leading-normal">
              {bookingError}
            </div>
          )}

          {/* ── Appointment Details summary card ── */}
          <div className="w-full bg-white border border-[#f3f4f6] rounded-2xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.015)] relative overflow-hidden text-left">
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
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                consultationMode === 'online'
                  ? 'bg-[#e0f2fe] text-[#0369a1]'
                  : 'bg-[#e6f4ea] text-[#137333]'
              }`}>
                {consultationMode === 'online' ? 'Video Consultation' : 'Pay at Clinic'}
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
                <p className="text-[10px] text-text-light">
                  {consultationMode === 'online' ? 'Video Call · Join via link' : 'Apollo Hospitals · Navi Mumbai'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Real-world Parameters Grid (Distance, Weather, Traffic) ── */}
          {/* Renders as a vertical list on desktop for high-density space-saving, and as grid on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            
            {/* 1. Distance Card — real road distance from Google Maps */}
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 flex flex-col justify-between text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#0d9488] tracking-widest uppercase font-display">Distance</span>
                  {mapsData && (
                    <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Live</span>
                  )}
                </div>
                <div className="p-1 bg-[#0d9488]/10 rounded-lg text-[#0d9488]">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
              {mapsLoading ? (
                <div className="flex items-center space-x-1.5 py-1">
                  <Loader2 className="h-3 w-3 animate-spin text-[#0d9488]" />
                  <span className="text-[10.5px] text-text-light font-bold">Fetching road data...</span>
                </div>
              ) : locationReady ? (
                <div>
                  <p className="text-lg font-extrabold text-text-dark font-display">
                    {mapsData?.distanceText ?? (realDistanceKm != null ? `${realDistanceKm.toFixed(1)} km` : 'Calculating...')}
                  </p>
                  {mapsData?.durationInTrafficText ? (
                    <p className="text-[9.5px] text-[#0d9488] font-bold mt-0.5">
                      {mapsData.durationInTrafficText} in traffic · normally {mapsData.durationText}
                    </p>
                  ) : mapsData?.durationText ? (
                    <p className="text-[9.5px] text-[#0d9488] font-bold mt-0.5">
                      ~{mapsData.durationText} drive
                    </p>
                  ) : (
                    <p className="text-[9.5px] text-[#0d9488] font-bold mt-0.5 truncate" title={closestHospital.name}>
                      to Aayu {closestHospital.city}
                    </p>
                  )}
                  {userAddress && (
                    <p className="text-[8.5px] text-text-light mt-1 truncate" title={userAddress}>
                      {userAddress.split(',').slice(0, 2).join(',')}
                    </p>
                  )}
                  {mapsData && userLat && userLon && (
                    <a
                      href={getDirectionsUrl(userLat, userLon, closestHospital.latitude, closestHospital.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[9px] font-bold text-[#0d9488] hover:underline"
                    >
                      <Navigation className="h-2.5 w-2.5" /> Get Directions
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="w-full py-1.5 bg-teal-50 hover:bg-teal-100/80 text-primary-teal text-[11px] font-bold rounded-lg border border-primary-teal/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {locationLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                  <span>Get GPS Distance</span>
                </button>
              )}
            </div>

            {/* 2. Weather Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 flex flex-col justify-between text-left">
              <div className="flex items-center justify-between mb-2">
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
                  <p className="text-lg font-extrabold text-text-dark font-display">
                    {weatherData.temperature != null ? `${weatherData.temperature}°C` : 'N/A'}
                  </p>
                  <p className="text-[10px] text-text-light mt-0.5 truncate capitalize font-medium">
                    {weatherData.description} {weatherData.willRain && '· 🌧️ Rain'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-text-medium">
                    {weatherData?.isBeyondWindow ? '5+ Days Out' : 'Unavailable'}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Traffic Card — live from Google Maps or rule-based fallback */}
            {trafficInfo ? (
              <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 flex flex-col justify-between text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold tracking-widest uppercase font-display ${
                      trafficInfo.level === 'High' ? 'text-red-500' : trafficInfo.level === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>Traffic</span>
                    {trafficInfo.isLive && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Live</span>
                    )}
                  </div>
                  <div className={`p-1 rounded-lg ${
                    trafficInfo.level === 'High' ? 'bg-red-500/10 text-red-500' : trafficInfo.level === 'Moderate' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-50/10 text-emerald-500'
                  }`}>
                    <Car className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-lg font-extrabold font-display ${
                      trafficInfo.level === 'High' ? 'text-red-600' : trafficInfo.level === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{trafficInfo.level}</span>
                  </div>
                  {trafficInfo.isLive && trafficInfo.trafficDelayMins > 0 ? (
                    <p className="text-[10px] text-red-500 mt-0.5 font-semibold">
                      +{trafficInfo.trafficDelayMins} min delay right now
                    </p>
                  ) : (
                    <p className="text-[10px] text-text-light mt-0.5 font-medium">
                      {trafficInfo.level === 'High' ? 'Allow extra buffer time' : trafficInfo.level === 'Moderate' ? 'Expected delays' : 'Clear roads'}
                    </p>
                  )}
                  {trafficInfo.isLive && trafficInfo.durationInTrafficText && (
                    <p className="text-[8.5px] text-text-light mt-1">
                      ETA: {trafficInfo.durationInTrafficText}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 flex flex-col justify-between text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-text-light tracking-widest uppercase font-display">Traffic</span>
                  <div className="p-1 bg-gray-100 rounded-lg text-text-light">
                    <Car className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs font-bold text-text-medium">Unavailable</p>
              </div>
            )}
          </div>

          {/* Enable WhatsApp Reminders Card */}
          {!authUser?.whatsappOptedIn && (
            <div className="w-full bg-white border border-border-custom rounded-2xl p-5 shadow-sm relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#25D366]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
              
              <div className="flex items-center space-x-2.5 relative">
                <div className="w-8 h-8 rounded-full bg-[#e8faf0] flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5 text-[#25D366] fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 .953 11.453.953 6.014.953 1.59 5.325 1.586 10.75c-.001 1.7.447 3.361 1.299 4.816L1.87 20.27l4.777-1.116z" />
                  </svg>
                </div>
                <h4 className="text-[13px] font-bold text-gray-900 leading-tight">
                  Instant WhatsApp Updates
                </h4>
              </div>

              <p className="text-[11.5px] text-gray-600 mt-2 leading-relaxed text-left">
                Stay updated with real-time risk notices, delay announcements, and confirmation details directly on WhatsApp.
              </p>

              <div className="bg-[#fffbeb] border border-amber-100 rounded-xl py-2 px-2.5 flex items-start space-x-1.5 mt-2.5 text-left">
                <Gift className="h-[13px] w-[13px] text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[10.5px] font-semibold text-amber-800 leading-snug">
                  Get 10% off consultation fee upon activating WhatsApp updates.
                </span>
              </div>

              <a
                href={`https://wa.me/${(DEMO_CONFIG.twilioWhatsappNumber || 'whatsapp:+17372508034').replace('whatsapp:+', '')}?text=${encodeURIComponent(DEMO_CONFIG.twilioSandboxCode || 'join twilio-trial')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all duration-200 shadow-[0_4px_12px_rgba(37,211,102,0.1)] hover:translate-y-[-1px]"
              >
                <span>Enable WhatsApp Updates &rarr;</span>
              </a>
            </div>
          )}

          {/* Dynamic Incentive Model: Rescheduling Offer Banner */}
          {((predictionRisk?.risk_score >= 70 || isSimulatedHighRisk) && !incentiveClaimed) && (
            <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4.5 text-left relative overflow-hidden shadow-sm animate-pulse-glow-amber">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex items-start space-x-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shrink-0 mt-0.5">
                  <Gift className="h-4.5 w-4.5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider font-display">
                    High No-Show Risk / High-Demand Offer
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed mt-1 font-medium">
                    ML analysis predicts high travel friction ({realDistanceKm?.toFixed(1) || '38'} km) and rain. Reschedule early to free this slot for local walk-in patients and claim your **Priority Access Token + 15% Diagnostic Voucher**!
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClaimRescheduleIncentive}
                disabled={processing}
                className="w-full mt-3.5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-amber-500/15 cursor-pointer hover:from-amber-600 hover:to-amber-700"
              >
                <span>Claim Reward & Reschedule &rarr;</span>
              </button>
            </div>
          )}

          {/* Dynamic Progress Indicator */}
          {processing && (
            <div className="bg-[#FAFBFB] border border-[#E5E7EB] rounded-[8px] p-3 text-left space-y-1.5 mb-3 transition-all duration-150">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0f766e]" />
                <span className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider">Processing OPD Booking</span>
              </div>
              <p className="text-[11px] text-[#475569] font-mono leading-tight">
                &gt; {loadingStep || 'Initializing secure request...'}
              </p>
            </div>
          )}

          {/* Confirm Booking Button */}
          <button
            onClick={handleDone}
            disabled={processing}
            className={`w-full py-3.5 rounded-[6px] font-semibold text-sm text-center flex items-center justify-center space-x-2 transition-all duration-150 ${
              processing
                ? 'bg-gray-100 text-[#9ca3af] cursor-not-allowed'
                : 'bg-[#0f766e] text-white hover:bg-[#0d5a54] cursor-pointer shadow-2xs'
            }`}
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span>Confirm Booking &rarr;</span>
            )}
          </button>

        </div>

      </div>

      {/* Priority Token Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6.5 max-w-[420px] w-full text-center shadow-2xl relative overflow-hidden animate-fade-in text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <button
              onClick={() => {
                setShowRewardModal(false);
                navigate('/doctors'); // Navigate back to list so they can reschedule
              }}
              className="absolute right-4.5 top-4.5 p-1 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full text-amber-600 mb-4 shrink-0 animate-bounce mx-auto">
              <Gift className="h-7 w-7" />
            </div>

            <h2 className="font-display font-extrabold text-xl text-slate-800 tracking-tight text-center">
              Incentive Reward Claimed!
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-[320px] mx-auto text-center">
              Thank you for releasing your high-demand slot early. Your priority token has been added to your account settings.
            </p>

            {/* Golden Skeuomorphic Card */}
            <div className="relative w-full max-w-[340px] aspect-[1.586/1] mx-auto my-6 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-200 to-yellow-600 text-slate-900 p-5 shadow-lg border border-amber-300 overflow-hidden flex flex-col justify-between select-none">
              {/* Card shimmer */}
              <div 
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#78350f 1px, transparent 1px)',
                  backgroundSize: '12px 12px'
                }}
              />
              
              <div className="flex justify-between items-start relative z-10 text-left">
                <div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4 text-amber-900" />
                    <span className="text-[8px] font-black tracking-widest uppercase font-display text-amber-950">Aayu Priority</span>
                  </div>
                  <h4 className="text-[10px] font-black text-amber-950 mt-0.5 tracking-tight font-display">OPD Priority Access Token</h4>
                </div>
                <div className="px-2 py-0.5 bg-amber-950 text-amber-200 text-[8px] font-black uppercase rounded tracking-wider border border-amber-700">
                  15% Off
                </div>
              </div>

              <div className="text-left mt-3 relative z-10">
                <p className="text-[7.5px] text-amber-900 uppercase tracking-widest font-extrabold">Token Code</p>
                <p className="font-mono text-sm font-black tracking-widest text-amber-950 mt-0.5">{generatedTokenCode}</p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-amber-950/10 relative z-10 text-left">
                <div>
                  <p className="text-[7.5px] text-amber-950 uppercase tracking-widest font-extrabold">Token Holder</p>
                  <p className="text-[10px] font-bold text-amber-900 mt-0.5">{authUser?.name}</p>
                </div>
                <div className="flex items-center space-x-1 bg-amber-950/15 border border-amber-950/20 px-2 py-0.5 rounded-full shrink-0">
                  <span className="h-1 w-1 rounded-full bg-amber-800 animate-pulse"></span>
                  <span className="text-[7.5px] font-extrabold uppercase text-amber-950 tracking-wider">Active Status</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowRewardModal(false);
                navigate('/doctors');
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
            >
              Search New Appointments
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
