import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Briefcase,
  Heart,
  GraduationCap,
  Clock,
  HelpCircle,
  Check,
  Loader2,
  Bell,
  Shield,
  Phone,
  Gift,
  Sparkles,
  MessageSquare,
  Calendar,
  X,
  User,
  Mail,
  MapPin,
  Droplet,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_CONFIG } from '../utils/demoConfig';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { formatPatientId, formatPatientPhone, validatePatientData } from '../utils/dataFormat';
import { useAuth } from '../hooks/useAuth';
import { triggerPatientRegistrationDemo } from '../utils/demoTriggers';
import BrandLogo from '../components/BrandLogo';
import LoginVideoShowcase from '../components/LoginVideoShowcase';
import VideoDemoModal from '../components/VideoDemoModal';
import IndianMedicalTeamShowcase from '../components/IndianMedicalTeamShowcase';

export default function PatientLogin() {
  const navigate = useNavigate();
  const { loginMockUser, loginGoogleUser, updateMockSession, signOutUser, user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Auto-request location permission on login screen mount to preload GPS coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            updatedAt: Date.now()
          };
          localStorage.setItem('user_gps_coords', JSON.stringify(coords));
          console.log('[Login Geolocation] Saved user coordinates:', coords);
        },
        (err) => {
          console.warn('[Login Geolocation] Could not get location on login:', err.message);
        }
      );
    }
  }, []);

  // Step state: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState(1);
  const [isGoogleOnboarding, setIsGoogleOnboarding] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [otpSentAt, setOtpSentAt] = useState(null);
  
  // Profile fields (Step 3)
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [email, setEmail] = useState('');

  // Step 4 Preferences
  const [abhaId, setAbhaId] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [caretakerName, setCaretakerName] = useState('');
  const [caretakerPhone, setCaretakerPhone] = useState('');
  const [caretakerRelation, setCaretakerRelation] = useState('Son/Daughter');

  // Input states & Focus highlights
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [isSubmittedStep3, setIsSubmittedStep3] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Error messages
  const [step1Error, setStep1Error] = useState('');
  const [step2Error, setStep2Error] = useState('');
  const [step3Error, setStep3Error] = useState('');

  // Seeding simulation states
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [whatsappOptInStep1, setWhatsappOptInStep1] = useState(true);

  // Tooltip hover state
  const [showAbhaTooltip, setShowAbhaTooltip] = useState(false);

  // Refs for OTP
  const otpInputsRef = useRef([]);

  // Countdown timer for OTP - resilient to tab switching/backgrounding
  useEffect(() => {
    let interval = null;
    if (currentStep === 2 && otpSentAt) {
      // Run once immediately
      const elapsed = Math.floor((Date.now() - otpSentAt) / 1000);
      setResendTimer(Math.max(0, 30 - elapsed));

      interval = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - otpSentAt) / 1000);
        const remaining = Math.max(0, 30 - currentElapsed);
        setResendTimer(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [currentStep, otpSentAt]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && authUser) {
      const hasCompleteProfile = Boolean(
        authUser.name &&
        authUser.name.trim() !== '' &&
        authUser.age &&
        authUser.gender
      );

      if (authUser.isNew || !hasCompleteProfile) {
        if (!authUser.phone) {
          setCurrentStep(1);
        } else if (!authUser.age || !authUser.gender || !authUser.name) {
          if (authUser.name) setFullName(authUser.name);
          if (authUser.age) setAge(String(authUser.age));
          if (authUser.gender) setGender(authUser.gender);
          if (authUser.city) setCity(authUser.city);
          if (authUser.bloodGroup) setBloodGroup(authUser.bloodGroup);
          if (authUser.email) setEmail(authUser.email);
          setCurrentStep(3);
        } else {
          setCurrentStep(4);
        }
      } else {
        navigate('/home');
      }
    }
  }, [isAuthenticated, authUser, navigate]);

  const handleUseDifferentNumber = async () => {
    setLoading(true);
    try {
      if (signOutUser) {
        await signOutUser();
      }
    } catch (e) {
      console.warn("signOutUser failed:", e);
    }
    setPhoneNumber('');
    setOtp(['', '', '', '', '', '']);
    setStep1Error('');
    setStep2Error('');
    setStep3Error('');
    setCurrentStep(1);
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        <Loader2 className="h-10 w-10 text-primary-teal animate-spin" />
        <p className="text-xs text-text-light mt-3 font-medium">Checking authentication state...</p>
      </div>
    );
  }


  // Phone input formatting: XXXXX XXXXX
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, ''); // digits only
    if (rawVal.length <= 10) {
      let formatted = rawVal;
      if (rawVal.length > 5) {
        formatted = `${rawVal.slice(0, 5)} ${rawVal.slice(5)}`;
      }
      setPhoneNumber(formatted);
    }
  };

  const getRawPhoneNumber = () => phoneNumber.replace(/\s/g, '');

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (getRawPhoneNumber().length !== 10) return;

    setStep1Error('');
    setLoading(true);

    // Simulate network delay for SMS dispatch
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setShowToast(true);
      setLoading(false);
      setCurrentStep(2);
      setOtpSentAt(Date.now());
      setResendTimer(30);

      // Auto-hide push alert after 8 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 8000);
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setStep1Error('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      let loggedUser = await loginGoogleUser(googleUser);

      // Store optimistic opt-in inside Firestore immediately if they had it checked
      if (whatsappOptInStep1 && loggedUser) {
        const userRef = doc(db, COLLECTIONS.PATIENTS, loggedUser.uid);
        await updateDoc(userRef, {
          whatsappOptedIn: true,
          "preferences.whatsapp": true,
          updatedAt: serverTimestamp()
        }).catch(err => console.log("Failed to update whatsappOptedIn for Google user:", err));
        
        updateMockSession({
          whatsappOptedIn: true,
          preferences: {
            ...loggedUser.preferences,
            whatsapp: true
          }
        });
      }

      const hasCompleteProfile = Boolean(
        loggedUser &&
        loggedUser.name &&
        loggedUser.name.trim() !== '' &&
        loggedUser.age &&
        loggedUser.gender
      );

      if (!loggedUser.isNew && hasCompleteProfile) {
        navigate('/home');
      } else {
        if (loggedUser?.name) setFullName(loggedUser.name);
        if (loggedUser?.age) setAge(String(loggedUser.age));
        if (loggedUser?.gender) setGender(loggedUser.gender);
        if (loggedUser?.city) setCity(loggedUser.city);
        if (loggedUser?.bloodGroup) setBloodGroup(loggedUser.bloodGroup);
        if (loggedUser?.email) setEmail(loggedUser.email);
        setIsGoogleOnboarding(true);
        setCurrentStep(3);
      }
    } catch (err) {
      console.error("[Google Sign-In] Error:", err);
      setStep1Error('Google Sign-In failed or was closed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP inputs handling
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length >= 6) {
      const newOtp = pastedData.slice(0, 6).split('');
      setOtp(newOtp);
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    setStep2Error('');

    if (otpCode !== generatedOtp) {
      setStep2Error('Incorrect OTP. Please check and try again');
      return;
    }

    // Direct, synchronous window.open with actual WhatsApp target URL on valid OTP user click
    if (whatsappOptInStep1) {
      const sandboxCode = DEMO_CONFIG.twilioSandboxCode || 'just-noise';
      const whatsappUrl = `https://wa.me/14155238886?text=${encodeURIComponent('join ' + sandboxCode)}`;
      try {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn("Direct WhatsApp redirection failed:", err);
      }
    }

    setLoading(true);

    try {
      const formattedPhone = `+91${getRawPhoneNumber()}`;
      let loggedUser = null;

      if (isGoogleOnboarding) {
        // Link verified phone number to the current Google authUser session
        updateMockSession({ phone: formattedPhone });
        loggedUser = {
          ...authUser,
          phone: formattedPhone,
          isNew: true
        };
      } else {
        loggedUser = await loginMockUser(formattedPhone);
      }

      // Store optimistic opt-in inside Firestore immediately if they had it checked
      if (whatsappOptInStep1) {
        if (loggedUser) {
          // Update opt-in status in Firestore
          const userRef = doc(db, COLLECTIONS.PATIENTS, loggedUser.uid);
          await updateDoc(userRef, {
            whatsappOptedIn: true,
            "preferences.whatsapp": true,
            updatedAt: serverTimestamp()
          }).catch(err => console.log("Failed to update whatsappOptedIn for user:", err));
          
          updateMockSession({
            whatsappOptedIn: true,
            preferences: {
              ...loggedUser.preferences,
              whatsapp: true
            }
          });
        }
      }

      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        const hasCompleteProfile = Boolean(
          loggedUser &&
          loggedUser.name &&
          loggedUser.name.trim() !== '' &&
          loggedUser.age &&
          loggedUser.gender
        );

        if (loggedUser && !loggedUser.isNew && hasCompleteProfile) {
          navigate('/home');
        } else {
          if (loggedUser?.name) setFullName(loggedUser.name);
          if (loggedUser?.age) setAge(String(loggedUser.age));
          if (loggedUser?.gender) setGender(loggedUser.gender);
          if (loggedUser?.city) setCity(loggedUser.city);
          if (loggedUser?.bloodGroup) setBloodGroup(loggedUser.bloodGroup);
          if (loggedUser?.email) setEmail(loggedUser.email);
          setCurrentStep(3);
        }
      }, 800);
    } catch (error) {
      console.error("OTP confirmation error:", error);
      setStep2Error('Something went wrong. Please try again');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Submissions & Validations
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittedStep3(true);
    setStep3Error('');
    
    const errors = {};
    if (!fullName.trim()) errors.fullName = 'This field is required';
    if (!age.trim()) errors.age = 'This field is required';
    if (!gender) errors.gender = 'This field is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      // authUser.uid may be transiently undefined due to React async state updates;
      // fall back to deriving the clean ID from the phone number entered at step 1.
      const uid = authUser?.uid || formatPatientId(`+91${getRawPhoneNumber()}`);
      const phone = authUser?.phone || getFormattedPhoneString();
      if (!uid) throw new Error('Unable to determine patient UID. Please restart login.');
      console.log("Creating new patient document in Firestore with UID:", uid);

      const patientDocData = {
        uid,
        name: fullName,
        phone,
        email: email || '',
        age: parseInt(age, 10),
        gender,
        city: city || '',
        bloodGroup: bloodGroup || '',
        persona: null,
        familyContactName: '',
        familyContactPhone: '',
        familyContactRelation: '',
        trustScore: 100,
        totalVisits: 0,
        totalNoShows: 0,
        whatsappOptedIn: whatsappOptInStep1,
        preferences: {
          whatsapp: whatsappOptInStep1,
          sms: false,
          voiceCall: false,
          email: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      validatePatientData(patientDocData);
      await setDoc(doc(db, COLLECTIONS.PATIENTS, uid), patientDocData);
      localStorage.removeItem('nidaan_onboarding_done');
      localStorage.removeItem('nidaan_medical_profile');
      updateMockSession(patientDocData);
      
      // Trigger Registration Demo triggers (Welcome WhatsApp and Hindi Welcome Call)
      try {
        triggerPatientRegistrationDemo(patientDocData);
      } catch (e) {
        console.error("Welcome triggers failed:", e);
      }

      setCurrentStep(4);
    } catch (error) {
      console.error("Error saving profile details:", error);
      setStep3Error('Failed to save profile details to database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSkip = async () => {
    setLoading(true);
    setStep3Error('');
    try {
      // Same UID fallback as handleProfileSubmit
      const uid = authUser?.uid || formatPatientId(`+91${getRawPhoneNumber()}`);
      const phone = authUser?.phone || getFormattedPhoneString();
      if (!uid) throw new Error('Unable to determine patient UID. Please restart login.');
      console.log("Skipping and creating default patient document in Firestore with UID:", uid);

      // Use whatever the patient typed in the name field; if blank, derive a
      // readable placeholder from their phone number (never "User")
      const resolvedName = fullName.trim() || `Patient ${phone.slice(-4)}`;

      const patientDocData = {
        uid,
        name: resolvedName,
        phone,
        email: '',
        age: 0,
        gender: '',
        city: '',
        bloodGroup: '',
        persona: null,
        familyContactName: '',
        familyContactPhone: '',
        familyContactRelation: '',
        trustScore: 100,
        totalVisits: 0,
        totalNoShows: 0,
        whatsappOptedIn: whatsappOptInStep1,
        preferences: {
          whatsapp: whatsappOptInStep1,
          sms: false,
          voiceCall: false,
          email: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      validatePatientData(patientDocData);
      await setDoc(doc(db, COLLECTIONS.PATIENTS, uid), patientDocData);
      localStorage.removeItem('nidaan_onboarding_done');
      localStorage.removeItem('nidaan_medical_profile');
      updateMockSession(patientDocData);
      
      // Trigger Registration Demo triggers (Welcome WhatsApp and Hindi Welcome Call)
      try {
        triggerPatientRegistrationDemo(patientDocData);
      } catch (e) {
        console.error("Welcome triggers failed:", e);
      }

      setCurrentStep(4);
    } catch (error) {
      console.error("Error skipping profile details:", error);
      setStep3Error('Failed to skip/save default profile to database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4 Submissions & Persona Selection
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const uid = authUser.uid;
      const updateData = {
        updatedAt: serverTimestamp()
      };

      if (abhaId.trim()) {
        updateData.abhaId = abhaId;
      }

      if (selectedPersona) {
        let dbPersona = 'default';
        if (selectedPersona === 'Professional') dbPersona = 'working_professional';
        else if (selectedPersona === 'Elderly') dbPersona = 'elderly';
        else if (selectedPersona === 'Student') dbPersona = 'student';

        updateData.persona = dbPersona;

        if (selectedPersona === 'Elderly') {
          updateData.familyContactName = caretakerName || '';
          updateData.familyContactPhone = caretakerPhone || '';
          updateData.familyContactRelation = caretakerRelation || '';
        }
      }

      await updateDoc(doc(db, COLLECTIONS.PATIENTS, uid), updateData);
      updateMockSession(updateData);
      navigate('/home');
    } catch (error) {
      console.error("Error saving persona preferences:", error);
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSkip = () => {
    navigate('/home');
  };

  // Format phone display
  const getFormattedPhoneString = () => {
    const raw = getRawPhoneNumber();
    if (raw.length === 10) {
      return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
    }
    return `+91 ${raw}`;
  };



  const isStep1Valid = getRawPhoneNumber().length === 10;
  const isStep2Valid = otp.join('').length === 6;

  // Key press listener for Enter key
  const handleKeyPress = (e, submitCallback) => {
    if (e.key === 'Enter') {
      submitCallback(e);
    }
  };

  return (
    <>
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-inter select-none overflow-hidden bg-white">
      
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      {/* Toast Notification Simulation (iOS Glassmorphic Style) */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 left-6 sm:left-auto sm:w-[390px] bg-[#0F172A] text-white p-4 rounded-[10px] shadow-elev-3 border border-[#334155] flex items-start space-x-3.5 z-50 select-none font-inter"
          >
            <div className="w-10 h-10 rounded-[8px] bg-[#0f766e] border border-[#0d9488]/40 flex items-center justify-center text-white shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>

            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-data font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Verification · SMS
                </span>
                <span className="text-[10px] text-[#64748B] font-mono-data">now</span>
              </div>

              <p className="text-xs text-[#E2E8F0] mt-1 font-medium leading-relaxed">
                Use verification code{' '}
                <span className="font-mono font-bold text-sm text-white bg-[#1E293B] px-2 py-0.5 rounded-[6px] border border-[#334155] tracking-wider">
                  {generatedOtp}
                </span>{' '}
                to sign in to Nidaan One.
              </p>
            </div>

            <button
              onClick={() => setShowToast(false)}
              className="text-white/50 hover:text-white transition-colors p-1 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Half (Doctor Consultation Photo Panel - 50% Width, Full Viewport Height) */}
      <div className="hidden lg:flex w-[50%] min-h-screen bg-gradient-to-br from-white via-white/80 to-white/40 relative flex-col justify-between p-10 xl:p-14 border-r border-[#E8ECEF]/80">


        <div className="my-auto py-6">
          <IndianMedicalTeamShowcase />
        </div>

        <div className="flex items-center justify-between text-xs text-[#3B4452] pt-4 border-t border-[#E8ECEF]/80 font-medium">
          <span>✓ ABDM & ABHA Compliant</span>
          <span>🔒 256-Bit Security</span>
          <span>Nidaan One Platform</span>
        </div>
      </div>

      {/* Right Half (Phone OTP Login Form Panel - 50% Width, Full Viewport Height) */}
      <div className="w-full lg:w-[50%] min-h-screen bg-white p-8 sm:p-12 xl:p-16 flex flex-col justify-between text-left relative overflow-y-auto">
        
        {/* Top Brand Logo Bar */}
        <div className="flex items-center justify-between w-full pb-4 border-b border-[#E8ECEF]/60">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo variant="inline" />
          </div>
          <span className="text-xs font-mono-data text-[#3B4452] font-medium">PATIENT PORTAL</span>
        </div>

        {/* Card Body - Vertically & Horizontally Centered */}
        <div className="my-auto py-8 w-full max-w-md mx-auto flex flex-col justify-center font-inter">
          
          {/* STEP 1: PHONE NUMBER INPUT */}
          {currentStep === 1 && (
            <div className="flex flex-col">
              {/* Logo block / Banner */}
              <div className="relative w-full bg-[#F8FAFC] rounded-[10px] h-[72px] flex items-center justify-center border border-[#E2E8F0] lg:hidden mb-4">
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-[6px] border border-[#E2E8F0]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0d9488]"></span>
                  </span>
                  <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider">Connected</span>
                </div>
                <BrandLogo variant="inline" height={28} />
              </div>

              {/* Brand heading */}
              <div className="mt-4 text-center lg:hidden font-sans">
                <h2 className="font-sans font-black text-xl text-[#0F172A] tracking-tight leading-none">
                  Nidaan One
                </h2>
                <p className="text-xs text-[#64748B] tracking-wide mt-1 select-none font-semibold">
                  Operations Intelligence Platform
                </p>
              </div>

              {/* Headings */}
              <div className="mt-6 text-left font-sans">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                  Access your <span className="text-[#0f766e]">patient portal.</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed font-medium">
                  Enter your mobile number to coordinate check-ins, access reports, and manage schedule alerts.
                </p>
              </div>

              {/* Phone Form Input */}
              <div className="mt-6 text-left font-inter">
                <label className="font-sans text-[13px] font-semibold text-[#0F172A] mb-1.5 block">
                  Mobile number
                </label>
                <div
                  className="flex rounded-[8px] overflow-hidden border border-[#E2E8F0] focus-within:border-[#0f766e] focus-within:shadow-[0_0_0_2px_rgba(15,118,110,0.15)] bg-white transition-all duration-150"
                >
                  <span className="bg-white/80 border-r border-[#E2E8F0] text-[#0F172A] text-[14px] font-bold px-3.5 h-[48px] flex items-center select-none shrink-0 font-mono-data">
                    +91
                  </span>
                  <div className="flex items-center flex-1 px-3 space-x-2">
                    <Phone className="h-4 w-4 text-[#0f766e] shrink-0" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                      onKeyDown={(e) => handleKeyPress(e, handlePhoneSubmit)}
                      className="bg-transparent border-none outline-none w-full h-[48px] text-sm text-[#0F172A] placeholder-[#94A3B8] p-0 font-medium font-sans"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1.5 text-left font-sans">
                  We'll send a 6-digit verification code to your phone
                </p>
                {step1Error && (
                  <p className="text-xs text-[#E11D48] mt-2 font-semibold font-sans">{step1Error}</p>
                )}
              </div>

              {/* Bespoke WhatsApp Consent Card (Zero AI-tells) */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4 mt-5 mb-5 flex items-start gap-3 transition-all font-sans">
                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => setWhatsappOptInStep1(!whatsappOptInStep1)}
                  className={`h-5 w-5 rounded-[4px] border flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer mt-0.5 ${
                    whatsappOptInStep1
                      ? 'border-[#0f766e] bg-[#0f766e] text-white'
                      : 'border-[#E2E8F0] bg-white'
                  }`}
                >
                  {whatsappOptInStep1 && <Check className="h-3.5 w-3.5 stroke-[3.5]" />}
                </button>

                <div className="flex-1 text-left">
                  <span className="text-xs font-bold text-[#0F172A] block">
                    Receive WhatsApp Appointment Updates
                  </span>
                  <p className="text-[11.5px] text-[#475569] mt-0.5 leading-relaxed font-medium">
                    Get instant slot confirmations, localized delay alerts & waitlist recovery nudges directly on WhatsApp.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handlePhoneSubmit}
                disabled={!isStep1Valid || loading}
                className={`group w-full h-[48px] rounded-[6px] font-bold text-[14px] flex items-center justify-center space-x-1.5 transition-all duration-150 ${
                  isStep1Valid && !loading
                    ? 'bg-[#0f766e] text-white hover:bg-[#0d5a54] cursor-pointer shadow-sm'
                    : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed shadow-none'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-[16px] w-[16px] transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              {/* Divider for Social Login */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-[#f3f4f6]"></div>
                <span className="px-3 text-[11px] text-gray-400 font-bold uppercase tracking-wider">or</span>
                <div className="flex-1 border-t border-[#f3f4f6]"></div>
              </div>

              {/* Sign in with Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 bg-white border border-slate-200 hover:border-slate-350 text-[#1f2937] text-[14px] font-bold rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow-sm cursor-pointer active:scale-98"
              >
                <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.13-1.12 3.01.95.63 1.93 1.22 2.92 1.77 1.83-1.69 2.92-4.17 2.92-6.63z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91L17.04 19.3c-1.1.74-2.5 1.18-5.04 1.18-3.88 0-7.16-2.63-8.33-6.18H.58v2.79C2.56 20.89 7.02 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.67 14.3c-.3-.89-.47-1.84-.47-2.8s.17-1.91.47-2.8V5.91H.58C-.2 7.45-.7 9.25-.7 11.5s.5 4.05 1.28 5.59l2.79-2.79z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.02 0 2.56 3.11.58 6.91l3.09 3.09c1.17-3.55 4.45-6.18 8.33-6.18z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>

              {/* Divider & Agreements */}
              <div className="mt-5 border-t border-[#f3f4f6] pt-4 text-center">
                <p className="text-[12px] text-[#9ca3af] leading-relaxed">
                  By continuing, you agree to our{' '}
                  <a href="#" className="underline text-[#0d9488] hover:text-[#0b332e] font-semibold">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="underline text-[#0d9488] hover:text-[#0b332e] font-semibold">Privacy Policy</a>
                </p>
              </div>

              {/* Footer Links */}
              <div className="mt-6 border-t border-[#f3f4f6] pt-4 text-center">
                <p className="text-[14px] text-[#6b7280]">
                  Are you hospital staff?{' '}
                  <a
                    href="http://localhost:5178/staff/login"
                    className="text-[#0d9488] font-extrabold hover:underline inline-block ml-0.5"
                  >
                    Login here &rarr;
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {currentStep === 2 && !showSuccessAnimation && (
            <div className="flex flex-col my-auto py-4 font-sans text-left">
              {/* Logo block / Banner for Mobile */}
              <div className="relative w-full bg-white rounded-[10px] h-[80px] flex items-center justify-center border border-[#E2E8F0] lg:hidden mb-4">
                <div className="w-11 h-11 rounded-full bg-[#0f766e] flex items-center justify-center shrink-0 text-white font-bold text-[18px] shadow-sm select-none">
                  C
                </div>
              </div>

              {/* Headings */}
              <div className="text-center font-sans">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Verify your number
                </h1>
                <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                  We sent a 6-digit code to{' '}
                  <span className="font-bold text-[#0F172A]">{getFormattedPhoneString()}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setOtp(['', '', '', '', '', '']);
                      setStep2Error('');
                    }}
                    className="text-[#0f766e] font-extrabold hover:underline inline ml-2 text-xs uppercase tracking-wider"
                  >
                    Edit
                  </button>
                </p>
              </div>

              {/* OTP Input grid */}
              <div className="mt-8 flex justify-center gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-[56px] border-2 border-[#E2E8F0] rounded-[8px] text-center font-mono-data font-bold text-[24px] text-[#0F172A] bg-white focus:outline-none focus:border-[#0f766e] focus:shadow-[0_0_0_2px_rgba(15,118,110,0.15)] transition-all duration-150"
                  />
                ))}
              </div>
              {step2Error && (
                <p className="text-xs text-[#E11D48] mt-3 font-semibold text-center">{step2Error}</p>
              )}

              {/* CTA VERIFY BUTTON */}
              <button
                type="button"
                onClick={handleOtpSubmit}
                disabled={loading}
                className="w-full h-[52px] rounded-[6px] font-bold text-sm bg-[#0f766e] hover:bg-[#0d5a54] text-white shadow-sm flex items-center justify-center space-x-2 transition-all duration-150 mt-8 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Resend info */}
              <div className="mt-6 text-center text-xs text-[#475569]">
                <p>
                  Didn't receive the code?{' '}
                  {resendTimer > 0 ? (
                    <span className="text-[#0f766e] font-bold ml-1">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSentAt(Date.now());
                        setResendTimer(30);
                        setOtp(['', '', '', '', '', '']);
                        setStep2Error('');
                        
                        const code = Math.floor(100000 + Math.random() * 900000).toString();
                        setGeneratedOtp(code);
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 8000);
                        
                        otpInputsRef.current[0]?.focus();
                      }}
                      className="text-[#0f766e] font-extrabold hover:underline ml-1 uppercase tracking-wider text-[11px]"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 2 Success brief checkmark overlay */}
          {currentStep === 2 && showSuccessAnimation && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 rounded-full bg-white text-[#0f766e] flex items-center justify-center mb-4 shrink-0 shadow-none border border-[#0f766e]/10">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <h3 className="font-sans font-bold text-base text-[#0F172A]">
                Number Verified
              </h3>
            </div>
          )}

          {/* STEP 3: PROFILE SETUP (New Users Only) */}
          {currentStep === 3 && (
            <div className="flex flex-col font-sans">
              {/* Header */}
              <div className="text-center font-sans">
                <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  Setup your patient profile
                </h1>
                <p className="text-xs sm:text-sm text-[#475569] mt-1.5 font-medium">
                  Help us personalize your experience
                </p>
              </div>

              {/* Step indicator dots */}
              <div className="mt-4 flex items-center justify-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e]"></span>
                <span className="w-1.5 h-1.5 rounded-full border border-[#E2E8F0] bg-white"></span>
                <span className="w-1.5 h-1.5 rounded-full border border-[#E2E8F0] bg-white"></span>
              </div>

              {/* Fields Stack */}
              <div className="mt-6 space-y-4 text-left font-sans">
                
                {/* Field 1: Name */}
                <div className="relative">
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                    Full name *
                  </label>
                  <div className={`relative flex items-center bg-white/40 border rounded-[6px] px-3.5 focus-within:border-[#0f766e] focus-within:shadow-[0_0_0_2px_rgba(15,118,110,0.15)] transition-all duration-150 ${
                    isSubmittedStep3 && !fullName.trim() ? 'border-[#E11D48]' : 'border-[#E2E8F0]'
                  }`}>
                    <User className="h-4 w-4 text-[#475569] mr-2.5 shrink-0" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Priya Sharma"
                      className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#0F172A] placeholder-[#94A3B8] p-0 font-semibold font-sans"
                    />
                  </div>
                  {isSubmittedStep3 && !fullName.trim() && (
                    <p className="text-xs text-[#E11D48] mt-1">This field is required</p>
                  )}
                </div>

                {/* Grid Row: Age & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Field 2: Age */}
                  <div className="relative">
                    <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                      Age *
                    </label>
                    <div className={`relative flex items-center bg-white/40 border rounded-[6px] px-3.5 focus-within:border-[#0f766e] focus-within:shadow-[0_0_0_2px_rgba(15,118,110,0.15)] transition-all duration-150 ${
                      isSubmittedStep3 && !age.trim() ? 'border-[#E11D48]' : 'border-[#E2E8F0]'
                    }`}>
                      <span className="text-sm font-semibold text-[#475569] mr-2 shrink-0 select-none">#</span>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="28"
                        className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#0F172A] placeholder-[#94A3B8] p-0 font-semibold font-sans"
                      />
                    </div>
                    {isSubmittedStep3 && !age.trim() && (
                      <p className="text-xs text-[#E11D48] mt-1">This field is required</p>
                    )}
                  </div>

                  {/* Field 3: Gender */}
                  <div className="relative">
                    <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                      Gender *
                    </label>
                    <div className="flex bg-white border border-[#E2E8F0] rounded-[6px] p-1 h-[46px] items-center">
                      {['Male', 'Female', 'Other'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setGender(option)}
                          className={`flex-1 h-full rounded-[4px] text-[11px] font-bold transition-all duration-150 ${
                            gender === option
                              ? 'bg-[#0f766e] text-white shadow-sm'
                              : 'text-[#475569] hover:text-[#0F172A]'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {isSubmittedStep3 && !gender && (
                      <p className="text-xs text-[#E11D48] mt-1">This field is required</p>
                    )}
                  </div>
                </div>

                {/* Grid Row: City & Blood Group */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Field 4: City */}
                  <div className="relative">
                    <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                      City
                    </label>
                    <div className="relative flex items-center bg-white/40 border border-[#E2E8F0] rounded-[6px] px-3.5 focus-within:border-[#0f766e] focus-within:shadow-[0_0_0_2px_rgba(15,118,110,0.15)] transition-all duration-150">
                      <MapPin className="h-4 w-4 text-[#475569] mr-2.5 shrink-0" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Hyderabad"
                        className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#0F172A] placeholder-[#94A3B8] p-0 font-semibold font-sans"
                      />
                    </div>
                  </div>

                  {/* Field 5: Blood Group */}
                  <div className="relative">
                    <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                      Blood group
                    </label>
                    <div className="relative flex items-center bg-white/40 border border-[#E2E8F0] rounded-[6px] px-3.5 focus-within:border-[#0f766e] focus-within:shadow-[0_0_0_2px_rgba(15,118,110,0.15)] transition-all duration-150">
                      <Droplet className="h-4 w-4 text-[#e11d48] mr-2.5 shrink-0" />
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#0F172A] focus:ring-0 cursor-pointer p-0 font-semibold font-sans"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Field 6: Email */}
                <div className="relative">
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                    Email address (optional)
                  </label>
                  <div className="relative flex items-center bg-white/40 border border-[#E2E8F0] rounded-[6px] px-3.5 focus-within:border-[#0f766e] focus-within:shadow-[0_0_0_2px_rgba(15,118,110,0.15)] transition-all duration-150">
                    <Mail className="h-4 w-4 text-[#475569] mr-2.5 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="priya@example.com"
                      className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#0F172A] placeholder-[#94A3B8] p-0 font-semibold font-sans"
                    />
                  </div>
                </div>
              </div>

              {step3Error && (
                <p className="text-xs text-[#E11D48] mt-4 font-medium text-center">{step3Error}</p>
              )}

              {/* CTAs */}
              <div className="mt-8 space-y-3 text-center">
                <button
                  onClick={handleProfileSubmit}
                  disabled={loading}
                  className="w-full h-11 bg-[#0f766e] text-white hover:bg-[#0d5a54] font-bold text-xs rounded-[6px] flex items-center justify-center space-x-1.5 transition-colors duration-150"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleProfileSkip}
                  disabled={loading}
                  className="text-xs font-bold text-[#64748b] hover:text-[#0F172A] transition-colors block w-full text-center"
                >
                  {loading ? 'Processing...' : 'Skip for now →'}
                </button>

                <button
                  type="button"
                  onClick={handleUseDifferentNumber}
                  disabled={loading}
                  className="text-xs font-extrabold text-[#0f766e] hover:underline transition-colors block w-full text-center pt-1"
                >
                  ← Use a different phone number
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ABHA ID + PERSONA SELECTION */}
          {currentStep === 4 && (
            <div className="flex flex-col font-sans">
              {/* Logo block */}
              <div className="flex flex-col items-center lg:hidden">
                <div className="w-10 h-10 rounded-full bg-[#0f766e] flex items-center justify-center shrink-0 text-white font-bold text-[16px]">
                  N
                </div>
                <h2 className="font-sans font-extrabold text-[18px] text-[#0f766e] tracking-tight mt-2.5">
                  Nidaan One
                </h2>
              </div>

              {/* Headings */}
              <div className="mt-6 text-center">
                <h1 className="text-xl font-bold text-[#0F172A]">Almost done!</h1>
                <p className="text-xs text-[#64748B] mt-1 font-medium">
                  Two quick preferences to set up
                </p>
              </div>

              {/* Form Container */}
              <div className="mt-6 space-y-6">
                
                {/* Part A: ABHA ID */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4">
                  <div className="flex justify-between items-center relative">
                    <span className="text-sm font-semibold text-[#0F172A] flex items-center space-x-1">
                      <span>ABHA Health ID</span>
                      
                      {/* Tooltip trigger */}
                      <span
                        className="relative cursor-help"
                        onMouseEnter={() => setShowAbhaTooltip(true)}
                        onMouseLeave={() => setShowAbhaTooltip(false)}
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-[#94A3B8] hover:text-[#64748B] transition-colors" />
                        
                        {/* Hover Tooltip Box */}
                        {showAbhaTooltip && (
                          <span className="absolute left-[-80px] bottom-6 z-40 bg-[#0f172a] text-white text-[10px] rounded-lg p-2.5 w-[200px] leading-relaxed shadow-lg font-normal block">
                            Your 14-digit ABHA ID from Ayushman Bharat. Get one at abdm.gov.in
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-[11px] text-[#94A3B8] italic font-semibold">Optional</span>
                  </div>
                  
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Link your Ayushman Bharat Digital Health Account for seamless health records across hospitals.
                  </p>

                  <input
                    type="text"
                    placeholder="XX-XXXX-XXXX-XXXX"
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[6px] bg-white focus:outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10 mt-3 text-sm text-[#0F172A] font-semibold"
                  />
                </div>

                {/* Part B: Reminder Persona */}
                <div>
                  <label className="block text-sm font-bold text-[#0F172A]">
                    How should we remind you?
                  </label>
                  <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                    This helps us send the right reminder at the right time.
                  </p>

                  {/* Option Rows */}
                  <div className="space-y-2 mt-3.5">
                    
                    {/* Option 1: Working Professional */}
                    <div
                      onClick={() => setSelectedPersona('Professional')}
                      className={`border rounded-[10px] p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 ${
                        selectedPersona === 'Professional'
                          ? 'border-[#0f766e] bg-[#f0fdfa]'
                          : 'border-[#E2E8F0] hover:border-[#cbd5e1] bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-blue-50/50 text-blue-600 shrink-0">
                          <Briefcase className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0F172A]">Working Professional</p>
                          <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug font-medium">I need 48 hours to plan leave from work</p>
                          <p className="text-[10px] text-[#94A3B8] mt-1 font-semibold">Reminders: 48h · 24h · morning</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPersona === 'Professional' ? 'border-[#0f766e]' : 'border-[#cbd5e1]'
                        }`}>
                          {selectedPersona === 'Professional' && <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]"></span>}
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Elderly / Need Help */}
                    <div
                      onClick={() => setSelectedPersona('Elderly')}
                      className={`border rounded-[10px] p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 ${
                        selectedPersona === 'Elderly'
                          ? 'border-[#0f766e] bg-[#f0fdfa]'
                          : 'border-[#E2E8F0] hover:border-[#cbd5e1] bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-purple-50/50 text-purple-600 shrink-0">
                          <Heart className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0F172A]">Elderly / Need Help</p>
                          <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug font-medium">A family member will bring me to the appointment</p>
                          <p className="text-[10px] text-[#94A3B8] mt-1 font-semibold">Reminders: 48h (+ family) · 24h (family) · 3h</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPersona === 'Elderly' ? 'border-[#0f766e]' : 'border-[#cbd5e1]'
                        }`}>
                          {selectedPersona === 'Elderly' && <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]"></span>}
                        </div>
                      </div>
                    </div>

                    {/* Option 3: Student */}
                    <div
                      onClick={() => setSelectedPersona('Student')}
                      className={`border rounded-[10px] p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 ${
                        selectedPersona === 'Student'
                          ? 'border-[#0f766e] bg-[#f0fdfa]'
                          : 'border-[#E2E8F0] hover:border-[#cbd5e1] bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-orange-50/50 text-orange-600 shrink-0">
                          <GraduationCap className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0F172A]">Student</p>
                          <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug font-medium">Just remind me the day before</p>
                          <p className="text-[10px] text-[#94A3B8] mt-1 font-semibold">Reminders: 24h · 1h before</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPersona === 'Student' ? 'border-[#0f766e]' : 'border-[#cbd5e1]'
                        }`}>
                          {selectedPersona === 'Student' && <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]"></span>}
                        </div>
                      </div>
                    </div>

                    {/* Option 4: Other / Standard */}
                    <div
                      onClick={() => setSelectedPersona('Other')}
                      className={`border rounded-[10px] p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 ${
                        selectedPersona === 'Other'
                          ? 'border-[#0f766e] bg-[#f0fdfa]'
                          : 'border-[#E2E8F0] hover:border-[#cbd5e1] bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-gray-50/50 text-gray-500 shrink-0">
                          <Clock className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0F172A]">Other</p>
                          <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug font-medium">Standard reminders only</p>
                          <p className="text-[10px] text-[#94A3B8] mt-1 font-semibold">Reminders: 24h · 2h before</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPersona === 'Other' ? 'border-[#0f766e]' : 'border-[#cbd5e1]'
                        }`}>
                          {selectedPersona === 'Other' && <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]"></span>}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Sub-form: Family member details (Displayed only when Elderly is selected) */}
                {selectedPersona === 'Elderly' && (
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4 space-y-3">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#0F172A] leading-none">
                        Family member details
                      </h4>
                      <p className="text-xs text-[#64748B] mt-1 font-medium">
                        We'll send reminders to this relative as well.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Family member name"
                        value={caretakerName}
                        onChange={(e) => setCaretakerName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E2E8F0] bg-white rounded-[6px] focus:outline-none focus:border-[#0f766e]"
                      />
                      <input
                        type="text"
                        placeholder="Family member phone"
                        value={caretakerPhone}
                        onChange={(e) => setCaretakerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E2E8F0] bg-white rounded-[6px] focus:outline-none focus:border-[#0f766e]"
                      />
                    </div>

                    <div className="text-xs">
                      <label className="block text-[#64748B] font-bold mb-1">Relationship</label>
                      <select
                        value={caretakerRelation}
                        onChange={(e) => setCaretakerRelation(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E2E8F0] bg-white rounded-[6px] focus:outline-none focus:border-[#0f766e]"
                      >
                        <option>Son/Daughter</option>
                        <option>Spouse</option>
                        <option>Sibling</option>
                        <option>Caretaker</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                )}

              </div>

              {/* CTA Buttons */}
              <div className="mt-8 space-y-3 text-center">
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="w-full h-11 bg-[#0f766e] text-white hover:bg-[#0d5a54] font-bold text-xs rounded-[6px] flex items-center justify-center space-x-1.5 transition-colors duration-150"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Start Booking</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleFinalSkip}
                  disabled={loading}
                  className="text-xs font-bold text-[#64748b] hover:text-[#0F172A] transition-colors block w-full text-center"
                >
                  Skip for now &rarr;
                </button>

                <button
                  type="button"
                  onClick={handleUseDifferentNumber}
                  disabled={loading}
                  className="text-xs font-extrabold text-[#0d9488] hover:underline transition-colors block w-full text-center pt-1"
                >
                  ← Use a different phone number
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>

    {/* Video Demo Modal */}
    <VideoDemoModal
      isOpen={showVideoModal}
      onClose={() => setShowVideoModal(false)}
      onLaunchDemo={() => {
        setShowVideoModal(false);
        navigate('/home');
      }}
    />
    </>
  );
}
