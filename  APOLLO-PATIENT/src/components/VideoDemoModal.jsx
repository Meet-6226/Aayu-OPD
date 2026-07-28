import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  Activity,
  Maximize2
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function VideoDemoModal({ isOpen, onClose, onLaunchDemo }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentScene, setCurrentScene] = useState(0); // 0: Showdown, 1: ML Risk & WhatsApp, 2: Slot Recovery
  const [progress, setProgress] = useState(0);

  const SCENES = [
    {
      id: 0,
      title: '01. Competitor Showdown',
      subtitle: 'Why traditional Indian OPD booking systems leak ₹15,000 Cr yearly vs Aether OPD Intelligence',
      duration: 12 // seconds for this scene
    },
    {
      id: 1,
      title: '02. 84.2% ML Risk Engine & WhatsApp',
      subtitle: 'Live prediction of travel distance, monsoon rain, & Hindi 2-way WhatsApp nudges',
      duration: 12
    },
    {
      id: 2,
      title: '03. Instant < 2 Min Slot Recovery',
      subtitle: 'Cancelled slots re-assigned to waitlisted patients automatically in seconds',
      duration: 12
    }
  ];

  // Automated video playback simulation
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentScene((scene) => (scene + 1) % 3);
          return 0;
        }
        return prev + 2.5; // ~4 seconds per scene cycle
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md select-none font-inter">
        
        {/* Main Video Frame Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="bg-[#165B52] border-2 border-[#1E7F6A] rounded-[24px] shadow-2xl max-w-4xl w-full text-white overflow-hidden relative flex flex-col max-h-[92vh]"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#EAF7F2_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

          {/* ── TOP CONTROL HEADER ────────────────────────────────────────── */}
          <div className="relative z-10 p-5 sm:px-8 border-b border-white/15 flex items-center justify-between gap-4 bg-[#0a3f43]">
            <BrandLogo variant="inline" />

            {/* Scene Selector Tabs */}
            <div className="hidden md:flex items-center space-x-1.5 bg-white/10 p-1 rounded-full border border-white/15">
              {SCENES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentScene(idx);
                    setProgress(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-mono-data font-bold transition-all cursor-pointer ${
                    currentScene === idx
                      ? 'bg-[#1E7F6A] text-white shadow-2xs'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── VIDEO PLAYER CANVAS (SCENE DISPLAY) ───────────────────────── */}
          <div className="relative z-10 flex-1 p-6 sm:p-8 overflow-y-auto min-h-[380px] flex flex-col justify-between">
            
            {/* Top Scene Subtitle */}
            <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-6">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="text-xs font-mono-data font-bold text-[#EAF7F2] uppercase tracking-wider">
                  VIDEO DEMO · {SCENES[currentScene].title}
                </span>
              </div>
              <span className="text-xs font-mono-data text-white/60 font-semibold">
                SCENE {currentScene + 1} OF 3
              </span>
            </div>

            {/* ── SCENE 0: COMPETITOR SHOWDOWN ─────────────────────────────── */}
            {currentScene === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 my-auto"
              >
                <div className="text-center max-w-xl mx-auto mb-4">
                  <h3 className="font-fraunces font-bold text-2xl sm:text-3xl text-white tracking-tight">
                    Traditional Indian OPD vs Aether OPD
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 mt-1">
                    How legacy OPD booking systems leak ₹15,000 Cr annually vs our AI prediction engine.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Traditional Card */}
                  <div className="bg-white text-[#182033] border-2 border-[#B8623F] p-5 rounded-[20px] space-y-3.5 text-left shadow-lg">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8ECEF]">
                      <span className="text-[11px] font-mono-data font-bold text-[#B8623F] uppercase tracking-wider">
                        TRADITIONAL SYSTEMS (PRACTO / LYBRATE / HMS)
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-[#B8623F] text-white text-[10px] font-mono-data font-bold">
                        FAILING MODEL
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#3B4452]">
                      <li className="flex items-center space-x-2">
                        <span className="text-[#B8623F] font-bold">✕</span>
                        <span><strong>2-Hour SMS Trap:</strong> SMS sent too late after patient gave up</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-[#B8623F] font-bold">✕</span>
                        <span><strong>0% Risk Intelligence:</strong> Treats 2km patient same as 35km in rain</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-[#B8623F] font-bold">✕</span>
                        <span><strong>30-45m Idle Wait:</strong> Doctor finds out slot is wasted after the fact</span>
                      </li>
                    </ul>
                  </div>

                  {/* Aether OPD Card */}
                  <div className="bg-[#0a3f43] border-2 border-[#1E7F6A] p-5 rounded-[20px] space-y-3.5 text-left shadow-lg">
                    <div className="flex items-center justify-between pb-2 border-b border-white/15">
                      <span className="text-[11px] font-mono-data font-bold text-[#EAF7F2] uppercase tracking-wider">
                        NIDAAN ONE OPD INTELLIGENCE ENGINE
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-[#1E7F6A] text-white text-[10px] font-mono-data font-bold">
                        WINNING MODEL
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-white/90">
                      <li className="flex items-center space-x-2">
                        <span className="text-[#EAF7F2] font-bold">✓</span>
                        <span><strong>Persona WhatsApp Nudges:</strong> 48h working professional notice</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-[#EAF7F2] font-bold">✓</span>
                        <span><strong>84.2% ML Risk Score:</strong> Factors travel distance, rain & history</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-[#EAF7F2] font-bold">✓</span>
                        <span><strong>&lt; 2 Min Slot Recovery:</strong> Instant waitlist reassignment</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SCENE 1: ML RISK ENGINE & WHATSAPP BOT ───────────────────── */}
            {currentScene === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 my-auto"
              >
                <div className="text-center max-w-xl mx-auto mb-4">
                  <h3 className="font-fraunces font-bold text-2xl sm:text-3xl text-white tracking-tight">
                    84.2% ML Risk Prediction & WhatsApp Bot
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 mt-1">
                    Live travel distance, rain forecast & Hindi 2-way WhatsApp confirmation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* ML Risk Factors Card */}
                  <div className="bg-white text-[#182033] border-2 border-[#1E7F6A] p-5 rounded-[20px] space-y-3 text-left shadow-lg">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8ECEF]">
                      <span className="text-[11px] font-mono-data font-bold text-[#1E7F6A] uppercase">
                        XGBoost Live Factors (Priya Sharma)
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-[#B8623F] text-white text-[10px] font-mono-data font-bold">
                        84.2% RISK
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="bg-white p-2.5 rounded-[10px] text-left">
                        <span className="text-[9px] font-mono-data text-[#3B4452] block">DISTANCE</span>
                        <span className="text-xs font-bold text-[#182033]">18.5 km</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-[10px] text-left">
                        <span className="text-[9px] font-mono-data text-[#3B4452] block">WEATHER</span>
                        <span className="text-xs font-bold text-[#182033]">Heavy Rain</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-[10px] text-left">
                        <span className="text-[9px] font-mono-data text-[#3B4452] block">TRAFFIC</span>
                        <span className="text-xs font-bold text-[#182033]">+45 Min</span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Preview Card */}
                  <div className="bg-[#128C7E]/30 border border-[#128C7E]/50 p-5 rounded-[20px] space-y-3 text-left shadow-lg">
                    <div className="flex items-center justify-between pb-2 border-b border-white/15">
                      <span className="text-[11px] font-mono-data font-bold text-white uppercase">
                        Nidaan One Official WhatsApp Bot
                      </span>
                      <span className="text-[10px] font-mono-data text-[#EAF7F2] font-bold">HINDI BOT</span>
                    </div>
                    <div className="bg-white text-[#182033] p-3 rounded-[12px] text-xs font-medium">
                      "Namaste Priya ji! Heavy rain alert on your 18km route. Confirm 2:30 PM slot?"
                    </div>
                    <div className="bg-[#128C7E] text-white text-[11px] font-bold py-1.5 px-3 rounded-[8px] inline-block">
                      [1] Haan, main aungi on time! ✓
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SCENE 2: INSTANT SLOT RECOVERY ────────────────────────────── */}
            {currentScene === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 my-auto"
              >
                <div className="text-center max-w-xl mx-auto mb-4">
                  <h3 className="font-fraunces font-bold text-2xl sm:text-3xl text-white tracking-tight">
                    Instant &lt; 2 Minute Slot Recovery
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 mt-1">
                    When cancellations happen, waitlisted patients are notified in 12s. Zero doctor idle wait.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/15 border border-white/20 p-5 rounded-[20px] text-center space-y-1">
                    <span className="text-[10px] font-mono-data font-bold text-[#EAF7F2] uppercase block">RECOVERY SPEED</span>
                    <p className="font-fraunces font-bold text-2xl sm:text-3xl text-white">&lt; 2 Min</p>
                    <p className="text-[11px] text-white/70">vs Lost Hours in Trad. HMS</p>
                  </div>

                  <div className="bg-white/15 border border-white/20 p-5 rounded-[20px] text-center space-y-1">
                    <span className="text-[10px] font-mono-data font-bold text-[#EAF7F2] uppercase block">REVENUE PROTECTION</span>
                    <p className="font-fraunces font-bold text-2xl sm:text-3xl text-white">40%</p>
                    <p className="text-[11px] text-white/70">No-Show Leakage Saved</p>
                  </div>

                  <div className="bg-white/15 border border-white/20 p-5 rounded-[20px] text-center space-y-1">
                    <span className="text-[10px] font-mono-data font-bold text-[#EAF7F2] uppercase block">DOCTOR IDLE TIME</span>
                    <p className="font-fraunces font-bold text-2xl sm:text-3xl text-white">0 Min</p>
                    <p className="text-[11px] text-white/70">Continuous Patient Flow</p>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* ── VIDEO PLAYER TIMELINE CONTROLS ───────────────────────────── */}
          <div className="relative z-10 bg-[#0a3f43] p-5 sm:px-8 border-t border-white/15 flex flex-col space-y-3">
            {/* Timeline Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden cursor-pointer">
              <div
                className="h-full bg-gradient-to-r from-[#1E7F6A] via-white to-[#1E7F6A] transition-all duration-150"
                style={{ width: `${((currentScene * 100) + progress) / 3}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white/80">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <span className="font-mono-data text-[11px] text-white/70">
                  0:{(currentScene * 15 + Math.floor(progress * 0.15)).toString().padStart(2, '0')} / 0:45
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    onClose();
                    onLaunchDemo();
                  }}
                  className="px-4 py-2 bg-white text-[#182033] font-bold text-xs rounded-[8px] hover:bg-white/80 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Launch Live Patient Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
