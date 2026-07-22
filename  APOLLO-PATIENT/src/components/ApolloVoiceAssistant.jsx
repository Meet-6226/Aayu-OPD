import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  CheckCircle2,
  FileText,
  X,
  Stethoscope,
  Bot,
  User,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function ApolloVoiceAssistant({ isOpen, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [step, setStep] = useState(0); // 0: Idle, 1: AI Asking, 2: Listening, 3: Processing, 4: Summary Generated
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Namaste Priya ji! Main Apollo Gemini Voice AI hoon. Dr. Mehta se milne se pehle, kya aap mujhe apne symptoms bata sakti hain?',
      audioPlaying: true
    }
  ]);

  const simulatedResponses = [
    {
      userSpeech: "Mujhe 3 din se chest tightness aur halka fever feel ho raha hai.",
      aiReply: "Got it. Key symptoms noted: Chest Discomfort & Fever (3 Days). Kya aapko High BP ya Diabetes ki history hai?",
      summary: {
        chiefComplaint: "Chest tightness & Mild Fever (3 days duration)",
        vitalsAlert: "Pre-existing Hypertension flagged",
        triageLevel: "Priority 1 Cardiology Review",
        department: "Cardiology · Dr. Arvind Mehta (Room 302)"
      }
    }
  ];

  const handleStartVoice = () => {
    setIsListening(true);
    setStep(1);

    // Simulate speech recognition progression
    setTimeout(() => {
      setStep(2);
      setTranscript(simulatedResponses[0].userSpeech);
    }, 1800);

    setTimeout(() => {
      setIsListening(false);
      setStep(3);
      setMessages(prev => [
        ...prev,
        { sender: 'user', text: simulatedResponses[0].userSpeech },
        { sender: 'ai', text: simulatedResponses[0].aiReply }
      ]);
    }, 3800);

    setTimeout(() => {
      setStep(4);
    }, 5200);
  };

  const handleReset = () => {
    setStep(0);
    setIsListening(false);
    setTranscript('');
    setMessages([
      {
        sender: 'ai',
        text: 'Namaste Priya ji! Main Apollo Gemini Voice AI hoon. Dr. Mehta se milne se pehle, kya aap mujhe apne symptoms bata sakti hain?'
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-teal-500/30 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl relative overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/20">
                <Bot className="h-5 w-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                    Apollo Voice Medical Assistant
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                    Gemini 1.5 Pro
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  AI Pre-Consultation Voice Scribe
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation Chat Log */}
          <div className="mt-4 space-y-3 max-h-[220px] overflow-y-auto pr-1 relative z-10 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/30">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    msg.sender === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-white/10 text-gray-200 border border-white/10 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Live Waveform / Voice Mic Status Area */}
          <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 text-center relative z-10">
            {step === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-300 font-medium">
                  Tap microphone & speak in Hindi or English to describe symptoms.
                </p>
                <button
                  onClick={handleStartVoice}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <Mic className="h-7 w-7 fill-current" />
                </button>
                <span className="text-[11px] text-teal-400 font-semibold block">Click to Start Voice Scribe</span>
              </div>
            )}

            {(step === 1 || step === 2) && (
              <div className="space-y-3">
                {/* Pulsing Audio Waveform Simulation */}
                <div className="flex items-center justify-center gap-1.5 h-10">
                  <span className="w-1.5 h-6 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-1.5 h-10 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-4 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  <span className="w-1.5 h-8 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  <span className="w-1.5 h-5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>

                <p className="text-xs text-emerald-300 font-bold animate-pulse">
                  {step === 1 ? 'AI Speaking... (Listening next)' : 'Listening Speech... (Speaking Hindi/English)'}
                </p>
                {transcript && (
                  <p className="text-xs text-white bg-white/10 p-2 rounded-xl border border-white/10 font-mono">
                    "{transcript}"
                  </p>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="py-4 space-y-2">
                <Sparkles className="h-6 w-6 text-teal-400 animate-spin mx-auto" />
                <p className="text-xs text-teal-200 font-semibold">Gemini 1.5 Pro Analyzing Symptoms & Generating Scribe Summary...</p>
              </div>
            )}

            {step === 4 && (
              <div className="text-left space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Structured Scribe Summary Generated</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    Sent to Dr. Mehta
                  </span>
                </div>

                <div className="bg-slate-950/80 rounded-xl p-3 border border-white/10 space-y-1.5 text-[11px]">
                  <p className="text-gray-300">
                    <strong className="text-teal-400">Chief Complaint:</strong> {simulatedResponses[0].summary.chiefComplaint}
                  </p>
                  <p className="text-gray-300">
                    <strong className="text-teal-400">Risk Assessment:</strong> {simulatedResponses[0].summary.vitalsAlert}
                  </p>
                  <p className="text-gray-300">
                    <strong className="text-teal-400">Assigned OPD:</strong> {simulatedResponses[0].summary.department}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-300 rounded-xl transition-colors"
                  >
                    Test Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 bg-primary-teal hover:bg-primary-dark text-xs font-bold text-white rounded-xl transition-colors shadow"
                  >
                    Done & Return to OPD
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 relative z-10">
            <span>HIPAA Compliant Voice Scribe</span>
            <span className="text-teal-400 font-semibold">Apollo Voice AI Engine v2.4</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
