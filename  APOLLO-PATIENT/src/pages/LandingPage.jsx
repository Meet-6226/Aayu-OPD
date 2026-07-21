import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  ArrowRight,
  ChevronDown,
  Star,
  Quote,
  Activity,
  MessageSquare,
  Phone,
  RefreshCw,
  BarChart2,
  Shield,
  Clock,
  Users,
  TrendingDown,
  TrendingUp,
  Zap,
  Heart,
  Calendar,
  Brain,
  AlertTriangle,
  ChevronRight,
  Play,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// ── Interactive Hero Widget Component ───────────────────────────────────────
function HeroInteractiveWidget() {
  const [activeTab, setActiveTab] = useState('gps'); // 'gps' | 'ai' | 'whatsapp'
  const [whatsappSent, setWhatsappSent] = useState(false);

  return (
    <div className="hidden lg:block lg:col-span-5 relative select-none">
      {/* Glow shadow backdrop */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-primary-teal via-[#10b981] to-emerald-600 rounded-[32px] blur-xl opacity-30 animate-pulse-glow" />

      {/* Main Glass Widget Box */}
      <div className="relative bg-gradient-to-b from-gray-900/95 via-gray-900 to-black border border-white/15 rounded-[28px] p-6 shadow-2xl backdrop-blur-xl text-left overflow-hidden">
        
        {/* Widget Header & Live Status */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase font-display">
              APOLLO OPD ENGINE · LIVE
            </span>
          </div>
          <span className="text-[11px] font-semibold bg-white/10 text-white/80 px-2.5 py-1 rounded-full border border-white/10">
            Real-Time
          </span>
        </div>

        {/* Interactive Tab Controls */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl my-4 border border-white/5">
          <button
            onClick={() => setActiveTab('gps')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
              activeTab === 'gps'
                ? 'bg-primary-teal text-white shadow-lg shadow-primary-teal/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>GPS Transit</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
              activeTab === 'ai'
                ? 'bg-primary-teal text-white shadow-lg shadow-primary-teal/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>AI Risk</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
              activeTab === 'whatsapp'
                ? 'bg-primary-teal text-white shadow-lg shadow-primary-teal/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* TAB 1: GPS TRANSIT INTERACTIVE VIEW */}
        {activeTab === 'gps' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Vector Route Visualization */}
            <div className="relative h-32 bg-gradient-to-tr from-gray-800/80 to-gray-900 border border-white/10 rounded-2xl p-4 overflow-hidden flex flex-col justify-between">
              {/* Grid Lines Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px]" />
              
              {/* Animated Path SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <path
                  d="M 30 80 Q 120 20, 220 70 T 320 30"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </svg>

              {/* Start & End Pins */}
              <div className="relative z-10 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span className="text-white font-semibold">Jubilee Hills (Home)</span>
                </div>
                <div className="flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-emerald-300 font-bold">Apollo Hospital</span>
                </div>
              </div>

              {/* Center Transit Indicator */}
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-medium">Road Distance</p>
                  <p className="text-lg font-extrabold text-white leading-none">14.3 km</p>
                </div>
                <div className="bg-emerald-500 text-black font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg">
                  28 min in traffic
                </div>
              </div>
            </div>

            {/* Traffic Metrics Strip */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Live Route Traffic</p>
                <p className="text-emerald-400 font-extrabold mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Clear Road (Green)
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Target Arrival</p>
                <p className="text-white font-extrabold mt-1">10:32 AM (No Delay)</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI RISK ENGINE VIEW */}
        {activeTab === 'ai' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Risk Gauge Header */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">XGBoost Risk Score</p>
                <p className="text-2xl font-extrabold text-emerald-400 leading-tight mt-0.5">14% Low Risk</p>
                <p className="text-[11px] text-gray-400 mt-1">High probability of on-time attendance</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center font-extrabold text-emerald-400 text-base shadow-inner">
                14%
              </div>
            </div>

            {/* SHAP Feature Contributions */}
            <div className="space-y-2.5 bg-black/40 border border-white/10 rounded-2xl p-3.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">SHAP Explainability Factors</p>
              {[
                { label: 'Commute Distance (14.3km)', impact: '+4%', isRisk: true, width: '40%' },
                { label: 'Morning Consultation Slot', impact: '-6%', isRisk: false, width: '60%' },
                { label: '100% Past Attendance Record', impact: '-12%', isRisk: false, width: '85%' },
              ].map((factor, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-300 font-medium">{factor.label}</span>
                    <span className={`font-bold ${factor.isRisk ? 'text-amber-400' : 'text-emerald-400'}`}>{factor.impact}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${factor.isRisk ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: factor.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WHATSAPP AUTOMATION VIEW */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-3 animate-fadeIn">
            {/* Simulated Chat Window */}
            <div className="bg-[#0b141a] border border-white/10 rounded-2xl p-3.5 space-y-3 text-xs">
              {/* Bot Message */}
              <div className="bg-[#202c33] text-gray-100 p-3 rounded-2xl rounded-tl-none max-w-[88%] border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-emerald-400">Apollo OPD Assistant</p>
                <p className="leading-relaxed">
                  Namaste Priya! Your appointment with Dr. Kavita Reddy is set for tomorrow at 10:30 AM.
                </p>
                <p className="text-[10px] text-gray-400 pt-1">Reply <span className="text-white font-bold">1</span> to Confirm or <span className="text-white font-bold">2</span> to Reschedule.</p>
              </div>

              {/* Patient Response */}
              <div className="bg-[#005c4b] text-white p-2.5 rounded-2xl rounded-tr-none max-w-[40%] ml-auto text-right font-bold">
                1
              </div>

              {/* Bot Confirmation */}
              <div className="bg-[#202c33] text-gray-100 p-3 rounded-2xl rounded-tl-none max-w-[88%] border border-white/5">
                <p className="text-emerald-400 font-bold">✅ Confirmed!</p>
                <p className="text-[11px] text-gray-300 mt-1">Live GPS Directions link sent: maps.google.com/apollo</p>
              </div>
            </div>

            {/* Test Trigger Button */}
            <button
              onClick={() => {
                setWhatsappSent(true);
                setTimeout(() => setWhatsappSent(false), 3000);
              }}
              className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#25D366]/20"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>{whatsappSent ? '✓ Live Message Sent to Twilio!' : 'Test Live WhatsApp Notification'}</span>
            </button>
          </div>
        )}

        {/* Footer Microcopy */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            ABDM & HIPAA Secure
          </span>
          <span className="font-semibold text-white">Click tabs to test engine</span>
        </div>

      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { loginDemoUser } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleTryDemo = useCallback(() => {
    setShowDemoModal(true);
    setDemoLoading(true);
    // 2-second dramatic "logging in" moment, then redirect
    setTimeout(() => {
      loginDemoUser();
      setDemoLoading(false);
      setShowDemoModal(false);
      navigate('/home');
    }, 2000);
  }, [loginDemoUser, navigate]);

  return (
    <>
    {/* ── Demo Loading Overlay ─────────────────────────────────────────── */}
    {showDemoModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-10 shadow-2xl max-w-sm w-full mx-4 text-center relative overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-teal/5 via-transparent to-[#10b981]/5 pointer-events-none" />
          {/* Pulsing ring */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-primary-teal/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-primary-teal to-[#10b981] flex items-center justify-center shadow-lg">
              <Activity className="h-9 w-9 text-white" />
            </div>
          </div>
          <h2 className="font-display font-extrabold text-xl text-text-dark tracking-tight">Loading Demo</h2>
          <p className="text-sm text-text-light mt-2 leading-relaxed">
            Signing in as <span className="font-bold text-primary-teal">Priya Sharma</span> — demo patient
          </p>
          {/* Progress steps */}
          <div className="mt-6 space-y-2.5 text-left">
            {[
              { label: 'Loading patient profile...', done: true },
              { label: 'Fetching appointments...', done: true },
              { label: 'Connecting AI risk engine...', done: demoLoading },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100'
                }`}>
                  {step.done
                    ? <Check className="h-3 w-3 stroke-[2.5]" />
                    : <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                </div>
                <span className={`text-xs font-medium ${
                  step.done ? 'text-text-dark' : 'text-text-light'
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-light mt-6">This is a hackathon demo — no real data is used.</p>
        </div>
      </div>
    )}
    <div className="min-h-screen bg-white text-text-medium font-sans selection:bg-light-teal selection:text-primary-teal">
      
      {/* SECTION 1 — NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-border-custom/50 z-50 transition-all duration-200">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 h-full flex items-center justify-between">
          {/* Left Group */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-teal to-[#10b981] flex items-center justify-center shrink-0 shadow-md shadow-primary-teal/20 transition-transform duration-300 group-hover:rotate-12">
              <span className="text-white font-bold text-[14px]">A</span>
            </div>
            <span className="font-display font-bold text-[19px] text-primary-teal tracking-tight">
              Apollo <span className="text-[#10b981]">OPD</span>
            </span>
          </Link>

          {/* Center Group (Desktop only) */}
          <div className="hidden lg:flex items-center space-x-8 font-medium">
            <a href="#problem" className="text-[14px] text-text-medium hover:text-primary-teal transition-colors duration-200">
              Problem
            </a>
            <a href="#solution" className="text-[14px] text-text-medium hover:text-primary-teal transition-colors duration-200">
              Solution
            </a>
            <a href="#features" className="text-[14px] text-text-medium hover:text-primary-teal transition-colors duration-200">
              Features
            </a>
            <a href="#results" className="text-[14px] text-text-medium hover:text-primary-teal transition-colors duration-200">
              Results
            </a>
            <a href="#faq" className="text-[14px] text-text-medium hover:text-primary-teal transition-colors duration-200">
              FAQ
            </a>
          </div>

          {/* Right Group */}
          <div className="flex items-center space-x-6">
            <a
              href="https://apollo-opd-staff.vercel.app/staff/login"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-block text-[14px] font-medium text-text-medium hover:text-primary-teal transition-colors duration-200"
            >
              Staff Login
            </a>
            <Link
              to="/login"
              className="px-5 py-2.5 bg-primary-teal text-white text-[14px] font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-md shadow-primary-teal/10 hover:shadow-primary-teal/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 2 — HERO */}
      <section className="relative pt-[112px] pb-[64px] lg:pt-[144px] lg:pb-[112px] bg-gradient-to-b from-[#f2fcfb] via-white to-[#f8fafc] overflow-hidden">
        {/* Glow effect in background */}
        <div className="absolute top-24 right-1/4 w-[400px] h-[400px] rounded-full bg-primary-teal/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute top-48 left-1/3 w-[300px] h-[300px] rounded-full bg-[#10b981]/5 blur-[100px] pointer-events-none"></div>

        <div className="max-w-[1280px] mx-auto px-6 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Pill badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary-teal/5 border border-primary-teal/10 text-primary-teal mb-8 select-none animate-pulse-glow">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] font-display">
                  Apollo Hospitals · AI-Powered OPD Desk
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display font-extrabold text-[40px] lg:text-[62px] leading-[1.05] text-text-dark tracking-tight">
                Never Miss a <br />
                <span className="text-gradient">Doctor's Appointment</span> <br />
                Again.
              </h1>

              {/* Subtitle */}
              <p className="text-[18px] text-text-medium leading-[1.7] max-w-[500px] mt-6">
                Apollo OPD Intelligence predicts cancellation risks, automates personalized WhatsApp reminders, and matches patient GPS travel times to keep the clinic running on schedule.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 mt-10 w-full sm:w-auto">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-8 py-4 bg-primary-teal text-white font-bold text-base rounded-xl hover:bg-primary-dark transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] glow-shadow-teal shadow-lg"
                >
                  <span>Book Appointment</span>
                  <ArrowRight className="h-[18px] w-[18px]" />
                </Link>

                {/* ── Try Demo Button ── */}
                <button
                  onClick={handleTryDemo}
                  disabled={demoLoading}
                  className="group relative flex items-center gap-2.5 px-7 py-4 font-bold text-base rounded-xl border-2 border-primary-teal/30 bg-gradient-to-r from-primary-teal/5 to-[#10b981]/5 text-primary-teal hover:border-primary-teal hover:bg-primary-teal/10 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] overflow-hidden"
                >
                  {/* Shimmer sweep */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                  {/* Pulsing dot */}
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]" />
                  </span>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Try Live Demo</span>
                  <span className="text-[10px] font-semibold bg-primary-teal text-white px-2 py-0.5 rounded-full ml-0.5">No signup</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 mt-12 pt-6 border-t border-[#e5e7eb]/60 w-full">
                <div className="flex items-center space-x-2 text-text-medium">
                  <Check className="h-4.5 w-4.5 text-primary-teal bg-primary-teal/10 rounded-full p-0.5" />
                  <span className="text-[13px] font-semibold">ABDM Compliant</span>
                </div>
                <div className="flex items-center space-x-2 text-text-medium">
                  <Check className="h-4.5 w-4.5 text-primary-teal bg-primary-teal/10 rounded-full p-0.5" />
                  <span className="text-[13px] font-semibold">SHAP Explainability</span>
                </div>
                <div className="flex items-center space-x-2 text-text-medium">
                  <Check className="h-4.5 w-4.5 text-primary-teal bg-primary-teal/10 rounded-full p-0.5" />
                  <span className="text-[13px] font-semibold">WhatsApp Integrated</span>
                </div>
                <div className="flex items-center space-x-2 text-text-medium">
                  <Check className="h-4.5 w-4.5 text-primary-teal bg-primary-teal/10 rounded-full p-0.5" />
                  <span className="text-[13px] font-semibold">Hindi Voice Calls</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — Next-Gen Interactive Intelligence Widget */}
            <HeroInteractiveWidget />

          </div>
        </div>
      </section>

      {/* SECTION 3 — TRUST BAR */}
      <section className="bg-bg-subtle border-y border-[#f3f4f6] py-12">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display font-bold text-[28px] lg:text-[36px] text-text-dark leading-none">
                25-30%
              </p>
              <p className="text-[14px] text-gray-500 mt-2 max-w-[220px] mx-auto leading-tight">
                Daily No-Show Rate in Indian Hospitals
              </p>
            </div>
            <div>
              <p className="font-display font-bold text-[28px] lg:text-[36px] text-text-dark leading-none">
                ₹15,000Cr
              </p>
              <p className="text-[14px] text-gray-500 mt-2 max-w-[220px] mx-auto leading-tight">
                Annual Revenue Lost Across India
              </p>
            </div>
            <div>
              <p className="font-display font-bold text-[28px] lg:text-[36px] text-text-dark leading-none">
                84%
              </p>
              <p className="text-[14px] text-gray-500 mt-2 max-w-[220px] mx-auto leading-tight">
                Our ML Prediction Accuracy
              </p>
            </div>
            <div>
              <p className="font-display font-bold text-[28px] lg:text-[36px] text-text-dark leading-none">
                &lt; 2 min
              </p>
              <p className="text-[14px] text-gray-500 mt-2 max-w-[220px] mx-auto leading-tight">
                Average Slot Recovery Time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — PROBLEM */}
      <section id="problem" className="bg-white py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          {/* Section Header */}
          <div className="max-w-[640px] mb-16 text-left">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-primary-teal block mb-3">
              The Problem
            </span>
            <h2 className="font-display font-bold text-[30px] lg:text-[40px] text-text-dark leading-tight tracking-tight">
              Every empty chair costs Apollo ₹3,000
            </h2>
            <p className="text-[18px] text-text-medium mt-4 leading-[1.7]">
              25-30% of OPD patients don't show up. Doctors wait. Slots go empty. Revenue is lost. And nobody knows until it's too late.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white border border-border-custom rounded-2xl p-7 hover:border-[#d1d5db] hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[12px] bg-red-50 text-red-500 flex items-center justify-center mb-5 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-text-dark mb-2">
                  Doctors wait for no-shows
                </h3>
                <p className="text-[14px] text-text-light leading-relaxed mb-6">
                  A doctor finds out a patient cancelled when nobody walks in. 30 minutes of idle time they can't recover.
                </p>
              </div>
              <div className="border-t border-[#f3f4f6] pt-4">
                <p className="font-display font-bold text-[28px] text-red-500 leading-none">
                  30 min
                </p>
                <p className="text-[12px] text-text-light mt-1">
                  avg idle time per no-show
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-border-custom rounded-2xl p-7 hover:border-[#d1d5db] hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[12px] bg-red-50 text-red-500 flex items-center justify-center mb-5 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-text-dark mb-2">
                  Patients get wrong reminders
                </h3>
                <p className="text-[14px] text-text-light leading-relaxed mb-6">
                  A working professional needs 48 hours to plan leave. An elderly patient needs their family notified. Everyone gets the same generic SMS.
                </p>
              </div>
              <div className="border-t border-[#f3f4f6] pt-4">
                <p className="font-display font-bold text-[28px] text-red-500 leading-none">
                  1 size
                </p>
                <p className="text-[12px] text-text-light mt-1">
                  fits nobody approach
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-border-custom rounded-2xl p-7 hover:border-[#d1d5db] hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[12px] bg-red-50 text-red-500 flex items-center justify-center mb-5 shrink-0">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-text-dark mb-2">
                  Revenue leaks silently
                </h3>
                <p className="text-[14px] text-text-light leading-relaxed mb-6">
                  No-shows aren't tracked. There's no prediction, no recovery, no system. Just a paper register and hope.
                </p>
              </div>
              <div className="border-t border-[#f3f4f6] pt-4">
                <p className="font-display font-bold text-[28px] text-red-500 leading-none">
                  ₹3,000
                </p>
                <p className="text-[12px] text-text-light mt-1">
                  lost per empty slot
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5 — SOLUTION */}
      <section id="solution" className="bg-bg-subtle py-16 lg:py-24 border-y border-border-custom">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          {/* Section Header */}
          <div className="max-w-[500px] mb-16 text-center mx-auto">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-primary-teal block mb-3">
              Our Solution
            </span>
            <h2 className="font-display font-bold text-[30px] lg:text-[40px] text-text-dark leading-tight tracking-tight">
              Predict. Remind. Recover.
            </h2>
            <p className="text-[18px] text-[#6b7280] mt-4 leading-[1.6]">
              Three steps. Fully automated. Zero manual effort.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white border border-border-custom rounded-2xl p-8 hover:border-[#d1d5db] hover:shadow-sm transition-all duration-200 relative overflow-hidden">
              <span className="font-display font-bold text-[64px] text-[#f3f4f6] absolute top-6 right-6 leading-none select-none">
                01
              </span>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-[12px] bg-light-teal text-primary-teal flex items-center justify-center mb-5 shrink-0">
                  <Brain className="h-[22px] w-[22px]" />
                </div>
                <h3 className="text-[18px] font-semibold text-text-dark mb-3">
                  AI Predicts No-Shows
                </h3>
                <p className="text-[14px] text-text-light leading-relaxed">
                  XGBoost ML model scores every patient 0-100%. SHAP explains exactly why — distance, history, weather, lead time. Receptionist sees risk before the day starts.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-border-custom rounded-2xl p-8 hover:border-[#d1d5db] hover:shadow-sm transition-all duration-200 relative overflow-hidden">
              <span className="font-display font-bold text-[64px] text-[#f3f4f6] absolute top-6 right-6 leading-none select-none">
                02
              </span>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-[12px] bg-[#fff3d6] text-amber-600 flex items-center justify-center mb-5 shrink-0">
                  <MessageSquare className="h-[22px] w-[22px]" />
                </div>
                <h3 className="text-[18px] font-semibold text-text-dark mb-3">
                  Smart Reminders Sent
                </h3>
                <p className="text-[14px] text-text-light leading-relaxed">
                  Patient chooses their persona — Working Professional gets 48h notice, Elderly gets family notified, Student gets casual nudge. Right message, right time, right person.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-border-custom rounded-2xl p-8 hover:border-[#d1d5db] hover:shadow-sm transition-all duration-200 relative overflow-hidden">
              <span className="font-display font-bold text-[64px] text-[#f3f4f6] absolute top-6 right-6 leading-none select-none">
                03
              </span>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-[12px] bg-[#e8faee] text-green-600 flex items-center justify-center mb-5 shrink-0">
                  <RefreshCw className="h-[22px] w-[22px]" />
                </div>
                <h3 className="text-[18px] font-semibold text-text-dark mb-3">
                  Slots Recovered Instantly
                </h3>
                <p className="text-[14px] text-text-light leading-relaxed">
                  Patient cancels via WhatsApp? Slot opens instantly. Waitlist notified in seconds. New patient booked. Revenue ticker updates live. Doctor never notices.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6 — WORKFLOW TIMELINE */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          {/* Section Header */}
          <div className="max-w-[540px] mb-16 text-center mx-auto">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-primary-teal block mb-3">
              How It Works
            </span>
            <h2 className="font-display font-bold text-[30px] lg:text-[40px] text-text-dark leading-tight tracking-tight">
              From Booking to Recovery
            </h2>
            <p className="text-[18px] text-[#6b7280] mt-4 leading-[1.6]">
              Follow Priya's journey — a working professional who booked a cardiology appointment.
            </p>
          </div>

          {/* Timeline */}
          <div className="max-w-[768px] mx-auto relative">
            {/* Timeline track line */}
            <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-border-custom z-0"></div>

            {/* Steps wrapper */}
            <div className="space-y-10">
              
              {/* Step 1 */}
              <div className="flex space-x-6 items-start relative">
                <div className="w-[48px] h-[48px] rounded-full bg-primary-teal text-white flex items-center justify-center border-4 border-white font-bold text-[14px] shrink-0 z-10 shadow-none">
                  1
                </div>
                <div className="bg-white border border-border-custom rounded-xl p-5 flex-grow">
                  <span className="text-[12px] uppercase tracking-widest font-semibold text-primary-teal block mb-1">
                    Day 0
                  </span>
                  <h4 className="text-[16px] font-semibold text-text-dark mb-2">
                    Priya books appointment
                  </h4>
                  <p className="text-[14px] text-text-light leading-relaxed">
                    She books Dr. Mehta (Cardiology) for July 3 via the patient portal. Instant WhatsApp confirmation sent.
                  </p>
                  <div className="text-[12px] text-text-light pt-3 mt-3 border-t border-[#f3f4f6]">
                    Booking ID: APL-2026-0847 · Fee: ₹800
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex space-x-6 items-start relative">
                <div className="w-[48px] h-[48px] rounded-full bg-primary-teal text-white flex items-center justify-center border-4 border-white font-bold text-[14px] shrink-0 z-10 shadow-none">
                  2
                </div>
                <div className="bg-white border border-border-custom rounded-xl p-5 flex-grow">
                  <span className="text-[12px] uppercase tracking-widest font-semibold text-primary-teal block mb-1">
                    Day 0
                  </span>
                  <h4 className="text-[16px] font-semibold text-text-dark mb-2">
                    Persona preference set
                  </h4>
                  <p className="text-[14px] text-text-light leading-relaxed">
                    WhatsApp asks how she wants to be reminded. She replies '1' — Working Professional. System schedules 48h + 24h + morning reminders.
                  </p>
                  <div className="text-[12px] text-text-light pt-3 mt-3 border-t border-[#f3f4f6]">
                    Persona: Working Professional · Schedule: 48h, 24h, morning
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex space-x-6 items-start relative">
                <div className="w-[48px] h-[48px] rounded-full bg-red-500 text-white flex items-center justify-center border-4 border-white font-bold text-[14px] shrink-0 z-10 shadow-none">
                  3
                </div>
                <div className="bg-[#fef2f2] border border-border-custom rounded-xl p-5 flex-grow">
                  <span className="text-[12px] uppercase tracking-widest font-semibold text-red-600 block mb-1">
                    Day 0
                  </span>
                  <h4 className="text-[16px] font-semibold text-text-dark mb-2">
                    ML scores her risk
                  </h4>
                  <p className="text-[14px] text-text-light leading-relaxed">
                    XGBoost model runs. Risk score: 84% HIGH. SHAP factors: Distance 38km (+32%), Past no-shows 2/6 (+28%), Lead time 21 days (+18%), Rain forecast (+6%).
                  </p>
                  <div className="text-[12px] text-text-light pt-3 mt-3 border-t border-[#f3f4f6]">
                    Model: XGBoost · Features: 18 · SHAP: top 6 factors shown
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex space-x-6 items-start relative">
                <div className="w-[48px] h-[48px] rounded-full bg-primary-teal text-white flex items-center justify-center border-4 border-white font-bold text-[14px] shrink-0 z-10 shadow-none">
                  4
                </div>
                <div className="bg-white border border-border-custom rounded-xl p-5 flex-grow">
                  <span className="text-[12px] uppercase tracking-widest font-semibold text-primary-teal block mb-1">
                    48h before
                  </span>
                  <h4 className="text-[16px] font-semibold text-text-dark mb-2">
                    48-hour reminder sent
                  </h4>
                  <p className="text-[14px] text-text-light leading-relaxed">
                    'Hi Priya! Your appointment with Dr. Mehta is in 48 hours. Plan your leave today. Reply 1 to confirm, 2 to reschedule.'
                  </p>
                  <div className="text-[12px] text-text-light pt-3 mt-3 border-t border-[#f3f4f6]">
                    Channel: WhatsApp · Status: Delivered
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex space-x-6 items-start relative">
                <div className="w-[48px] h-[48px] rounded-full bg-amber-500 text-white flex items-center justify-center border-4 border-white font-bold text-[14px] shrink-0 z-10 shadow-none">
                  5
                </div>
                <div className="bg-[#fff3d6] border border-border-custom rounded-xl p-5 flex-grow">
                  <span className="text-[12px] uppercase tracking-widest font-semibold text-[#92400e] block mb-1">
                    24h before
                  </span>
                  <h4 className="text-[16px] font-semibold text-text-dark mb-2">
                    She replies '2' — Reschedule
                  </h4>
                  <p className="text-[14px] text-text-light leading-relaxed">
                    Priya can't make it. She replies 2. Instantly: slot opens on dashboard, waitlist is checked, Rahul Verma gets notified.
                  </p>
                  <div className="text-[12px] text-text-light pt-3 mt-3 border-t border-[#f3f4f6]">
                    Slot freed · Waitlist: 3 patients · Revenue at risk: ₹2,500
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex space-x-6 items-start relative">
                <div className="w-[48px] h-[48px] rounded-full bg-green-500 text-white flex items-center justify-center border-4 border-white font-bold text-[14px] shrink-0 z-10 shadow-none">
                  6
                </div>
                <div className="bg-[#e8faee] border border-border-custom rounded-xl p-5 flex-grow">
                  <span className="text-[12px] uppercase tracking-widest font-semibold text-green-700 block mb-1">
                    2 min later
                  </span>
                  <h4 className="text-[16px] font-semibold text-text-dark mb-2">
                    Slot recovered — Rahul booked
                  </h4>
                  <p className="text-[14px] text-text-light leading-relaxed">
                    Rahul confirms via WhatsApp. Slot filled. Revenue ticker: ₹1.8L → ₹1.55L. Doctor WhatsApp: 'Your 10 AM changed. Rahul at 10:15.'
                  </p>
                  <div className="text-[12px] text-text-light pt-3 mt-3 border-t border-[#f3f4f6]">
                    Recovery time: 2 minutes · Revenue saved: ₹2,500
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — DASHBOARD PREVIEW (Dark Section) */}
      <section className="bg-primary-teal py-16 lg:py-24 text-center">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          <span className="text-[12px] uppercase tracking-widest text-[#e5f9f8]/70 block mb-3 font-semibold">
            Product Preview
          </span>
          <h2 className="font-display font-bold text-[30px] lg:text-[40px] text-white tracking-tight leading-tight">
            Two Portals. One System.
          </h2>
          <p className="text-[16px] text-white/70 mt-4 max-w-[540px] mx-auto leading-relaxed">
            Staff dashboard for hospital operations. Patient portal for booking. Both connected in real-time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 text-left">
            {/* Card 1 */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3.5 pb-5 border-b border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">Staff Dashboard</h3>
                    <p className="text-[12px] text-white/50 mt-0.5">Receptionist · Doctor · Admin</p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3.5">
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Morning Briefing — daily digest at 9 AM</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Appointment List — risk scores + persona tags</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">SHAP Breakdown — why each patient was flagged</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Slot Recovery — fill cancellations instantly</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Doctor View — simple schedule + late notify</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Admin Analytics — heatmap + revenue trends</span>
                  </li>
                </ul>
              </div>

              <a
                href="http://localhost:5173/staff/login"
                className="mt-8 py-3 px-5 border border-white/30 text-white rounded-lg text-[14px] hover:border-white/60 transition-colors block text-center font-medium"
              >
                Open Staff Dashboard &rarr;
              </a>
            </div>

            {/* Card 2 */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3.5 pb-5 border-b border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">Patient Portal</h3>
                    <p className="text-[12px] text-white/50 mt-0.5">Book · Manage · Get Reminded</p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3.5">
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Browse Doctors — filter by department + rating</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Book Appointment — select date + time slot</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Set Persona — choose your reminder preference</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Family Contact — elderly patients add caretaker</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">My Appointments — track upcoming + past visits</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-mint-green stroke-[2.5] mt-0.5 shrink-0" />
                    <span className="text-[14px] text-white/80 leading-snug">Smart Reminders — WhatsApp + voice reminders</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/login"
                className="mt-8 py-3 px-5 bg-white text-primary-teal rounded-lg text-[14px] hover:bg-[#e5f9f8] transition-colors block text-center font-medium"
              >
                Book Appointment &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FEATURES BENTO GRID */}
      <section id="features" className="bg-white py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          {/* Section Header */}
          <div className="max-w-[600px] mb-16 text-center mx-auto">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-primary-teal block mb-3">
              Features
            </span>
            <h2 className="font-display font-bold text-[30px] lg:text-[40px] text-text-dark leading-tight tracking-tight">
              Built for India's OPD Reality
            </h2>
            <p className="text-[18px] text-[#6b7280] mt-4 leading-[1.6]">
              Not a generic reminder app. Built after sitting in real OPD waiting rooms.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Bento 1: XGBoost spans 2 columns */}
            <div className="lg:col-span-2 bg-light-teal rounded-2xl p-8 min-h-[240px] flex flex-col justify-between border border-border-custom hover:shadow-sm transition-all duration-200">
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary-teal text-white flex items-center justify-center mb-5 shrink-0">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-[18px] font-semibold text-primary-teal mb-2">
                  XGBoost + SHAP Explainability
                </h3>
                <p className="text-[14px] text-text-medium leading-relaxed max-w-[460px]">
                  Calculate accurate no-show probabilities using ML. View local explanation factors like weather changes, travel distance, and previous booking lead time directly on the staff schedule.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                <span className="bg-primary-teal/10 text-primary-teal px-3 py-1.5 rounded-lg text-xs font-semibold">Distance +32%</span>
                <span className="bg-primary-teal/10 text-primary-teal px-3 py-1.5 rounded-lg text-xs font-semibold">No-shows +28%</span>
                <span className="bg-primary-teal/10 text-primary-teal px-3 py-1.5 rounded-lg text-xs font-semibold">Lead time +18%</span>
                <span className="bg-primary-teal/10 text-primary-teal px-3 py-1.5 rounded-lg text-xs font-semibold">Rain +6%</span>
              </div>
            </div>

            {/* Bento 2: Persona-Based WhatsApp */}
            <div className="bg-[#fff3d6] rounded-2xl p-8 min-h-[240px] flex flex-col justify-between border border-[#f5e2b3] hover:shadow-sm transition-all duration-200">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-5 shrink-0">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#92400e] mb-2">
                  Persona-Based WhatsApp
                </h3>
                <p className="text-[14px] text-text-medium leading-relaxed">
                  Tailored reminders sent over WhatsApp to match patient behaviors. Choose working schedules, student alerts, or direct caretaker setups.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                <span className="bg-blue-100 text-blue-700 rounded-lg px-2.5 py-1 text-xs font-semibold">Professional</span>
                <span className="bg-purple-100 text-purple-700 rounded-lg px-2.5 py-1 text-xs font-semibold">Elderly</span>
                <span className="bg-orange-100 text-orange-700 rounded-lg px-2.5 py-1 text-xs font-semibold">Student</span>
              </div>
            </div>

            {/* Bento 3: Hindi Voice Calls */}
            <div className="bg-white border border-border-custom rounded-2xl p-8 hover:shadow-sm hover:border-[#d1d5db] transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="text-[18px] font-semibold text-text-dark mb-2">
                  Hindi Voice Calls
                </h3>
                <p className="text-[14px] text-text-light leading-relaxed">
                  Automatic IVR calling for senior citizens who do not use active smartphone messaging apps. Records verbal replies.
                </p>
              </div>
              <p className="text-[12px] text-text-light mt-6">
                Powered by Vapi AI · Free tier
              </p>
            </div>

            {/* Bento 4: Live Slot Recovery spans 2 columns */}
            <div className="lg:col-span-2 bg-[#e8faee] rounded-2xl p-8 flex flex-col md:flex-row justify-between gap-6 border border-[#c6f0d4] hover:shadow-sm transition-all duration-200">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center mb-5 shrink-0">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <h3 className="text-[18px] font-semibold text-green-900 mb-2">
                    Live Slot Recovery + Overbooking
                  </h3>
                  <p className="text-[14px] text-text-medium leading-relaxed max-w-[420px]">
                    Instantly fill vacant slots from waitlists using automated templates. System opens availability to pending patients automatically.
                  </p>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end justify-center shrink-0 text-right bg-white/40 p-5 rounded-xl border border-white/50 min-w-[180px]">
                <p className="font-display font-bold text-[32px] text-green-700 leading-none">₹60K</p>
                <p className="text-[12px] text-green-600 font-semibold mt-1">recovered today</p>
                <p className="text-[20px] font-bold text-green-500 mt-3 leading-none">₹1.8L &rarr; ₹1.2L</p>
                <p className="text-[12px] text-green-600 font-semibold mt-1">at risk reduced</p>
              </div>
            </div>

            {/* Bento 5: Doctor Utilization */}
            <div className="bg-white border border-border-custom rounded-2xl p-8 hover:shadow-sm hover:border-[#d1d5db] transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 shrink-0">
                <BarChart2 className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-semibold text-text-dark mb-2">
                Doctor Utilization Heatmap
              </h3>
              <p className="text-[14px] text-text-light leading-relaxed">
                Visual grid tracking patient load across days and peak hour timeslots. Balances department flow dynamically.
              </p>
            </div>

            {/* Bento 6: ABDM / ABHA Ready */}
            <div className="bg-white border border-border-custom rounded-2xl p-8 hover:shadow-sm hover:border-[#d1d5db] transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-semibold text-text-dark mb-2">
                ABDM / ABHA Ready
              </h3>
              <p className="text-[14px] text-text-light leading-relaxed">
                Fully compliant with India's Ayushman Bharat Digital Mission guidelines. Secured data storage with consent frameworks.
              </p>
            </div>

            {/* Bento 7: Family Contact Chain */}
            <div className="bg-white border border-border-custom rounded-2xl p-8 hover:shadow-sm hover:border-[#d1d5db] transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 shrink-0">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-semibold text-text-dark mb-2">
                Family Contact Chain
              </h3>
              <p className="text-[14px] text-text-light leading-relaxed">
                Connect secondary phone numbers for dependent relatives. Automatically loop family members into reminder loops.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 9 — RESULTS */}
      <section id="results" className="bg-bg-subtle py-16 lg:py-24 border-y border-border-custom">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          {/* Section Header */}
          <div className="max-w-[500px] mb-16 text-center mx-auto">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-primary-teal block mb-3">
              Impact
            </span>
            <h2 className="font-display font-bold text-[30px] lg:text-[40px] text-text-dark leading-tight tracking-tight">
              Numbers That Matter
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white border border-border-custom rounded-2xl p-6 text-center hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4 shrink-0">
                <TrendingDown className="h-6 w-6" />
              </div>
              <p className="font-display font-bold text-[32px] text-green-600 leading-none">
                40%
              </p>
              <h4 className="text-[14px] font-semibold text-text-dark mt-3 mb-1">
                No-show reduction
              </h4>
              <p className="text-[12px] text-text-light">
                After implementing smart persona-based reminders
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-border-custom rounded-2xl p-6 text-center hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-light-teal text-primary-teal flex items-center justify-center mx-auto mb-4 shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p className="font-display font-bold text-[32px] text-primary-teal leading-none">
                ₹38.5L
              </p>
              <h4 className="text-[14px] font-semibold text-text-dark mt-3 mb-1">
                Revenue recovered / month
              </h4>
              <p className="text-[12px] text-text-light">
                From slot recovery + waitlist notifications
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-border-custom rounded-2xl p-6 text-center hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-[#fff3d6] text-amber-600 flex items-center justify-center mx-auto mb-4 shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <p className="font-display font-bold text-[32px] text-amber-600 leading-none">
                127 hrs
              </p>
              <h4 className="text-[14px] font-semibold text-text-dark mt-3 mb-1">
                Doctor time saved / month
              </h4>
              <p className="text-[12px] text-text-light">
                Eliminating idle waiting for no-show patients
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-border-custom rounded-2xl p-6 text-center hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shrink-0">
                <RefreshCw className="h-6 w-6" />
              </div>
              <p className="font-display font-bold text-[32px] text-blue-600 leading-none">
                89
              </p>
              <h4 className="text-[14px] font-semibold text-text-dark mt-3 mb-1">
                Slots reused this month
              </h4>
              <p className="text-[12px] text-text-light">
                Cancelled appointments filled from waitlist
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 10 — FAQ */}
      <section id="faq" className="bg-bg-subtle py-16 lg:py-24">
        <div className="max-w-[768px] mx-auto px-6 md:px-8">
          {/* Section Header */}
          <div className="max-w-[500px] mb-12 text-center mx-auto">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-primary-teal block mb-3">
              FAQ
            </span>
            <h2 className="font-display font-bold text-[32px] text-text-dark leading-tight tracking-tight">
              Common Questions
            </h2>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            
            {/* Q1 */}
            <details className="group border border-border-custom rounded-xl bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-text-dark pr-4 select-none">
                  How does the ML model predict no-shows?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-text-light shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-text-medium leading-relaxed">
                  Our XGBoost machine learning model analyzes 18 distinct parameters (including patient historical attendance, travel distance, lead time from booking, and weather forecast) to output a risk score from 0-100%.
                </p>
              </div>
            </details>

            {/* Q2 */}
            <details className="group border border-border-custom rounded-xl bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-text-dark pr-4 select-none">
                  Is the WhatsApp integration real?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-text-light shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-text-medium leading-relaxed">
                  Yes, the system supports 2-way real-time messaging using standard WhatsApp templates. Patients can confirm, cancel, or trigger reschedules directly by replying with numbers.
                </p>
              </div>
            </details>

            {/* Q3 */}
            <details className="group border border-border-custom rounded-xl bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-text-dark pr-4 select-none">
                  What about elderly patients who don't use WhatsApp?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-text-light shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-text-medium leading-relaxed">
                  We have automated voice calls in Hindi (or regional languages) that read out the slot timings and capture responses, plus the option to notify their family contact chain.
                </p>
              </div>
            </details>

            {/* Q4 */}
            <details className="group border border-border-custom rounded-xl bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-text-dark pr-4 select-none">
                  What is SHAP explainability?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-text-light shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-text-medium leading-relaxed">
                  SHAP breaks down the model output into contributions. Instead of just giving a score, it displays 'Distance +32%, Past no-show +28%' so staff can understand the context.
                </p>
              </div>
            </details>

            {/* Q5 */}
            <details className="group border border-border-custom rounded-xl bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-text-dark pr-4 select-none">
                  How does slot recovery work?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-text-light shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-text-medium leading-relaxed">
                  When a patient replies to cancel or reschedule, the slot opens instantly. Our engine checks the waitlist, sends notifications, and secures a replacement booking within minutes.
                </p>
              </div>
            </details>

            {/* Q6 */}
            <details className="group border border-border-custom rounded-xl bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-text-dark pr-4 select-none">
                  Can this integrate with hospital HMS?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-text-light shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-text-medium leading-relaxed">
                  Yes, we expose a full REST API that syncs with standard HMS platforms like Practo Ray, MediXcel, and ABDM/ABHA configurations.
                </p>
              </div>
            </details>

          </div>
        </div>
      </section>

      {/* SECTION 11 — CTA */}
      <section className="bg-primary-teal py-20 text-center">
        <div className="max-w-[768px] mx-auto px-6 md:px-8">
          <h2 className="font-display font-bold text-[36px] lg:text-[40px] text-white tracking-tight leading-tight">
            Stop Losing Patients. Start Recovering Revenue.
          </h2>
          <p className="text-[16px] text-white/70 mt-4 max-w-[460px] mx-auto leading-relaxed">
            Apollo OPD Intelligence is ready.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-primary-teal font-semibold text-[16px] rounded-xl hover:bg-light-teal transition-all duration-200"
            >
              Book Appointment
            </Link>
            <a
              href="http://localhost:5173/staff/login"
              className="px-8 py-4 border-2 border-white/30 text-white font-medium text-[16px] rounded-xl hover:border-white/60 transition-all duration-200"
            >
              Staff Dashboard &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 12 — FOOTER */}
      <footer className="bg-white border-t border-[#f3f4f6] py-8">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-medium">
          {/* Left Group */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-primary-teal flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-[11px]">A</span>
              </div>
              <span className="font-medium text-[#374151]">Apollo OPD Intelligence</span>
            </div>
            <span className="hidden md:inline text-text-light">&#183;</span>
            <span className="text-text-light">Demo Day 2026</span>
          </div>

          {/* Right Group */}
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/login" className="text-text-light hover:text-[#374151] transition-colors duration-200">
              Patient Portal
            </Link>
            <a
              href="https://apollo-opd-staff.vercel.app/staff/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-light hover:text-[#374151] transition-colors duration-200"
            >
              Staff Login
            </a>
            <span className="text-gray-300">Built by Team Apollo</span>
          </div>
        </div>
      </footer>

    </div>
    </>
  );
}
