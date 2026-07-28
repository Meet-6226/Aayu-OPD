import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Sparkles, Check, FileText, Trash2, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/* ── Custom Styled Robot Mascot SVG (Nidaan One OPD Theme Colors) ──── */
function NidaanOneRobotMascot({ className = 'w-24 h-24 sm:w-28 sm:h-28' }) {
  return (
    <svg
      viewBox="0 0 500 500"
      className={`drop-shadow-lg select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="250" cy="460" rx="70" ry="12" fill="#182033" opacity="0.12" className="animate-pulse" />
      <g className="animate-float">
        <path d="M225 100h50v20h-50z" fill="#3B4452" />
        <path d="M230 65c0-10 8-15 20-15s20 5 20 15v35h-40z" fill="#1E7F6A" />
        <path d="M245 55h10v35h-10z" fill="#2BCB7F" opacity="0.8" />
        <path d="M150 160l-30-30" stroke="#3B4452" strokeWidth="8" strokeLinecap="round" />
        <circle cx="120" cy="130" r="12" fill="#1E7F6A" />
        <path d="M350 160l30-30" stroke="#3B4452" strokeWidth="8" strokeLinecap="round" />
        <circle cx="380" cy="130" r="12" fill="#1E7F6A" />
        <rect x="125" y="215" width="20" height="50" rx="8" fill="#3B4452" />
        <rect x="355" y="215" width="20" height="50" rx="8" fill="#3B4452" />
        <rect x="140" y="110" width="220" height="180" rx="55" fill="#FFFFFF" stroke="#3B4452" strokeWidth="10" />
        <rect x="165" y="140" width="170" height="120" rx="35" fill="#182033" />
        <ellipse cx="210" cy="190" rx="16" ry="20" fill="#2BCB7F" />
        <ellipse cx="290" cy="190" rx="16" ry="20" fill="#2BCB7F" />
        <circle cx="216" cy="182" r="6" fill="#FFFFFF" />
        <circle cx="296" cy="182" r="6" fill="#FFFFFF" />
        <path d="M235 220c0 10 7 15 15 15s15-5 15-15" fill="none" stroke="#2BCB7F" strokeWidth="7" strokeLinecap="round" />
        <path d="M190 285h120l-15 110H205z" fill="#FFFFFF" stroke="#3B4452" strokeWidth="10" strokeLinejoin="round" />
        <circle cx="250" cy="340" r="32" fill="#F3FBF8" stroke="#E8ECEF" strokeWidth="3" />
        <path d="M250 325v30M235 340h30" stroke="#1E7F6A" strokeWidth="8" strokeLinecap="round" />
        <path d="M185 300l-30 40" stroke="#3B4452" strokeWidth="10" strokeLinecap="round" />
        <circle cx="150" cy="345" r="12" fill="#182033" />
        <path d="M315 300l30 35" stroke="#3B4452" strokeWidth="10" strokeLinecap="round" />
        <circle cx="348" cy="340" r="12" fill="#182033" />
        <g transform="translate(325, 345)">
          <rect x="0" y="10" width="55" height="42" rx="4" fill="#1E7F6A" stroke="#165B52" strokeWidth="3" />
          <path d="M18 10V4c0-2 1-3 3-3h12c2 0 3 1 3 3v6" fill="none" stroke="#165B52" strokeWidth="4" />
          <path d="M27.5 22v16M20 30h15" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/* Helper to render text beautifully without markdown special characters like asterisks (**) */
function FormattedMessageText({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, lineIdx) => {
        let isBullet = false;
        let cleanLine = line;

        if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\.\s*/)) {
          isBullet = true;
          cleanLine = line.replace(/^[•-]\s*/, '').replace(/^\d+\.\s*/, '');
        }

        const parts = cleanLine.split('**');
        const renderedLine = parts.map((part, partIdx) => {
          if (partIdx % 2 === 1) {
            return <strong key={partIdx} className="font-bold text-[#182033]">{part}</strong>;
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2 text-[#2C3E50]">
              <span className="text-[#1E7F6A] font-bold mt-0.5">•</span>
              <span className="flex-1">{renderedLine}</span>
            </div>
          );
        }

        return <p key={lineIdx} className="text-[#2C3E50]">{renderedLine}</p>;
      })}
    </div>
  );
}

export default function NidaanOneAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [profile, setProfile] = useState(null);
  
  // Conversational state tracking
  const [currentConvState, setCurrentConvState] = useState({
    activeSymptom: null, // 'leg', 'fever', 'chest', 'diabetes', 'bp', 'skin'
    awaitingFollowup: false
  });
  
  // MCQ selection chips state for follow-up triage questions
  const [followUpOptions, setFollowUpOptions] = useState(null);
  
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState("Chat with Nidaan One AI Doctor");
  const [highlightActive, setHighlightActive] = useState(false);
  
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Load patient onboarding medical details on mount
  useEffect(() => {
    const saved = localStorage.getItem('nidaan_medical_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        initializeChat(parsed);
      } catch (e) {
        console.error("Failed to parse medical profile:", e);
        initializeChat(null);
      }
    } else {
      initializeChat(null);
    }
  }, []);

  // Listen to Custom Onboarding Completion event
  useEffect(() => {
    const handleOnboardingCompleted = (e) => {
      const freshProfile = e.detail;
      if (freshProfile) {
        setProfile(freshProfile);
        initializeChat(freshProfile);
      }
      
      setBubbleText("Profile Calibrated! Click here to consult Nidaan One AI.");
      setShowSpeechBubble(true);
      setHighlightActive(true);

      setTimeout(() => {
        setShowSpeechBubble(false);
        setHighlightActive(false);
      }, 8500);
    };

    window.addEventListener('nidaan_onboarding_completed', handleOnboardingCompleted);
    return () => window.removeEventListener('nidaan_onboarding_completed', handleOnboardingCompleted);
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const initializeChat = (medProfile) => {
    let greeting = "Hello. I am your Nidaan One AI Health Assistant. I have loaded your basic profile parameters.";
    
    if (medProfile) {
      const conditions = medProfile.chronic_conditions || [];
      const activeConditions = conditions.filter(c => !c.toLowerCase().includes('none'));
      const symptoms = medProfile.current_symptoms || [];
      const activeSymptoms = symptoms.filter(s => !s.toLowerCase().includes('none'));
      const allergies = medProfile.allergies || [];
      const activeAllergies = allergies.filter(a => !a.toLowerCase().includes('no known') && !a.toLowerCase().includes('none'));

      if (activeConditions.length > 0 || activeSymptoms.length > 0 || activeAllergies.length > 0) {
        greeting = `Welcome back. I have calibrated my clinical assistant model based on your onboarding profile:\n\n`;
        
        if (activeConditions.length > 0) {
          greeting += `• Conditions: ${activeConditions.join(', ')}\n`;
        }
        if (activeSymptoms.length > 0) {
          greeting += `• Active Symptoms: ${activeSymptoms.join(', ')}\n`;
        }
        if (activeAllergies.length > 0) {
          greeting += `• Safeguard Allergies: ${activeAllergies.join(', ')}\n`;
        }
        
        greeting += `\nHow are you feeling right now? Please share any active symptoms so we can triage or recommend a matching specialist.`;
      } else {
        greeting = "Hello. I am your Nidaan One AI Health Assistant. Your profile parameters indicate no active chronic conditions or symptoms. How can I help support your health journey today?";
      }
    } else {
      greeting = "Hello. I am your Nidaan One AI Health Assistant. How can I assist you with your health query, symptoms analysis, or finding the right specialist today?";
    }

    setMessages([
      {
        id: 'init',
        sender: 'ai',
        text: greeting,
        timestamp: new Date()
      }
    ]);
  };

  // Simulates realistic word-by-word streaming generation
  const streamMessageText = (responseText) => {
    const uniqueId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setMessages(prev => [...prev, {
      id: uniqueId,
      sender: 'ai',
      text: '',
      timestamp: new Date()
    }]);

    const words = responseText.split(' ');
    let currentIdx = 0;
    let currentText = '';

    const interval = setInterval(() => {
      if (currentIdx < words.length) {
        currentText += (currentIdx === 0 ? '' : ' ') + words[currentIdx];
        setMessages(prev => 
          prev.map(m => m.id === uniqueId ? { ...m, text: currentText } : m)
        );
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 35);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setFollowUpOptions(null);

    const uniqueUserMsgId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userMsg = {
      id: uniqueUserMsgId,
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      let responseText = "";
      let responseOptions = null;

      if (genAI) {
        const savedProfile = localStorage.getItem('nidaan_medical_profile');
        let profileContext = "No onboarding medical profile provided.";
        if (savedProfile) {
          profileContext = JSON.stringify(JSON.parse(savedProfile), null, 2);
        }

        const systemInstruction = `
          You are Nidaan One AI, an expert hospital-based clinical assistant.
          Your primary role is triage and specialist referral guidance.
          
          Patient Medical Parameters Context:
          ${profileContext}

          Rules:
          1. Speak in the patient's language. If they ask in Hindi/Hinglish, reply in warm Hindi/Hinglish.
          2. If symptoms suggest critical risks (e.g., chest pain, breathing trouble), alert them immediately to seek emergency care.
          3. Recommend booking a consultation with relevant specialties (General Medicine, Cardiology, Orthopedics, Dermatology).
          4. Note the patient's active allergies to warn them against contraindicated medicines.
          5. Keep responses concise, clean, and professional. Do not output markdown stars (**) or code tags. No emojis.
        `;

        const model = genAI.getGenerativeModel({
          model: "gemini-3.5-flash",
          systemInstruction: systemInstruction,
        });

        const result = await model.generateContent(text);
        const response = await result.response;
        responseText = response.text();
        
        responseOptions = [
          "Book Doctor Consult",
          "Triage another symptom",
          "Other (Please specify)"
        ];
      } else {
        const offlineResult = getConversationalResponse(text);
        responseText = offlineResult.text;
        responseOptions = offlineResult.options;
      }

      setTimeout(() => {
        setIsTyping(false);
        streamMessageText(responseText);
        if (responseOptions) {
          setFollowUpOptions(responseOptions);
        }
      }, 1500);

    } catch (err) {
      console.warn("[NidaanOneAI] Gemini live call failed, using clinical rules simulator fallback:", err);
      const offlineResult = getConversationalResponse(text);
      setTimeout(() => {
        setIsTyping(false);
        streamMessageText(offlineResult.text);
        if (offlineResult.options) {
          setFollowUpOptions(offlineResult.options);
        }
      }, 1500);
    }
  };

  /* ── MCQ Option Click Handler ───────────────────────────── */
  const handleMcqClick = (opt) => {
    if (opt.includes("Other")) {
      setInputText("Other: ");
    } else {
      handleSend(opt);
    }
  };

  /* ── Hospital Clinical AI Response Engine (Offline Fallback) ────── */
  const getConversationalResponse = (userQuery) => {
    const q = userQuery.toLowerCase();

    // If we were awaiting a follow-up answer
    if (currentConvState.awaitingFollowup && currentConvState.activeSymptom) {
      const symptom = currentConvState.activeSymptom;
      setCurrentConvState({ activeSymptom: null, awaitingFollowup: false });

      if (symptom === 'leg') {
        return {
          text: `Thank you for confirming. Based on your inputs:\n\n1. Clinical Insight: Lower limb discomfort without severe joint locked states suggests minor muscular fatigue or ligament sprain.\n2. Care Routine: Keep the leg elevated, rest from heavy weight bearing, and apply cold compression for 15 minutes.\n3. Referral Match: I recommend booking an appointment with our senior Orthopedics specialist to run a physical scan.\n\nWould you like me to redirect you to book our senior Orthopedics doctor?`,
          options: ["Book Orthopedics Slot", "View Doctor Options", "Other (Please specify)"]
        };
      }
      if (symptom === 'fever') {
        return {
          text: `Understood. Given your symptoms:\n\n1. Clinical Insight: A body temperature elevation accompanied by general cold suggests a mild viral infections track.\n2. Care Routine: Remain fully hydrated, consume warm fluids, and track temp parameters.\n3. Safe Safeguards: Be mindful of your active allergy list before taking self medication.\n4. Action: Recommend consulting our General Medicine physician to evaluate diagnostic parameters.`,
          options: ["Book General Medicine", "View All Doctors", "Other (Please specify)"]
        };
      }
      if (symptom === 'chest') {
        return {
          text: `CRITICAL CARE PROTOCOL:\n\nGiven the physical parameters you verified, please do not delay. We recommend immediately visiting the emergency desk at our clinic or calling for cardiac telemetry support. If stable, please proceed directly to book our senior Cardiologist.`,
          options: ["Cardiac Emergency Desk", "Book Cardiology Slot", "Other (Please specify)"]
        };
      }
      if (symptom === 'diabetes') {
        return {
          text: `Thank you for sharing the metrics. For effective Glycemic wellness:\n\n1. Care Plan: Maintain routine Fasting and Post-Prandial monitoring. Avoid refined carbohydrates.\n2. Consult: Please share these glucose logs with our senior Endocrinologist to adjust dosage parameters.`,
          options: ["Book Endocrinologist", "View Sugar Doctors", "Other (Please specify)"]
        };
      }
      if (symptom === 'skin') {
        return {
          text: `Understood. Since you confirmed the symptoms detail:\n\n1. Plan: Avoid scratching the area. Apply a clean cool compress to settle inflammation.\n2. Specialist: Recommend consulting our Dermatology department to check parameters.`,
          options: ["Book Dermatologist", "Skin Clinic Slots", "Other (Please specify)"]
        };
      }
    }

    // Default first-stage checks (Symptoms detection) and trigger follow-up questions
    if (q.includes('leg pain') || q.includes('knee') || q.includes('joint') || q.includes('back pain') || q.includes('bone') || q.includes('shoulder') || q.includes('hand pain') || q.includes('muscle') || q.includes('fracture') || q.includes('foot')) {
      setCurrentConvState({ activeSymptom: 'leg', awaitingFollowup: true });
      return {
        text: `I see you are experiencing joint or muscle pain. To guide you perfectly:\n\nDid this pain start suddenly after an injury, fall, or workout, and is there any visible swelling?`,
        options: ["Yes, sudden pain after injury/workout", "No, gradual pain without direct injury", "Other (Please specify)"]
      };
    }

    if (q.includes('fever') || q.includes('cold') || q.includes('cough') || q.includes('headache') || q.includes('throat') || q.includes('stomach') || q.includes('infection')) {
      setCurrentConvState({ activeSymptom: 'fever', awaitingFollowup: true });
      return {
        text: `I understand you have fever or cold symptoms. Let me ask:\n\nHow many days has the fever been active, and are you experiencing chills or body ache?`,
        options: ["1-2 Days with mild cold/cough", "3+ Days with high fever/chills", "Other (Please specify)"]
      };
    }

    if (q.includes('chest pain') || q.includes('heart pain') || q.includes('breathing') || q.includes('breathless') || q.includes('shortness of breath') || q.includes('cardio') || q.includes('heart')) {
      setCurrentConvState({ activeSymptom: 'chest', awaitingFollowup: true });
      return {
        text: `CRITICAL ACTION REQUIRED: You mentioned chest tightness or breathing trouble.\n\nAre you currently experiencing sweating, left arm pain, or high anxiety along with this?`,
        options: ["Yes, with left-arm discomfort/sweating", "No, localized breathing tightness only", "Other (Please specify)"]
      };
    }

    if (q.includes('diabetes') || q.includes('blood sugar') || q.includes('sugar') || q.includes('insulin')) {
      setCurrentConvState({ activeSymptom: 'diabetes', awaitingFollowup: true });
      return {
        text: `I see you are asking about diabetes or blood sugar levels.\n\nDo you currently have your latest fasting blood glucose reading, or are you feeling sudden dry mouth/thirst?`,
        options: ["Fasting glucose is above 160", "Under 120 but experiencing high thirst", "Other (Please specify)"]
      };
    }

    if (q.includes('allergy') || q.includes('allergic') || q.includes('skin') || q.includes('rash') || q.includes('pimple') || q.includes('acne') || q.includes('face')) {
      setCurrentConvState({ activeSymptom: 'skin', awaitingFollowup: true });
      return {
        text: `I understand you have skin irritation or rashes. To triage:\n\nIs there itching, redness, or burning sensation, and did you touch any new chemical or substance?`,
        options: ["Severe itching with active redness", "Mild rash, no chemical exposure", "Other (Please specify)"]
      };
    }

    if (q === 'hi' || q === 'hello' || q === 'hey' || q === 'greetings' || q === 'good morning' || q === 'good afternoon') {
      return {
        text: `Hello. How can I assist you with your health symptoms or finding a medical specialist today?`,
        options: ["Triage active symptoms", "Book Doctor Appointment", "Other (Please specify)"]
      };
    }

    if (q.includes('child') || q.includes('baby') || q.includes('kid') || q.includes('pediatric')) {
      return {
        text: `For child health questions, our Pediatrics department is open for walk-ins and active slot bookings. Please consult our Pediatricians for proper pediatric drug dosing.\n\nWould you like to book a Pediatrics appointment?`,
        options: ["Book Pediatrics Slot", "Check Pediatricians", "Other (Please specify)"]
      };
    }

    if (q.includes('doctor') || q.includes('book') || q.includes('appointment') || q.includes('spec')) {
      return {
        text: `I can help match you to the ideal specialist:\n\n• General Medicine: For cough, fever, infections.\n• Cardiology: For BP, heart wellness, chest tightness.\n• Orthopedics: For joint, bone, muscle issues.\n• Dermatology: For skin rashes, allergies, hair health.`,
        options: ["Book General Medicine", "Book Cardiology", "Book Orthopedics", "Book Dermatology"]
      };
    }

    const conditions = profile?.chronic_conditions || [];
    const active = conditions.filter(c => !c.toLowerCase().includes('none'));
    if (active.length > 0) {
      return {
        text: `I have analyzed your query. Given your profile history of ${active.join(', ')}, please ensure you mention these parameters during consultations. Avoid self-medicating. \n\nWould you like me to recommend a specialist doctor or guide you to book a slot?`,
        options: ["Suggest specialist", "Ask about my symptoms", "Other (Please specify)"]
      };
    }

    // GENERAL FALLBACK QUESTION
    return {
      text: `Understood. To help you perfectly, could you please specify if you are experiencing any physical symptoms (like fever, body ache, or joint pain) or if you want a referral to a specific specialist?`,
      options: ["Fever & Cold", "Body Ache / Joint Pain", "Chest Pain / Breathing", "Other (Please specify)"]
    };
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setShowSpeechBubble(false);
    setHighlightActive(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="chat-btn-container"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="flex flex-col items-end cursor-pointer group relative"
            onClick={handleOpenChat}
          >
            <AnimatePresence>
              {showSpeechBubble && (
                <motion.div 
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="bg-white border border-[#E8ECEF] px-4 py-2.5 shadow-md rounded-none mb-1 mr-3 relative text-right flex items-center gap-2 border-l-4 border-l-[#1E7F6A] max-w-[280px]"
                >
                  <div className="w-1.5 h-1.5 bg-[#2BCB7F] rounded-full animate-ping shrink-0" />
                  <p className="text-[11px] font-bold text-[#182033] font-poppins uppercase tracking-wide leading-tight">
                    {bubbleText}
                  </p>
                  <div className="absolute bottom-[-6px] right-8 w-3 h-3 bg-white border-r border-b border-[#E8ECEF] transform rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className={`transition-all duration-300 rounded-full ${highlightActive ? 'animate-pulse-glow p-2 bg-[#F3FBF8]/80' : ''}`}>
              <div className="hover:scale-105 active:scale-98 transition-transform duration-200">
                <NidaanOneRobotMascot className="w-24 h-24 sm:w-28 sm:h-28" />
              </div>
            </div>
          </motion.div>
        )}

        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white border border-[#E2E8F0] w-[370px] sm:w-[410px] h-[550px] shadow-2xl flex flex-col rounded-none overflow-hidden text-left"
          >
            {/* Header: Premium Corporate Gradient with Inner Glow */}
            <div className="bg-gradient-to-r from-[#182033] via-[#1A343A] to-[#1E7F6A] text-white px-5 py-4 flex items-center justify-between rounded-none border-b border-[#165B52]/40 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 flex items-center justify-center overflow-hidden shrink-0 rounded-none border border-white/20">
                  <NidaanOneRobotMascot className="w-14 h-14 mt-1" />
                </div>
                <div>
                  <h4 className="font-poppins font-bold text-[14px] uppercase tracking-wider text-white">
                    Nidaan One Clinical AI
                  </h4>
                  <span className="text-[9.5px] font-mono-data text-[#A5D8CD] uppercase tracking-widest block mt-0.5">
                    Hospital Triage Model
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white transition-all rounded-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Calibration Banner */}
            {profile && (
              <div className="bg-[#F0FAF7] border-b border-[#D6EFE9] px-5 py-2 flex items-center gap-2 text-[10.5px] text-[#1E7F6A] font-semibold font-poppins">
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Patient Medical Profile Context Active</span>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8F9FA]/40">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 bg-white border border-[#E2E8F0] flex items-center justify-center overflow-hidden shrink-0 rounded-none shadow-sm">
                      <NidaanOneRobotMascot className="w-11 h-11 mt-1" />
                    </div>
                  )}

                  <div
                    className={`
                      max-w-[80%] p-3.5 text-[13px] leading-relaxed rounded-none font-poppins shadow-sm
                      ${msg.sender === 'user'
                        ? 'bg-[#1E7F6A] text-white border-0'
                        : 'bg-white text-[#182033] border border-[#E2E8F0] whitespace-pre-line border-l-4 border-l-[#1E7F6A]'
                      }
                    `}
                  >
                    <FormattedMessageText text={msg.text} />
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start items-start gap-3">
                  <div className="w-8 h-8 bg-white border border-[#E2E8F0] flex items-center justify-center overflow-hidden shrink-0 rounded-none shadow-sm">
                    <NidaanOneRobotMascot className="w-11 h-11 mt-1" />
                  </div>
                  <div className="bg-white border border-[#E2E8F0] px-4 py-3 rounded-none flex items-center gap-1.5 shadow-sm border-l-4 border-l-[#1E7F6A]">
                    <span className="w-1.5 h-1.5 bg-[#1E7F6A] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#1E7F6A] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#1E7F6A] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* MCQ Follow-up Choices OR Quick Actions Panel */}
            {followUpOptions ? (
              <div className="px-5 py-3.5 border-t border-[#E2E8F0] bg-[#F4FAF8] flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-[#1E7F6A] tracking-wider font-poppins">
                  Select Triage Response:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {followUpOptions.map((opt, oIdx) => {
                    const isLastOdd = followUpOptions.length % 2 !== 0 && oIdx === followUpOptions.length - 1;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleMcqClick(opt)}
                        className={`
                          px-3 py-2.5 text-[11px] font-semibold bg-white border border-[#E2E8F0] 
                          hover:border-[#1E7F6A] hover:bg-[#F3FBF8] text-[#182033] font-poppins 
                          transition-all duration-200 text-center flex items-center justify-center shadow-sm rounded-none
                          ${isLastOdd ? 'col-span-2' : 'col-span-1'}
                        `}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="px-5 py-3 border-t border-[#E2E8F0] bg-white flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-thin">
                <button
                  onClick={() => handleSend("Suggest a doctor for fever & cold")}
                  className="px-3.5 py-2 text-[11px] font-medium border border-[#E2E8F0] hover:border-[#1E7F6A] hover:bg-[#F3FBF8] rounded-none text-[#3B4452] font-poppins transition-all shadow-sm"
                >
                  Fever Consultation
                </button>
                <button
                  onClick={() => handleSend("Heart / Chest tightness checks")}
                  className="px-3.5 py-2 text-[11px] font-medium border border-[#E2E8F0] hover:border-[#1E7F6A] hover:bg-[#F3FBF8] rounded-none text-[#3B4452] font-poppins transition-all shadow-sm"
                >
                  Chest Pain Evaluation
                </button>
                <button
                  onClick={() => handleSend("Tell me how to control blood sugar")}
                  className="px-3.5 py-2 text-[11px] font-medium border border-[#E2E8F0] hover:border-[#1E7F6A] hover:bg-[#F3FBF8] rounded-none text-[#3B4452] font-poppins transition-all shadow-sm"
                >
                  Diabetes Management
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3.5 border-t border-[#E2E8F0] bg-white flex gap-2 rounded-none">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={followUpOptions ? "Or specify custom details here..." : "Describe symptoms or type health query..."}
                className="flex-grow px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#1E7F6A] focus:bg-[#F3FBF8]/10 rounded-none font-poppins"
              />
              <button
                onClick={() => handleSend()}
                className="bg-[#1E7F6A] text-white p-2.5 hover:bg-[#165B52] transition-all rounded-none flex items-center justify-center shrink-0 border border-[#1E7F6A] shadow-sm hover:shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
