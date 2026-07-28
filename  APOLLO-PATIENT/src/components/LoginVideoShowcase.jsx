import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export default function LoginVideoShowcase({ onExpandVideo }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentScene, setCurrentScene] = useState(0); // 0: Showdown, 1: ML Risk & WhatsApp, 2: Slot Recovery
  const [progress, setProgress] = useState(0);

  const SCENES = [
    {
      id: 0,
      title: '01. Competitor Analysis',
      tag: 'SHOWDOWN',
      subtitle: 'Why Traditional Indian OPD Systems Fail vs Nidaan One OPD Intelligence'
    },
    {
      id: 1,
      title: '02. Live ML Risk Engine',
      tag: 'XGBoost + WhatsApp',
      subtitle: '84.2% Risk Prediction (Distance + Weather) & 1-Click Hindi Bot'
    },
    {
      id: 2,
      title: '03. < 2 Min Slot Recovery',
      tag: 'RECOVERY',
      subtitle: 'Instant Waitlist Reassignment & ₹2,500 OPD Revenue Protection'
    }
  ];

  // Auto video timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentScene((scene) => (scene + 1) % 3);
          return 0;
        }
        return prev + 2; // ~5 seconds per scene
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full max-w-[480px] mx-auto space-y-4 font-inter text-white select-none">
      
      {/* ── VIDEO PLAYER MONITOR FRAME ────────────────────────────────────── */}
      <div className="relative bg-[#0a3f43] border-2 border-[#1E7F6A] rounded-[22px] shadow-2xl overflow-hidden text-left flex flex-col min-h-[440px]">
        
        {/* Video Canvas Top Bar */}
        <div className="bg-[#072c2f] px-4 py-3 border-b border-white/15 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="text-[11px] font-mono-data font-bold text-[#EAF7F2] uppercase tracking-wider">
              VIDEO DEMO · SCENE 0{currentScene + 1}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10.5px] font-mono-data text-white/70">
              0:{(currentScene * 15 + Math.floor(progress * 0.15)).toString().padStart(2, '0')} / 0:45
            </span>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
            </button>
          </div>
        </div>

        {/* ── VIDEO DISPLAY SCREEN ────────────────────────────────────────── */}
        <div className="p-5 flex-1 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#0a3f43] to-[#072c2f]">
          
          {/* Scene Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono-data font-bold text-[#EAF7F2] uppercase tracking-wider">
                {SCENES[currentScene].tag}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1E7F6A] text-white text-[9.5px] font-mono-data font-bold">
                LIVE DEMO
              </span>
            </div>
            <h4 className="font-fraunces font-bold text-xl text-white tracking-tight">
              {SCENES[currentScene].title}
            </h4>
            <p className="text-[11px] text-white/75 mt-0.5 leading-snug">
              {SCENES[currentScene].subtitle}
            </p>
          </div>

          {/* ── SCENE 0: COMPETITOR SHOWDOWN ─────────────────────────────── */}
          {currentScene === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 my-auto"
            >
              {/* Traditional Systems */}
              <div className="bg-white text-[#182033] p-3.5 rounded-[14px] space-y-1.5 border-l-4 border-[#B8623F] text-xs">
                <div className="flex items-center justify-between">
                  <strong className="font-bold text-[#B8623F]">Traditional Indian OPDs (Practo / HMS)</strong>
                  <span className="text-[9.5px] font-mono-data font-bold bg-[#B8623F]/20 text-[#B8623F] px-1.5 py-0.5 rounded">FAILING</span>
                </div>
                <p className="text-[11px] text-[#3B4452] leading-tight">
                  ✕ 2-Hour SMS Trap · 0% Risk Prediction · 30-45 Min Idle Wait
                </p>
              </div>

              {/* Nidaan One OPD System */}
              <div className="bg-[#1E7F6A] text-white p-3.5 rounded-[14px] space-y-1.5 border-l-4 border-[#EAF7F2] text-xs shadow-md">
                <div className="flex items-center justify-between">
                  <strong className="font-bold text-[#EAF7F2]">Nidaan One OPD Intelligence Engine</strong>
                  <span className="text-[9.5px] font-mono-data font-bold bg-white text-[#182033] px-1.5 py-0.5 rounded">WINNING</span>
                </div>
                <p className="text-[11px] text-white/90 leading-tight">
                  ✓ 84.2% XGBoost ML Score · Hindi WhatsApp Bot · &lt; 2 Min Recovery
                </p>
              </div>
            </motion.div>
          )}

          {/* ── SCENE 1: ML RISK & WHATSAPP ─────────────────────────────── */}
          {currentScene === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 my-auto"
            >
              {/* Risk Data Token */}
              <div className="bg-white text-[#182033] p-3 rounded-[12px] space-y-1.5 shadow-md text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono-data font-bold text-[#1E7F6A] text-[10px]">PATIENT PRIYA SHARMA</span>
                  <span className="bg-[#B8623F] text-white font-mono-data font-bold text-[9.5px] px-2 py-0.5 rounded">84.2% RISK</span>
                </div>
                <div className="flex items-center gap-2 text-[10.5px] text-[#3B4452]">
                  <span>18.5 km</span>
                  <span>•</span>
                  <span>Heavy Rain</span>
                  <span>•</span>
                  <span>+45m Traffic</span>
                </div>
              </div>

              {/* WhatsApp Bubble */}
              <div className="bg-[#128C7E]/30 border border-[#128C7E]/40 p-3 rounded-[12px] space-y-1.5 text-xs text-left">
                <div className="text-[10px] font-mono-data font-bold text-[#EAF7F2]">NIDAAN ONE WHATSAPP HINDI BOT</div>
                <div className="bg-white text-[#182033] p-2.5 rounded-[8px] text-[11px] font-medium leading-snug">
                  "Namaste Priya ji! Aapke 18km route par heavy rain alert hai. Confirm 2:30 PM slot?"
                </div>
                <div className="bg-[#128C7E] text-white text-[10.5px] font-bold py-1 px-2.5 rounded inline-block">
                  [1] Haan, main aungi on time! ✓
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SCENE 2: SLOT RECOVERY ───────────────────────────────────── */}
          {currentScene === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-2 my-auto text-center"
            >
              <div className="bg-white/10 border border-white/15 p-3 rounded-[12px]">
                <span className="font-mono-data font-bold text-[#EAF7F2] text-base block">&lt; 2 Min</span>
                <span className="text-[9.5px] text-white/70 block mt-0.5">Slot Recovery</span>
              </div>

              <div className="bg-white/10 border border-white/15 p-3 rounded-[12px]">
                <span className="font-mono-data font-bold text-[#EAF7F2] text-base block">40%</span>
                <span className="text-[9.5px] text-white/70 block mt-0.5">Leakage Saved</span>
              </div>

              <div className="bg-white/10 border border-white/15 p-3 rounded-[12px]">
                <span className="font-mono-data font-bold text-[#EAF7F2] text-base block">0 Min</span>
                <span className="text-[9.5px] text-white/70 block mt-0.5">Doctor Idle</span>
              </div>
            </motion.div>
          )}

        </div>

        {/* ── VIDEO PLAYER BOTTOM TIMELINE & BUTTONS ─────────────────────── */}
        <div className="bg-[#072c2f] p-3.5 border-t border-white/15 space-y-2.5">
          {/* Timeline Bar */}
          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1E7F6A] via-white to-[#1E7F6A] transition-all duration-150"
              style={{ width: `${((currentScene * 100) + progress) / 3}%` }}
            />
          </div>

          {/* Scene Selector Chips & Full Screen Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1">
              {SCENES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setCurrentScene(idx);
                    setProgress(0);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-data font-bold transition-all cursor-pointer ${
                    currentScene === idx
                      ? 'bg-white text-[#182033]'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  0{idx + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onExpandVideo}
              className="px-3 py-1 bg-[#1E7F6A] hover:bg-[#165B52] text-white text-[11px] font-bold rounded-[6px] flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
            >
              <span>Full Video Demo</span>
              <Maximize2 className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
