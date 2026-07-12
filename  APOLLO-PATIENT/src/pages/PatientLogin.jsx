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
  Droplet
} from 'lucide-react';
import { DEMO_CONFIG } from '../utils/demoConfig';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { formatPatientPhone, validatePatientData } from '../utils/dataFormat';
import { useAuth } from '../hooks/useAuth';
import { triggerPatientRegistrationDemo } from '../utils/demoTriggers';

export default function PatientLogin() {
  const navigate = useNavigate();
  const { loginMockUser, loginGoogleUser, updateMockSession, user: authUser, isAuthenticated, loading: authLoading } = useAuth();

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
      if (authUser.isNew) {
        if (authUser.name && authUser.name !== 'User') {
          setCurrentStep(4);
        } else {
          setCurrentStep(3);
        }
      } else {
        navigate('/home');
      }
    }
  }, [isAuthenticated, authUser, navigate]);

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
      
      console.log("[Google Sign-In] Success:", googleUser.email);
      const loggedUser = await loginGoogleUser(googleUser);
      
      if (loggedUser && !loggedUser.isNew) {
        // If they already exist in Firestore, direct to home page
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setShowSuccessAnimation(false);
          navigate('/home');
        }, 800);
      } else {
        // For new Google users, prefill step 3 details
        setFullName(googleUser.displayName || '');
        setEmail(googleUser.email || '');
        setIsGoogleOnboarding(true);
        // Move to step 1 (phone number) to link their phone number
        setCurrentStep(1);
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
    const cleanDigit = value.replace(/\D/g, '');
    if (!cleanDigit) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanDigit.substring(cleanDigit.length - 1);
    setOtp(newOtp);

    // Auto advance focus
    if (index < 5 && newOtp[index] !== '') {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (newOtp[index] === '' && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
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

    // STEP 1: Open a blank window IMMEDIATELY, synchronously, as the very first line inside the click handler
    let whatsappWindow = null;
    if (whatsappOptInStep1) {
      whatsappWindow = window.open('', '_blank');
    }

    setStep2Error('');
    setLoading(true);

    if (otpCode !== generatedOtp) {
      setStep2Error('Incorrect OTP. Please check and try again');
      setLoading(false);
      if (whatsappWindow) {
        whatsappWindow.close();
      }
      return;
    }

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
        if (loggedUser && !loggedUser.isNew) {
          // Existing user doc exists: update immediately
          const userRef = doc(db, COLLECTIONS.PATIENTS, loggedUser.uid);
          await updateDoc(userRef, {
            whatsappOptedIn: true,
            "preferences.whatsapp": true,
            updatedAt: serverTimestamp()
          }).catch(err => console.log("Failed to update whatsappOptedIn for existing user:", err));
          
          updateMockSession({
            whatsappOptedIn: true,
            preferences: {
              ...loggedUser.preferences,
              whatsapp: true
            }
          });
        }
      }

      // STEP 3: OTP verified successfully — NOW navigate the already-open blank window to the WhatsApp URL
      if (whatsappWindow && whatsappOptInStep1) {
        const sandboxCode = DEMO_CONFIG.twilioSandboxCode || 'just-noise';
        const whatsappUrl = `https://wa.me/14155238886?text=${encodeURIComponent('join ' + sandboxCode)}`;
        whatsappWindow.location.href = whatsappUrl;
      }

      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        if (loggedUser && !loggedUser.isNew) {
          navigate('/home');
        } else {
          setCurrentStep(3);
        }
      }, 800);
    } catch (error) {
      console.error("OTP confirmation error:", error);
      setStep2Error('Something went wrong. Please try again');
      if (whatsappWindow) {
        whatsappWindow.close();
      }
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
      const uid = authUser.uid;
      const phone = authUser.phone || getFormattedPhoneString();
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
      const uid = authUser.uid;
      const phone = authUser.phone || getFormattedPhoneString();
      console.log("Skipping and creating default patient document in Firestore with UID:", uid);

      const patientDocData = {
        uid,
        name: "User",
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f9fafb] font-sans select-none overflow-hidden">
      
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      {/* Toast Notification Simulation */}
      {showToast && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[360px] bg-text-dark text-white p-4 rounded-xl shadow-lg border border-gray-700/50 flex items-start space-x-3.5 z-50 animate-bounce duration-300">
          <div className="p-2 rounded-lg bg-primary-teal text-white shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-primary-teal font-display">APOLLO-SMS</p>
            <p className="text-[12px] text-gray-300 mt-1 font-medium leading-relaxed">
              Use <span className="text-white font-bold text-sm bg-primary-teal/20 px-1.5 py-0.5 rounded border border-primary-teal/30">{generatedOtp}</span> as verification code for Apollo login.
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-gray-400 hover:text-white transition-colors pt-0.5 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Left Panel (Form Section) */}
      <div className="w-full lg:w-[50%] min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 lg:p-16 bg-gradient-to-br from-[#f2fcfb] via-white to-slate-50 overflow-y-auto relative">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#1b504c_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
        
        {/* Branding Logo inside Form Panel (lg only to match mockup) */}
        <div className="hidden lg:flex absolute top-8 left-8 items-center space-x-2.5 select-none group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-teal to-[#10b981] flex items-center justify-center text-white font-bold text-[16px] shadow-md shadow-primary-teal/10 transition-transform duration-300 group-hover:rotate-12">
            A
          </div>
          <div className="text-left leading-none">
            <p className="font-display font-bold text-[15px] text-[#1b504c] tracking-tight">Apollo <span className="text-[#10b981]">OPD</span></p>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Intelligence</p>
          </div>
        </div>

        {/* Outer Card Container (Glassmorphic on all screens) */}
        <div className="w-full max-w-[430px] glass-panel border border-white/60 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] md:max-h-none glow-shadow-teal">
        
        {/* STEP PROGRESS BAR */}
        <div className="w-full h-[4px] bg-border-light absolute top-0 left-0 right-0 z-10">
          <div
            className="h-full bg-gradient-to-r from-primary-teal to-[#10b981] transition-all duration-300 ease-out"
            style={{
              width:
                currentStep === 1
                  ? '25%'
                  : currentStep === 2
                  ? '50%'
                  : currentStep === 3
                  ? '75%'
                  : '100%',
            }}
          ></div>
        </div>

        {/* Card Body - Content Swap */}
        <div className="p-6 md:p-8 overflow-y-auto">
          
          {/* STEP 1: PHONE NUMBER INPUT */}
          {currentStep === 1 && (
            <div className="flex flex-col">
              {/* Logo block / Banner */}
              <div className="relative w-full bg-[#e5f9f8] rounded-2xl h-[80px] flex items-center justify-center border border-[#d2f3f1] lg:hidden mb-4">
                {/* Live System Pulsing Green Dot Badge */}
                <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full border border-green-200 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[9px] font-semibold text-green-700 uppercase tracking-wider select-none leading-none">
                    Live System
                  </span>
                </div>

                <div className="w-11 h-11 rounded-full bg-[#1b504c] flex items-center justify-center shrink-0 text-white font-bold text-[18px] shadow-sm select-none">
                  A
                </div>
              </div>

              {/* Brand heading */}
              <div className="mt-4 text-center lg:hidden">
                <h2 className="font-display font-bold text-[22px] text-[#1b504c] tracking-tight leading-none">
                  Apollo OPD
                </h2>
                <p className="text-[13px] text-[#9ca3af] tracking-wide mt-1 select-none">
                  Intelligence Platform
                </p>
              </div>

              {/* Headings */}
              <div className="mt-6 text-center">
                <h1 className="text-[22px] font-semibold text-gray-900 leading-tight">
                  Book smarter. Never miss a visit.
                </h1>
                <p className="text-[14px] text-gray-500 mt-1.5">
                  AI-powered reminders that adapt to your schedule
                </p>
              </div>

              {/* Value-prop badges strip */}
              <div className="flex flex-row items-center justify-center gap-3.5 text-[11px] text-gray-500 mt-5 mb-1.5">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-[#1b504c] shrink-0" />
                  <span>Instant booking</span>
                </div>
                <span className="text-gray-300 font-bold text-[8px] select-none">&#183;</span>
                <div className="flex items-center space-x-1">
                  <Bell className="h-3 w-3 text-[#1b504c] shrink-0" />
                  <span>Smart reminders</span>
                </div>
                <span className="text-gray-300 font-bold text-[8px] select-none">&#183;</span>
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-[#1b504c] shrink-0" />
                  <span>ABDM secure</span>
                </div>
              </div>

              {/* Phone Form Input */}
              <div className="mt-5 text-left">
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Mobile number
                </label>
                <div
                  className={`flex rounded-lg overflow-hidden border transition-all duration-200 ${
                    phoneFocused
                      ? 'border-[#1b504c] ring-2 ring-[#1b504c]/10'
                      : 'border-[#e5e7eb]'
                  }`}
                >
                  <span className="bg-[#f9fafb] border-r border-[#e5e7eb] text-[#6b7280] text-[15px] font-medium px-3.5 h-[48px] flex items-center select-none shrink-0">
                    +91
                  </span>
                  <div className="flex items-center flex-1 px-3.5 space-x-2">
                    <Phone className="h-[16px] w-[16px] text-gray-300 shrink-0" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                      onKeyDown={(e) => handleKeyPress(e, handlePhoneSubmit)}
                      className="bg-transparent border-none outline-none w-full h-[48px] text-[16px] text-[#111827] placeholder-[#d1d5db] p-0"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 text-left leading-none">
                  We'll send a one-time code to verify
                </p>
                {step1Error && (
                  <p className="text-xs text-red-500 mt-2 font-medium">{step1Error}</p>
                )}
              </div>

              {/* WhatsApp Consent Card */}
              <div className="bg-[#e8faee] border border-green-100 rounded-xl p-3.5 mt-4 mb-4 flex row items-start gap-2.5">
                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => setWhatsappOptInStep1(!whatsappOptInStep1)}
                  className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                    whatsappOptInStep1
                      ? 'border-[#25D366] bg-[#25D366] text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {whatsappOptInStep1 && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </button>

                <div className="flex-1 text-left">
                  {/* Heading Row */}
                  <div className="flex items-center space-x-1.5">
                    <svg
                      className="text-[#25D366] shrink-0"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 .953 11.453.953 6.014.953 1.59 5.325 1.586 10.75c-.001 1.7.447 3.361 1.299 4.816L1.87 20.27l4.777-1.116z" />
                    </svg>
                    <span className="text-[13px] font-medium text-gray-900 leading-none">
                      Enable WhatsApp reminders
                    </span>
                  </div>

                  <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
                    Get instant appointment confirmations and reminders on WhatsApp
                  </p>

                  {/* Discount incentive line badge */}
                  <div className="inline-flex items-center space-x-1 bg-[#fff3d6] text-amber-700 rounded-full px-2 py-0.5 mt-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <Gift className="h-3 w-3 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-medium text-amber-700 leading-none">
                      10% off your first visit
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handlePhoneSubmit}
                disabled={!isStep1Valid || loading}
                className={`group w-full h-[48px] rounded-xl font-medium text-[15px] flex items-center justify-center space-x-1.5 transition-all duration-200 ${
                  isStep1Valid && !loading
                    ? 'bg-[#1b504c] text-white hover:bg-[#133b38] cursor-pointer shadow-sm shadow-[#1b504c]/20'
                    : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed shadow-none'
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
                className="w-full h-[48px] bg-white border border-[#e5e7eb] hover:border-primary-teal/30 hover:bg-slate-50 text-[#1f2937] text-[15px] font-bold rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow-sm cursor-pointer"
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
                  <a href="#" className="underline text-primary-teal hover:text-primary-dark font-medium">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="underline text-primary-teal hover:text-primary-dark font-medium">Privacy Policy</a>
                </p>
              </div>

              {/* Footer Links */}
              <div className="mt-6 border-t border-[#f3f4f6] pt-4 text-center">
                <p className="text-[14px] text-[#6b7280]">
                  Are you hospital staff?{' '}
                  <a
                    href="http://localhost:5173/staff/login"
                    className="text-primary-teal font-medium hover:underline inline-block ml-0.5"
                  >
                    Login here &rarr;
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {currentStep === 2 && !showSuccessAnimation && (
            <div className="flex flex-col">
              {/* Logo block */}
              <div className="flex flex-col items-center lg:hidden">
                <div className="w-10 h-10 rounded-full bg-primary-teal flex items-center justify-center shrink-0 text-white font-bold text-[16px]">
                  A
                </div>
                <h2 className="font-display font-semibold text-[18px] text-primary-teal tracking-tight mt-2.5">
                  Apollo OPD
                </h2>
                <p className="text-[12px] text-[#9ca3af] tracking-wider mt-0.5">
                  Intelligence Platform
                </p>
              </div>

              {/* Headings */}
              <div className="mt-8 text-center">
                <h1 className="text-2xl font-semibold text-[#111827]">Verify your number</h1>
                <p className="text-[14px] text-[#6b7280] mt-1 leading-normal">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-[#111827]">{getFormattedPhoneString()}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setOtp(['', '', '', '', '', '']);
                      setStep2Error('');
                    }}
                    className="text-primary-teal font-semibold hover:underline inline ml-1.5"
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
                    className="w-12 h-[52px] border border-[#e5e7eb] rounded-lg text-center font-semibold text-[22px] text-text-dark bg-white focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/10 transition-all duration-150"
                  />
                ))}
              </div>
              {step2Error && (
                <p className="text-xs text-red-500 mt-3 font-medium text-center">{step2Error}</p>
              )}

              {/* CTA Verify Button */}
              <button
                onClick={handleOtpSubmit}
                disabled={!isStep2Valid || loading}
                className={`w-full h-[48px] rounded-xl font-medium text-[15px] flex items-center justify-center space-x-1.5 transition-all duration-200 mt-8 ${
                  isStep2Valid && !loading
                    ? 'bg-primary-teal text-white hover:bg-[#133b38] cursor-pointer'
                    : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-[16px] w-[16px]" />
                  </>
                )}
              </button>

              {/* Resend info */}
              <div className="mt-5 text-center text-xs">
                <p className="text-[#6b7280]">
                  Didn't receive the code?{' '}
                  {resendTimer > 0 ? (
                    <span className="text-[#9ca3af] ml-1">Resend in {resendTimer}s</span>
                  ) : (
                    <button
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
                      className="text-primary-teal font-semibold hover:underline ml-1"
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
              <div className="w-14 h-14 rounded-full bg-[#e8faee] text-primary-teal flex items-center justify-center mb-4 shrink-0 shadow-none border border-primary-teal/10">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <h3 className="font-display font-semibold text-lg text-text-dark">
                Number Verified
              </h3>
            </div>
          )}

          {/* STEP 3: PROFILE SETUP (New Users Only) */}
          {currentStep === 3 && (
            <div className="flex flex-col">
              {/* Logo block */}
              <div className="flex flex-col items-center lg:hidden">
                <div className="w-10 h-10 rounded-full bg-primary-teal flex items-center justify-center shrink-0 text-white font-bold text-[16px]">
                  A
                </div>
                <h2 className="font-display font-semibold text-[18px] text-primary-teal tracking-tight mt-2.5">
                  Apollo OPD
                </h2>
              </div>

              {/* Headings */}
              <div className="mt-4 lg:mt-6 text-center">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">Complete your profile</h1>
                <p className="text-xs text-[#6b7280] mt-1.5">
                  Help us personalize your experience
                </p>
              </div>

              {/* Step indicator dots */}
              <div className="mt-4 flex items-center justify-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1b504c]"></span>
                <span className="w-2 h-2 rounded-full border border-gray-200 bg-white"></span>
                <span className="w-2 h-2 rounded-full border border-gray-200 bg-white"></span>
              </div>

              {/* Fields Stack */}
              <div className="mt-6 space-y-4 text-left">
                
                {/* Field 1: Name */}
                <div className="relative">
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                    Full name *
                  </label>
                  <div className={`relative flex items-center bg-[#f9fafb] border rounded-xl px-3.5 focus-within:border-[#1b504c] focus-within:ring-2 focus-within:ring-[#1b504c]/10 transition-all duration-200 ${
                    isSubmittedStep3 && !fullName.trim() ? 'border-red-500' : 'border-[#e5e7eb]'
                  }`}>
                    <User className="h-4 w-4 text-gray-400 mr-2.5 shrink-0" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Priya Sharma"
                      className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#111827] placeholder-[#d1d5db] p-0"
                    />
                  </div>
                  {isSubmittedStep3 && !fullName.trim() && (
                    <p className="text-xs text-red-500 mt-1">This field is required</p>
                  )}
                </div>

                {/* Grid Row: Age & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Field 2: Age */}
                  <div className="relative">
                    <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                      Age *
                    </label>
                    <div className={`relative flex items-center bg-[#f9fafb] border rounded-xl px-3.5 focus-within:border-[#1b504c] focus-within:ring-2 focus-within:ring-[#1b504c]/10 transition-all duration-200 ${
                      isSubmittedStep3 && !age.trim() ? 'border-red-500' : 'border-[#e5e7eb]'
                    }`}>
                      <span className="text-sm font-semibold text-gray-400 mr-2 shrink-0 select-none">#</span>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="28"
                        className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#111827] placeholder-[#d1d5db] p-0"
                      />
                    </div>
                    {isSubmittedStep3 && !age.trim() && (
                      <p className="text-xs text-red-500 mt-1">This field is required</p>
                    )}
                  </div>

                  {/* Field 3: Gender */}
                  <div className="relative">
                    <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                      Gender *
                    </label>
                    <div className="flex bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-1 h-[46px] items-center">
                      {['Male', 'Female', 'Other'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setGender(option)}
                          className={`flex-1 h-full rounded-lg text-[11px] font-bold transition-all duration-150 ${
                            gender === option
                              ? 'bg-[#1b504c] text-white shadow-sm shadow-[#1b504c]/10'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {isSubmittedStep3 && !gender && (
                      <p className="text-xs text-red-500 mt-1">This field is required</p>
                    )}
                  </div>
                </div>

                {/* Grid Row: City & Blood Group */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Field 4: City */}
                  <div className="relative">
                    <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                      City
                    </label>
                    <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3.5 focus-within:border-[#1b504c] focus-within:ring-2 focus-within:ring-[#1b504c]/10 transition-all duration-200">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2.5 shrink-0" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Hyderabad"
                        className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#111827] placeholder-[#d1d5db] p-0"
                      />
                    </div>
                  </div>

                  {/* Field 5: Blood Group */}
                  <div className="relative">
                    <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                      Blood group
                    </label>
                    <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3.5 focus-within:border-[#1b504c] focus-within:ring-2 focus-within:ring-[#1b504c]/10 transition-all duration-200">
                      <Droplet className="h-4 w-4 text-red-400 mr-2.5 shrink-0" />
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#111827] focus:ring-0 cursor-pointer p-0"
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
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                    Email address (optional)
                  </label>
                  <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3.5 focus-within:border-[#1b504c] focus-within:ring-2 focus-within:ring-[#1b504c]/10 transition-all duration-200">
                    <Mail className="h-4 w-4 text-gray-400 mr-2.5 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="priya@example.com"
                      className="bg-transparent border-none outline-none w-full h-[44px] text-sm text-[#111827] placeholder-[#d1d5db] p-0"
                    />
                  </div>
                </div>
              </div>


              {step3Error && (
                <p className="text-xs text-red-500 mt-4 font-medium text-center">{step3Error}</p>
              )}

              {/* CTAs */}
              <div className="mt-8 space-y-3.5 text-center">
                <button
                  onClick={handleProfileSubmit}
                  disabled={loading}
                  className="w-full h-11 bg-primary-teal text-white hover:bg-primary-dark font-medium text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors duration-200"
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
                  className="text-xs font-semibold text-[#6b7280] hover:text-text-medium transition-colors"
                >
                  {loading ? 'Processing...' : 'Skip for now \u2192'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ABHA ID + PERSONA SELECTION */}
          {currentStep === 4 && (
            <div className="flex flex-col">
              {/* Logo block */}
              <div className="flex flex-col items-center lg:hidden">
                <div className="w-10 h-10 rounded-full bg-primary-teal flex items-center justify-center shrink-0 text-white font-bold text-[16px]">
                  A
                </div>
                <h2 className="font-display font-semibold text-[18px] text-primary-teal tracking-tight mt-2.5">
                  Apollo OPD
                </h2>
              </div>

              {/* Headings */}
              <div className="mt-6 text-center">
                <h1 className="text-xl font-semibold text-[#111827]">Almost done!</h1>
                <p className="text-xs text-[#6b7280] mt-1">
                  Two quick preferences to set up
                </p>
              </div>

              {/* Form Container */}
              <div className="mt-6 space-y-6">
                
                {/* Part A: ABHA ID */}
                <div className="bg-[#f9fafb] border border-[#f3f4f6] rounded-xl p-4">
                  <div className="flex justify-between items-center relative">
                    <span className="text-sm font-medium text-text-dark flex items-center space-x-1">
                      <span>ABHA Health ID</span>
                      
                      {/* Tooltip trigger */}
                      <span
                        className="relative cursor-help"
                        onMouseEnter={() => setShowAbhaTooltip(true)}
                        onMouseLeave={() => setShowAbhaTooltip(false)}
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-[#9ca3af] hover:text-[#6b7280] transition-colors" />
                        
                        {/* Hover Tooltip Box */}
                        {showAbhaTooltip && (
                          <span className="absolute left-[-80px] bottom-6 z-40 bg-text-dark text-white text-[10px] rounded-lg p-2.5 w-[200px] leading-relaxed shadow-lg font-normal block">
                            Your 14-digit ABHA ID from Ayushman Bharat. Get one at abdm.gov.in
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-[11px] text-[#9ca3af] italic font-semibold">Optional</span>
                  </div>
                  
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                    Link your Ayushman Bharat Digital Health Account for seamless health records across hospitals.
                  </p>

                  <input
                    type="text"
                    placeholder="XX-XXXX-XXXX-XXXX"
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg bg-white focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/10 mt-3 text-sm text-[#111827]"
                  />
                </div>

                {/* Part B: Reminder Persona */}
                <div>
                  <label className="block text-sm font-medium text-[#111827]">
                    How should we remind you?
                  </label>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    This helps us send the right reminder at the right time.
                  </p>

                  {/* Option Rows */}
                  <div className="space-y-2 mt-3.5">
                    
                    {/* Option 1: Working Professional */}
                    <div
                      onClick={() => setSelectedPersona('Professional')}
                      className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        selectedPersona === 'Professional'
                          ? 'border-primary-teal bg-light-teal/30'
                          : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                          <Briefcase className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">Working Professional</p>
                          <p className="text-[12px] text-[#6b7280] mt-0.5 leading-snug">I need 48 hours to plan leave from work</p>
                          <p className="text-[10px] text-[#9ca3af] mt-1">Reminders: 48h · 24h · morning</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPersona === 'Professional' ? 'border-primary-teal' : 'border-[#d1d5db]'
                        }`}>
                          {selectedPersona === 'Professional' && <span className="w-2.5 h-2.5 rounded-full bg-primary-teal"></span>}
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Elderly / Need Help */}
                    <div
                      onClick={() => setSelectedPersona('Elderly')}
                      className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        selectedPersona === 'Elderly'
                          ? 'border-primary-teal bg-light-teal/30'
                          : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                          <Heart className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">Elderly / Need Help</p>
                          <p className="text-[12px] text-[#6b7280] mt-0.5 leading-snug">A family member will bring me to the appointment</p>
                          <p className="text-[10px] text-[#9ca3af] mt-1">Reminders: 48h (+ family) · 24h (family) · 3h</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPersona === 'Elderly' ? 'border-primary-teal' : 'border-[#d1d5db]'
                        }`}>
                          {selectedPersona === 'Elderly' && <span className="w-2.5 h-2.5 rounded-full bg-primary-teal"></span>}
                        </div>
                      </div>
                    </div>

                    {/* Option 3: Student */}
                    <div
                      onClick={() => setSelectedPersona('Student')}
                      className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        selectedPersona === 'Student'
                          ? 'border-primary-teal bg-light-teal/30'
                          : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                          <GraduationCap className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">Student</p>
                          <p className="text-[12px] text-[#6b7280] mt-0.5 leading-snug">Just remind me the day before</p>
                          <p className="text-[10px] text-[#9ca3af] mt-1">Reminders: 24h · 1h before</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPersona === 'Student' ? 'border-primary-teal' : 'border-[#d1d5db]'
                        }`}>
                          {selectedPersona === 'Student' && <span className="w-2.5 h-2.5 rounded-full bg-primary-teal"></span>}
                        </div>
                      </div>
                    </div>

                    {/* Option 4: Other / Standard */}
                    <div
                      onClick={() => setSelectedPersona('Other')}
                      className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        selectedPersona === 'Other'
                          ? 'border-primary-teal bg-light-teal/30'
                          : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-gray-50 text-gray-500 shrink-0">
                          <Clock className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">Other</p>
                          <p className="text-[12px] text-[#6b7280] mt-0.5 leading-snug">Standard reminders only</p>
                          <p className="text-[10px] text-[#9ca3af] mt-1">Reminders: 24h · 2h before</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPersona === 'Other' ? 'border-primary-teal' : 'border-[#d1d5db]'
                        }`}>
                          {selectedPersona === 'Other' && <span className="w-2.5 h-2.5 rounded-full bg-primary-teal"></span>}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Sub-form: Family member details (Displayed only when Elderly is selected) */}
                {selectedPersona === 'Elderly' && (
                  <div className="bg-[#f9fafb] border border-[#f3f4f6] rounded-xl p-4 space-y-3.5">
                    <div>
                      <h4 className="text-[13px] font-semibold text-text-dark leading-none">
                        Family member details
                      </h4>
                      <p className="text-[12px] text-[#6b7280] mt-1 leading-normal">
                        They'll receive appointment reminders and can confirm on your behalf
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <input
                        type="text"
                        placeholder="Family member name"
                        value={caretakerName}
                        onChange={(e) => setCaretakerName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e5e7eb] bg-white rounded-lg focus:outline-none focus:border-primary-teal"
                      />
                      <input
                        type="text"
                        placeholder="Family member phone"
                        value={caretakerPhone}
                        onChange={(e) => setCaretakerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e5e7eb] bg-white rounded-lg focus:outline-none focus:border-primary-teal"
                      />
                    </div>

                    <div className="text-xs">
                      <label className="block text-text-light font-semibold mb-1">Relationship</label>
                      <select
                        value={caretakerRelation}
                        onChange={(e) => setCaretakerRelation(e.target.value)}
                        className="w-full px-3 py-2 border border-[#e5e7eb] bg-white rounded-lg focus:outline-none focus:border-primary-teal"
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
              <div className="mt-8 space-y-3.5 text-center">
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="w-full h-11 bg-primary-teal text-white hover:bg-primary-dark font-medium text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors duration-200"
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
                  className="text-xs font-semibold text-[#6b7280] hover:text-text-medium transition-colors"
                >
                  Skip for now &rarr;
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>

      {/* Right Panel (Indian Doctor Promo Graphic Section) */}
      <div className="hidden lg:flex w-[50%] min-h-screen bg-gradient-to-br from-[#1b504c] to-[#113330] relative flex-col justify-center items-center p-12 text-white overflow-hidden select-none">
        {/* Abstract Background Vectors */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
        
        {/* Floating elements matching mockup icons */}
        <div className="absolute top-16 left-20 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-lg animate-bounce [animation-duration:5s] flex items-center justify-center shrink-0 text-white">
          <MessageSquare className="h-6 w-6 text-[#25D366]" />
        </div>
        <div className="absolute top-1/3 right-16 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-lg animate-pulse [animation-duration:4s] flex items-center justify-center shrink-0 text-white">
          <Calendar className="h-6 w-6 text-white" />
        </div>
        <div className="absolute bottom-24 left-24 bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-full shadow-lg animate-bounce [animation-duration:6s] [animation-delay:2s] flex items-center justify-center shrink-0 text-white">
          <svg className="h-5 w-5 text-green-400 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="absolute bottom-32 right-28 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-lg animate-pulse [animation-duration:5s] [animation-delay:1s] flex items-center justify-center shrink-0 text-white">
          <Clock className="h-6 w-6 text-amber-300" />
        </div>

        {/* Doctor Monitor Frame */}
        <div className="relative w-full max-w-[440px] aspect-[4/5] bg-[#22635f] rounded-3xl border border-white/10 shadow-2xl p-5 flex flex-col justify-between overflow-hidden group">
          {/* Inner image container */}
          <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-inner bg-cover bg-center" style={{ backgroundImage: "url('/indian_doctor.png')" }}>
            {/* Dark gradient fade-in at the bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#113330]/90 via-transparent to-transparent"></div>
            
            {/* Live Consultant Badge */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center justify-between text-left shadow-lg">
              <div>
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest leading-none">Apollo Hospital Panel</p>
                <p className="text-base font-extrabold text-white mt-1 leading-tight font-display">Dr. Priya Sharma, MD</p>
                <p className="text-xs text-white/70 leading-none mt-0.5">Consultant Cardiologist</p>
              </div>
              <div className="bg-[#25D366] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 shrink-0 shadow-md shadow-[#25D366]/20">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                <span>Active</span>
              </div>
            </div>
          </div>

          {/* Subtext info */}
          <div className="mt-5 text-left border-t border-white/10 pt-4 shrink-0">
            <h4 className="text-[17px] font-extrabold font-display tracking-tight text-white leading-tight">
              Apollo OPD Platform Benefits
            </h4>
            
            <ul className="mt-3.5 space-y-2.5 text-xs text-white/90">
              <li className="flex items-center space-x-2.5">
                <span className="h-5 w-5 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]"></span>
                </span>
                <div>
                  <strong className="text-white font-semibold">Instant Booking:</strong> Reserve consultation slots dynamically in 30 seconds.
                </div>
              </li>
              <li className="flex items-center space-x-2.5">
                <span className="h-5 w-5 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]"></span>
                </span>
                <div>
                  <strong className="text-white font-semibold">Live Queue Status:</strong> Track patient flow in real-time to eliminate wait times.
                </div>
              </li>
              <li className="flex items-center space-x-2.5">
                <span className="h-5 w-5 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]"></span>
                </span>
                <div>
                  <strong className="text-white font-semibold">Slot Recovery:</strong> Opt-in to secure earlier slots when cancellations happen.
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
