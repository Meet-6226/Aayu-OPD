import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRightLeft,
  UserCheck,
  FileText
} from 'lucide-react';

export default function AIOpdFlightControl() {
  const [trafficSimulated, setTrafficSimulated] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [swappingProgress, setSwappingProgress] = useState(false);
  const [showWhatsAppToast, setShowWhatsAppToast] = useState(false);

  // Patient 1 (Priya) initial state
  const priyaSlot = swapped ? '10:45 AM' : '10:00 AM';
  const priyaStatus = trafficSimulated
    ? swapped
      ? 'Rescheduled to 10:45 AM (No Stress)'
      : 'GRIDLOCK DELAY (+42 mins)'
    : 'In Transit (On Time)';

  // Patient 2 (Rahul) initial state
  const rahulSlot = swapped ? '10:00 AM' : '10:45 AM';
  const rahulStatus = swapped
    ? 'Called In Now — Room 302'
    : 'Arrived at Parking Lot (Waiting)';

  const handleSimulateTraffic = () => {
    setTrafficSimulated(true);
  };

  const handleTriggerAiSwap = () => {
    if (swappingProgress) return;
    setSwappingProgress(true);
    setTimeout(() => {
      setSwapped(true);
      setSwappingProgress(false);
      setShowWhatsAppToast(true);
    }, 1200);
  };

  const handleReset = () => {
    setTrafficSimulated(false);
    setSwapped(false);
    setShowWhatsAppToast(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-teal-950 rounded-3xl p-6 text-white shadow-2xl border border-teal-500/20 relative overflow-hidden my-6">
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-teal to-[#10b981] flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Navigation className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-display">
                Autonomous AI Flight Control
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-display">
              Live GPS OPD Radar & Dynamic Queue Swap
            </h3>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {!trafficSimulated ? (
            <button
              onClick={handleSimulateTraffic}
              className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Simulate Traffic Jam</span>
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs text-gray-300 rounded-xl transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset Simulation</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 relative z-10">
        
        {/* LEFT 7 COLS: Live Patient GPS Radar List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
            <span>Active En-Route Patients</span>
            <span>OPD Room 302 · Dr. Arvind Mehta</span>
          </div>

          {/* Patient 1 — Priya */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            trafficSimulated && !swapped
              ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/10'
              : swapped
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center border border-violet-500/30 shrink-0">
                  PS
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Priya Sharma</p>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-gray-300">
                      Cardiology
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-400" />
                    Silk Board Junction · {trafficSimulated ? '3 km/h (Gridlock)' : '32 km/h'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg block">
                  {priyaSlot}
                </span>
                <span className={`text-[10.5px] font-semibold mt-1 block ${
                  trafficSimulated && !swapped ? 'text-red-400 font-bold animate-pulse' : 'text-gray-400'
                }`}>
                  {priyaStatus}
                </span>
              </div>
            </div>

            {/* AI Pre-Consultation Summary Pill */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-teal-400" />
                <span>AI Pre-Summary: Chest discomfort & fatigue (3 days)</span>
              </div>
              <span className="text-[10px] text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded">
                Scribe Ready
              </span>
            </div>
          </div>

          {/* Patient 2 — Rahul */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            swapped
              ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/30 shrink-0">
                  RK
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Rahul Kumar</p>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-gray-300">
                      Cardiology
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-400" />
                    Apollo Hospital Parking Lot · 0 km away
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg block">
                  {rahulSlot}
                </span>
                <span className={`text-[10.5px] font-semibold mt-1 block ${
                  swapped ? 'text-emerald-400 font-bold' : 'text-gray-400'
                }`}>
                  {rahulStatus}
                </span>
              </div>
            </div>

            {/* AI Pre-Consultation Summary Pill */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-teal-400" />
                <span>AI Pre-Summary: BP Checkup & Prescription renewal</span>
              </div>
              <span className="text-[10px] text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded">
                Scribe Ready
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT 5 COLS: AI Decision & Action Control Panel */}
        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              <Zap className="h-4 w-4" />
              <span>AI Autonomous Engine</span>
            </div>

            {!trafficSimulated ? (
              <div className="py-8 text-center text-gray-400 text-xs leading-relaxed">
                <Clock className="h-8 w-8 text-gray-500 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-gray-300">Traffic Normal</p>
                <p className="text-[11px] mt-1">Click "Simulate Traffic Jam" above to trigger AI gridlock detection.</p>
              </div>
            ) : !swapped ? (
              <div className="space-y-3">
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-xs">
                  <div className="flex items-center gap-1.5 text-red-300 font-bold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Gridlock Alert: 42-min Delay</span>
                  </div>
                  <p className="text-[11px] text-red-200 mt-1 leading-relaxed">
                    Priya Sharma is stuck at Silk Board. If unhandled, Dr. Mehta will sit idle for 42 minutes!
                  </p>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs">
                  <p className="font-bold text-emerald-300">AI Recommendation:</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Swap Priya (10:00 AM) with Rahul (10:45 AM, waiting in parking).
                  </p>
                </div>

                <button
                  onClick={handleTriggerAiSwap}
                  disabled={swappingProgress}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {swappingProgress ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4" />
                      <span>Execute AI Auto-Swap (1-Click)</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Queue Swapped Successfully!</span>
                  </div>
                  <p className="text-[11px] text-emerald-100 mt-1 leading-relaxed">
                    Rahul called into Room 302. Priya rescheduled to 10:45 AM. Zero doctor idle time achieved!
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-3 text-[11px] space-y-1.5 text-gray-300">
                  <div className="flex justify-between">
                    <span>Doctor Idle Time Saved:</span>
                    <span className="font-bold text-emerald-400">42 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue Protected:</span>
                    <span className="font-bold text-emerald-400">₹3,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WhatsApp Alerts Sent:</span>
                    <span className="font-bold text-emerald-400">2 Patients + Doctor</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
            <span>Apollo OPD Intelligence</span>
            <span className="text-emerald-400 font-semibold">Hackathon Demo Mode</span>
          </div>
        </div>

      </div>

      {/* WhatsApp Simulated Toast Banner */}
      <AnimatePresence>
        {showWhatsAppToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 bg-[#25D366] text-slate-900 rounded-2xl p-4 shadow-xl border border-emerald-300 flex items-start gap-3.5 relative z-20"
          >
            <div className="w-8 h-8 rounded-full bg-white text-[#25D366] flex items-center justify-center font-bold shrink-0 mt-0.5 shadow">
              <MessageSquare className="h-4 w-4 fill-current" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900 text-sm">Automated WhatsApp Dispatch</p>
                <span className="text-[10px] font-bold bg-white/30 px-2 py-0.5 rounded text-slate-900">
                  2 Messages Delivered ✓✓
                </span>
              </div>
              <div className="mt-1.5 space-y-1 text-slate-800 font-medium">
                <p>💬 <strong>Priya:</strong> "Hi Priya, traffic detected at Silk Board. We've adjusted your slot to 10:45 AM. Drive safely!"</p>
                <p>💬 <strong>Rahul:</strong> "Hi Rahul, your slot has been bumped up to 10:00 AM! Please enter Room 302 now."</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
