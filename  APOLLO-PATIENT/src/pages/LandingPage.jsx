import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  Pause,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LivingPulseNetwork from '../components/LivingPulseNetwork';
import BrandLogo from '../components/BrandLogo';
import VideoDemoModal from '../components/VideoDemoModal';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const navigate = useNavigate();
  const { loginDemoUser } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Workflow Timeline Interactive Stepper State
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [isWorkflowPlaying, setIsWorkflowPlaying] = useState(true);

  // Scroll-Aware Navbar State
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    if (!isWorkflowPlaying) return;
    const interval = setInterval(() => {
      setActiveWorkflowStep((prev) => (prev + 1) % 6);
    }, 3200);
    return () => clearInterval(interval);
  }, [isWorkflowPlaying]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 20);
      setScrollProgress(totalHeight > 0 ? (currentScroll / totalHeight) * 100 : 0);

      // Section tracking
      const sections = ['problem', 'comparison', 'solution', 'workflow', 'features', 'results', 'faq'];
      const scrollPosition = currentScroll + 220;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP Refs for single orchestrated load sequence
  const dataCalloutRef = useRef(null);
  const headlineLine1Ref = useRef(null);
  const headlineLine2Ref = useRef(null);
  const subtitleRef = useRef(null);
  const ctaButtonRef = useRef(null);
  const threeCanvasRef = useRef(null);
  const pageContainerRef = useRef(null);

  useEffect(() => {
    const heroElements = [
      dataCalloutRef.current,
      headlineLine1Ref.current,
      headlineLine2Ref.current,
      subtitleRef.current,
      ctaButtonRef.current,
      threeCanvasRef.current
    ].filter(Boolean);

    if (heroElements.length === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set(heroElements, {
        opacity: 1,
        y: 0,
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
      });
      return;
    }

    // Set initial states safely
    if (dataCalloutRef.current) gsap.set(dataCalloutRef.current, { opacity: 0 });
    
    const headlineTargets = [headlineLine1Ref.current, headlineLine2Ref.current].filter(Boolean);
    if (headlineTargets.length > 0) {
      gsap.set(headlineTargets, {
        clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
        opacity: 1
      });
    }
    
    if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 0, y: 12 });
    if (ctaButtonRef.current) gsap.set(ctaButtonRef.current, { opacity: 0, y: 12 });
    if (threeCanvasRef.current) gsap.set(threeCanvasRef.current, { opacity: 0 });

    // Single orchestrated GSAP timeline (Total duration < 1.4s)
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    if (dataCalloutRef.current) tl.to(dataCalloutRef.current, { opacity: 1, duration: 0.3 }, 0);
    if (headlineLine1Ref.current) tl.to(headlineLine1Ref.current, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 0.45 }, 0.2);
    if (headlineLine2Ref.current) tl.to(headlineLine2Ref.current, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 0.45 }, 0.4);
    if (subtitleRef.current) tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.4 }, 0.65);
    if (ctaButtonRef.current) tl.to(ctaButtonRef.current, { opacity: 1, y: 0, duration: 0.3 }, 0.85);
    if (threeCanvasRef.current) tl.to(threeCanvasRef.current, { opacity: 1, duration: 0.6 }, 0.9);

    // Scroll reveal pattern for sections below hero (Re-triggers on EVERY scroll)
    const sections = pageContainerRef.current?.querySelectorAll('.gsap-reveal-section') || [];
    sections.forEach((sec) => {
      const cards = sec.querySelectorAll('.aayu-card');
      const shouldStagger = cards.length > 0 && cards.length <= 6;

      gsap.fromTo(
        sec,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top 85%',
            end: 'bottom 15%',
            toggleActions: 'restart reverse restart reverse'
          }
        }
      );

      if (shouldStagger) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 24, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sec,
              start: 'top 82%',
              end: 'bottom 15%',
              toggleActions: 'restart reverse restart reverse'
            }
          }
        );
      }
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

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
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f1e1c]/60 backdrop-blur-sm">
        <div className="bg-white rounded-[24px] p-10 shadow-2xl max-w-sm w-full mx-4 text-center relative overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E7F6A]/5 via-transparent to-white/5 pointer-events-none" />
          {/* Pulsing ring */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-[#1E7F6A]/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-[#1E7F6A] flex items-center justify-center shadow-md">
              <Activity className="h-9 w-9 text-white" />
            </div>
          </div>
          <h2 className="font-fraunces font-bold text-xl text-[#182033] tracking-tight">Loading Demo</h2>
          <p className="text-sm text-[#3B4452] mt-2 leading-relaxed font-inter">
            Signing in as <span className="font-bold text-[#1E7F6A]">Priya Sharma</span> — demo patient
          </p>
          {/* Progress steps */}
          <div className="mt-6 space-y-2.5 text-left font-inter">
            {[
              { label: 'Loading patient profile...', done: true },
              { label: 'Fetching appointments...', done: true },
              { label: 'Connecting AI risk engine...', done: demoLoading },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-white text-[#1E7F6A]' : 'bg-white'
                }`}>
                  {step.done
                    ? <Check className="h-3 w-3 stroke-[2.5]" />
                    : <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                </div>
                <span className={`text-xs font-medium ${
                  step.done ? 'text-[#0f1e1c]' : 'text-[#4b5f5c]'
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#4b5f5c] mt-6 font-inter">This is a hackathon demo — no real data is used.</p>
        </div>
      </div>
    )}
    <div ref={pageContainerRef} className="min-h-screen bg-[#F8FAFC] text-[#334155] font-sans selection:bg-[#ccfbf1] selection:text-[#0f766e] antialiased">
      
      {/* SECTION 1 — SCROLL-AWARE DYNAMIC ENTERPRISE NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E2E8F0]'
          : 'bg-white/80 backdrop-blur-sm border-b border-[#E2E8F0]/60'
      }`}>
        <div className={`max-w-[1280px] mx-auto px-6 md:px-10 flex items-center justify-between transition-all duration-300 ${
          isScrolled ? 'h-14 sm:h-15' : 'h-16 sm:h-18'
        }`}>
          
          {/* Left Logo — Aayu */}
          <Link to="/" className="flex items-center select-none shrink-0">
            <BrandLogo height={28} />
          </Link>

          {/* Center Nav Links */}
          <div className="hidden lg:flex items-center space-x-1 text-xs font-semibold text-[#64748B]">
            {[
              { id: 'problem', label: 'Overview' },
              { id: 'comparison', label: 'Metrics' },
              { id: 'solution', label: 'Solution' },
              { id: 'workflow', label: 'Process' },
              { id: 'features', label: 'Features' },
              { id: 'results', label: 'Impact' },
              { id: 'faq', label: 'FAQ' }
            ].map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className={`px-3 py-1.5 rounded-[8px] transition-all duration-200 ${
                    isActive
                      ? 'bg-[#F1F5F9] text-[#0F172A] font-bold'
                      : 'hover:text-[#0F172A] hover:bg-[#F8FAFC] text-[#64748B]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <a
              href="https://aayu-staff.vercel.app/staff/login"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-block text-[#64748B] hover:text-[#0F172A] transition-colors duration-150"
            >
              Staff Portal
            </a>

            <Link
              to="/login"
              className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d5a54] text-white font-bold rounded-[8px] transition-all duration-150 shadow-sm active:scale-[0.98]"
            >
              Launch Portal
            </Link>
          </div>

        </div>

        {/* Scroll Progress Indicator Bar */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#0f766e] via-teal-400 to-[#0f766e] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </header>

      {/* SECTION 2 — HERO WITH LIVING PULSE NETWORK */}
      <section className="relative pt-[104px] pb-[48px] lg:pt-[136px] lg:pb-[96px] bg-[#F8FAFC] overflow-hidden border-b border-[#E2E8F0]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 xl:gap-20 items-center">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-5 flex flex-col items-start text-left z-20">
              
              {/* Main Headline */}
              <h1 className="font-sans font-black text-[38px] sm:text-[54px] lg:text-[68px] leading-[1.1] tracking-tight text-[#0F172A]">
                <span ref={headlineLine1Ref} className="block overflow-hidden pb-1">
                  Predictive Hospital
                </span>
                <span ref={headlineLine2Ref} className="block overflow-hidden pb-1">
                  Operations <span className="text-[#0f766e]">Intelligence</span>.
                </span>
              </h1>

              {/* Subtitle */}
              <p ref={subtitleRef} className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-[420px] mt-6 font-medium">
                Aayu works as an intelligence layer on top of your existing hospital software to predict patient no-shows, optimize doctor schedules, and recover lost clinic time automatically.
              </p>

              {/* CTA Buttons */}
              <div ref={ctaButtonRef} className="flex flex-wrap items-center gap-3.5 mt-8 w-full sm:w-auto">
                <Link
                  to="/login"
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#0f766e] text-white text-xs font-bold rounded-[8px] hover:bg-[#0d5a54] transition-all duration-150 shadow-sm shadow-[#0f766e]/10"
                >
                  <span>Open Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <button
                  onClick={() => setShowVideoModal(true)}
                  className="flex items-center justify-center space-x-2 px-5 py-3 bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] font-bold text-xs rounded-[8px] transition-all duration-150 cursor-pointer shadow-sm"
                >
                  <Play className="h-3 w-3 fill-current text-[#0f766e]" />
                  <span>Platform Walkthrough</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-x-5 gap-y-3.5 mt-10 pt-6 border-t border-[#E2E8F0] w-full">
                <div className="flex items-center space-x-1.5 text-[#475569]">
                  <Check className="h-3.5 w-3.5 text-[#0d9488] bg-teal-50 rounded-[4px] p-0.5" />
                  <span className="text-xs font-semibold">ABDM Compliant</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[#475569]">
                  <Check className="h-3.5 w-3.5 text-[#0d9488] bg-teal-50 rounded-[4px] p-0.5" />
                  <span className="text-xs font-semibold">SHAP Explained</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[#475569]">
                  <Check className="h-3.5 w-3.5 text-[#0d9488] bg-teal-50 rounded-[4px] p-0.5" />
                  <span className="text-xs font-semibold">SaaS Integrated</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[#475569]">
                  <Check className="h-3.5 w-3.5 text-[#0d9488] bg-teal-50 rounded-[4px] p-0.5" />
                  <span className="text-xs font-semibold">IVR Call Nudges</span>
                </div>
              </div>
            </div>

            {/* 6. RIGHT COLUMN — Smart OPD AI Journey & Intervention Visualizer */}
            <div
              ref={threeCanvasRef}
              className="lg:col-span-7 relative w-full lg:pl-6"
            >
              <LivingPulseNetwork />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — TRUST BAR */}
      <section className="gsap-reveal-section bg-white border-y border-[#E8ECEF] py-12">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-mono-data font-bold text-[28px] lg:text-[36px] text-[#182033] leading-none">
                25-30%
              </p>
              <p className="text-[14px] text-[#3B4452] mt-2 max-w-[220px] mx-auto leading-tight font-inter">
                Daily No-Show Rate in Indian Hospitals
              </p>
            </div>
            <div>
              <p className="font-mono-data font-bold text-[28px] lg:text-[36px] text-[#182033] leading-none">
                ₹15,000Cr
              </p>
              <p className="text-[14px] text-[#3B4452] mt-2 max-w-[220px] mx-auto leading-tight font-inter">
                Annual Revenue Lost Across India
              </p>
            </div>
            <div>
              <p className="font-mono-data font-bold text-[28px] lg:text-[36px] text-[#182033] leading-none">
                84%
              </p>
              <p className="text-[14px] text-[#3B4452] mt-2 max-w-[220px] mx-auto leading-tight font-inter">
                Our ML Prediction Accuracy
              </p>
            </div>
            <div>
              <p className="font-mono-data font-bold text-[28px] lg:text-[36px] text-[#182033] leading-none">
                &lt; 2 min
              </p>
              <p className="text-[14px] text-[#3B4452] mt-2 max-w-[220px] mx-auto leading-tight font-inter">
                Average Slot Recovery Time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — PROBLEM */}
      <section id="problem" className="gsap-reveal-section bg-white py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          {/* Section Header */}
          <div className="max-w-[640px] mb-16 text-left">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-[#1E7F6A] block mb-3 font-inter">
              The Problem
            </span>
            <h2 className="font-fraunces font-bold text-[30px] lg:text-[40px] text-[#182033] leading-tight tracking-tight">
              Every empty chair costs Aayu ₹3,000
            </h2>
            <p className="text-[18px] text-[#3B4452] mt-4 leading-[1.7] font-inter">
              25-30% of OPD patients don't show up. Doctors wait. Slots go empty. Revenue is lost. And nobody knows until it's too late.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[14px] p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[6px] bg-[#B8623F]/10 text-[#B8623F] flex items-center justify-center mb-5 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[#182033] mb-2 font-inter">
                  Doctors wait for no-shows
                </h3>
                <p className="text-[14px] text-[#3B4452] leading-relaxed mb-6 font-inter">
                  A doctor finds out a patient cancelled when nobody walks in. 30 minutes of idle time they can't recover.
                </p>
              </div>
              <div className="border-t border-[#E8ECEF] pt-4">
                <p className="font-mono-data font-bold text-[28px] text-[#B8623F] leading-none">
                  30 min
                </p>
                <p className="text-[12px] text-[#3B4452] mt-1 font-inter">
                  avg idle time per no-show
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[14px] p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[6px] bg-[#B8623F]/10 text-[#B8623F] flex items-center justify-center mb-5 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[#182033] mb-2 font-inter">
                  Patients get wrong reminders
                </h3>
                <p className="text-[14px] text-[#3B4452] leading-relaxed mb-6 font-inter">
                  A working professional needs 48 hours to plan leave. An elderly patient needs their family notified. Everyone gets the same generic SMS.
                </p>
              </div>
              <div className="border-t border-[#E8ECEF] pt-4">
                <p className="font-mono-data font-bold text-[28px] text-[#B8623F] leading-none">
                  1 size
                </p>
                <p className="text-[12px] text-[#3B4452] mt-1 font-inter">
                  fits nobody approach
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[14px] p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[6px] bg-[#B8623F]/10 text-[#B8623F] flex items-center justify-center mb-5 shrink-0">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[#182033] mb-2 font-inter">
                  Revenue leaks silently
                </h3>
                <p className="text-[14px] text-[#3B4452] leading-relaxed mb-6 font-inter">
                  No-shows aren't tracked. There's no prediction, no recovery, no system. Just a paper register and hope.
                </p>
              </div>
              <div className="border-t border-[#E8ECEF] pt-4">
                <p className="font-mono-data font-bold text-[28px] text-[#B8623F] leading-none">
                  ₹15,000Cr
                </p>
                <p className="text-[12px] text-[#3B4452] mt-1 font-inter">
                  annual industry revenue loss
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4.5 — COMPETITOR ANALYSIS (Placed directly below #problem) */}
      <section id="comparison" className="gsap-reveal-section bg-white py-16 lg:py-24 border-t border-[#E8ECEF]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 font-inter">
          {/* Section Header */}
          <div className="max-w-[700px] mb-16 text-left">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-[#1E7F6A] block mb-3 font-mono-data">
              HEAD-TO-HEAD SHOWDOWN · INDIAN OPD MARKET
            </span>
            <h2 className="font-fraunces font-bold text-[30px] lg:text-[42px] text-[#182033] leading-tight tracking-tight">
              Why Traditional OPD Systems Fail — And How Aayu Wins
            </h2>
            <p className="text-[18px] text-[#3B4452] mt-4 leading-[1.7]">
              Standard booking apps in India (Practo, Lybrate, legacy hospital software) leave doctors waiting and revenue leaking. Here is how Aayu OPD changes the game.
            </p>
          </div>

          {/* Side-by-Side High-Contrast Comparison Showdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            
            {/* Traditional Platforms Card (Muted / Failing Model) */}
            <div className="aayu-card bg-white border border-[#B8623F]/40 rounded-[24px] p-8 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-[#E8ECEF]">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[#B8623F]/10 text-[#B8623F] flex items-center justify-center font-bold text-lg">
                      ✕
                    </div>
                    <div>
                      <h3 className="font-fraunces font-bold text-xl text-[#182033]">
                        Traditional Indian OPD Systems
                      </h3>
                      <p className="text-xs text-[#3B4452]">Practo, Lybrate, Legacy Hospital HMS</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono-data font-bold text-[#B8623F] bg-[#B8623F]/10 px-3 py-1.5 rounded-full border border-[#B8623F]/20">
                    FAILING MODEL
                  </span>
                </div>

                <ul className="mt-6 space-y-5 text-sm text-[#3B4452]">
                  <li className="flex items-start space-x-3.5 bg-[#B8623F]/5 p-3.5 rounded-[12px] border border-[#B8623F]/10">
                    <span className="text-[#B8623F] font-bold text-lg leading-none mt-0.5">✕</span>
                    <div>
                      <strong className="text-[#182033] block font-bold text-[14.5px]">The 2-Hour SMS Trap</strong>
                      <span className="text-[13px] leading-relaxed">Sends 1 plain SMS 2h before appt. Ignored by 60%+ patients.</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3.5 bg-[#B8623F]/5 p-3.5 rounded-[12px] border border-[#B8623F]/10">
                    <span className="text-[#B8623F] font-bold text-lg leading-none mt-0.5">✕</span>
                    <div>
                      <strong className="text-[#182033] block font-bold text-[14.5px]">Blind To Risk (0% Intelligence)</strong>
                      <span className="text-[13px] leading-relaxed">Treats a 2km local patient the same as 35km in heavy rain.</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3.5 bg-[#B8623F]/5 p-3.5 rounded-[12px] border border-[#B8623F]/10">
                    <span className="text-[#B8623F] font-bold text-lg leading-none mt-0.5">✕</span>
                    <div>
                      <strong className="text-[#182033] block font-bold text-[14.5px]">30-45 Min Doctor Idle Time</strong>
                      <span className="text-[13px] leading-relaxed">Doctor finds out patient cancelled when slot is already wasted.</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3.5 bg-[#B8623F]/5 p-3.5 rounded-[12px] border border-[#B8623F]/10">
                    <span className="text-[#B8623F] font-bold text-lg leading-none mt-0.5">✕</span>
                    <div>
                      <strong className="text-[#182033] block font-bold text-[14.5px]">English-Only Text Wall</strong>
                      <span className="text-[13px] leading-relaxed">No regional language or voice support for elderly patients.</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E8ECEF] flex items-center justify-between text-xs text-[#B8623F] font-mono-data font-bold">
                <span>Resulting Revenue Loss:</span>
                <span>₹15,000 Cr / Year Leaked</span>
              </div>
            </div>

            {/* Aayu OPD Intelligence Card (Dark High-Contrast Winning Model) */}
            <div className="aayu-card bg-[#165B52] border-2 border-[#1E7F6A] rounded-[24px] p-8 shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
              {/* Top Accent Light Beam */}
              <div className="absolute top-0 right-0 bg-white text-[#182033] text-[11px] font-mono-data font-bold px-4 py-1.5 rounded-bl-[14px]">
                PROPRIETARY AI ENGINE
              </div>

              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/15">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[#1E7F6A] text-white flex items-center justify-center font-bold text-lg shadow-md">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-fraunces font-bold text-xl text-white">
                        Aayu OPD Intelligence
                      </h3>
                      <p className="text-xs text-[#EAF7F2] font-semibold">AI Risk Score + Instant WhatsApp Recovery</p>
                    </div>
                  </div>
                </div>

                <ul className="mt-6 space-y-5 text-sm">
                  <li className="flex items-start space-x-3.5 bg-white/10 p-3.5 rounded-[12px] border border-white/10">
                    <span className="text-[#EAF7F2] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="text-white block font-bold text-[14.5px]">Persona-Aware WhatsApp Nudges</strong>
                      <span className="text-white/80 text-[13px] leading-relaxed">48h working professional notice, elderly family loop, student nudges.</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3.5 bg-white/10 p-3.5 rounded-[12px] border border-white/10">
                    <span className="text-[#EAF7F2] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="text-white block font-bold text-[14.5px]">84.2% ML Live Risk Score (XGBoost)</strong>
                      <span className="text-white/80 text-[13px] leading-relaxed">Factors live travel distance, rain forecast, peak traffic & history.</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3.5 bg-white/10 p-3.5 rounded-[12px] border border-white/10">
                    <span className="text-[#EAF7F2] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="text-white block font-bold text-[14.5px]">&lt; 2 Minute Instant Slot Recovery</strong>
                      <span className="text-white/80 text-[13px] leading-relaxed">Cancelled slots re-assigned to waitlist patients automatically in seconds.</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3.5 bg-white/10 p-3.5 rounded-[12px] border border-white/10">
                    <span className="text-[#EAF7F2] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="text-white block font-bold text-[14.5px]">Hindi WhatsApp & Voice IVR Calls</strong>
                      <span className="text-white/80 text-[13px] leading-relaxed">Native Hindi 2-way bot & automated voice calling for elderly.</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-[#EAF7F2] font-mono-data font-bold">
                <span>Resulting Revenue Saved:</span>
                <span>Up to 40% No-Show Reduction</span>
              </div>
            </div>

          </div>

          {/* 4 Bottom High-Contrast Metric Counter Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[18px] p-5 shadow-2xs">
              <p className="text-[11px] font-bold text-[#3B4452] uppercase tracking-wider">No-Show Prediction</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="font-mono-data font-bold text-2xl text-[#1E7F6A]">84.2%</span>
                <span className="text-xs text-[#B8623F] font-bold">vs 0% Trad.</span>
              </div>
              <p className="text-xs text-[#3B4452] mt-1">XGBoost ML accuracy</p>
            </div>

            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[18px] p-5 shadow-2xs">
              <p className="text-[11px] font-bold text-[#3B4452] uppercase tracking-wider">Slot Recovery Speed</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="font-mono-data font-bold text-2xl text-[#1E7F6A]">&lt; 2 Min</span>
                <span className="text-xs text-[#B8623F] font-bold">vs Lost Hours</span>
              </div>
              <p className="text-xs text-[#3B4452] mt-1">Auto waitlist reassignment</p>
            </div>

            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[18px] p-5 shadow-2xs">
              <p className="text-[11px] font-bold text-[#3B4452] uppercase tracking-wider">Patient Engagement</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="font-mono-data font-bold text-2xl text-[#1E7F6A]">3.2x</span>
                <span className="text-xs text-[#1E7F6A] font-bold">Higher response</span>
              </div>
              <p className="text-xs text-[#3B4452] mt-1">Persona WhatsApp bot</p>
            </div>

            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[18px] p-5 shadow-2xs">
              <p className="text-[11px] font-bold text-[#3B4452] uppercase tracking-wider">Revenue Protection</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="font-mono-data font-bold text-2xl text-[#1E7F6A]">40%</span>
                <span className="text-xs text-[#1E7F6A] font-bold">Leakage saved</span>
              </div>
              <p className="text-xs text-[#3B4452] mt-1">Recovered OPD revenue</p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5 — SOLUTION */}
      <section id="solution" className="gsap-reveal-section bg-white py-16 lg:py-24 border-y border-[#E8ECEF]">
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
                <div className="w-12 h-12 rounded-[12px] bg-white text-amber-600 flex items-center justify-center mb-5 shrink-0">
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
                <div className="w-12 h-12 rounded-[12px] bg-white text-green-600 flex items-center justify-center mb-5 shrink-0">
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

      {/* SECTION 6 — WORKFLOW TIMELINE (Horizontal Sleeping Line Pipeline) */}
      <section id="workflow" className="gsap-reveal-section bg-white py-16 lg:py-24 font-inter">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          
          {/* Section Header */}
          <div className="max-w-[640px] mb-10 text-center mx-auto">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-[#1E7F6A] block mb-3 font-mono-data">
              LIVE PATIENT JOURNEY SIMULATION
            </span>
            <h2 className="font-fraunces font-bold text-[30px] lg:text-[42px] text-[#182033] leading-tight tracking-tight">
              From Booking to Recovery
            </h2>
            <p className="text-[17px] text-[#3B4452] mt-3 leading-[1.6]">
              Follow Priya's live journey — a working professional who booked a cardiology appointment and how our AI saved the slot.
            </p>
          </div>

          {/* Continuous Auto-Play Stage Indicator Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white border border-[#1E7F6A]/20 text-xs font-mono-data font-bold text-[#1E7F6A]">
              <span className="w-2 h-2 rounded-full bg-[#1E7F6A] animate-ping" />
              <span>LIVE AUTOMATED JOURNEY SIMULATOR · STAGE {activeWorkflowStep + 1} OF 6</span>
            </span>
          </div>

          {/* HORIZONTAL SLEEPING LINE TRACK & NODES */}
          <div className="max-w-[1000px] mx-auto relative mb-12 py-6 px-4">
            
            {/* Background Horizontal Track Rail */}
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[4px] bg-[#E8ECEF] z-0 rounded-full" />

            {/* Active Progress Laser Track Fill */}
            <div
              className="absolute left-8 top-1/2 -translate-y-1/2 h-[4px] bg-[#1E7F6A] z-0 rounded-full transition-all duration-500 shadow-sm"
              style={{
                width: `calc(${((activeWorkflowStep) / 5) * 100}% - 16px)`
              }}
            />

            {/* 6 Horizontal Nodes along the Sleeping Line */}
            <div className="relative z-10 flex items-center justify-between">
              {[
                { num: 1, tag: 'Booking', time: 'Day 0' },
                { num: 2, tag: 'Persona', time: 'Day 0' },
                { num: 3, tag: 'ML Risk', time: '84% High' },
                { num: 4, tag: 'WhatsApp', time: '48h Before' },
                { num: 5, tag: 'Reschedule', time: '24h Before' },
                { num: 6, tag: 'Recovered', time: '< 2m Later' }
              ].map((step, idx) => {
                const isActive = activeWorkflowStep === idx;
                const isPassed = activeWorkflowStep > idx;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveWorkflowStep(idx);
                    }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    {/* Circle Node */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-mono-data font-bold text-xs sm:text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-[#1E7F6A] text-white ring-4 ring-[#1E7F6A]/30 scale-125 shadow-lg'
                        : isPassed
                        ? 'bg-[#1E7F6A] text-white shadow-xs'
                        : 'bg-white border-2 border-[#E8ECEF] text-[#3B4452] hover:border-[#1E7F6A] hover:text-[#1E7F6A]'
                    }`}>
                      {step.num}
                    </div>

                    {/* Step Name Tag below node */}
                    <div className="text-center mt-3">
                      <span className={`block text-[11px] font-mono-data font-bold uppercase ${
                        isActive ? 'text-[#1E7F6A]' : 'text-[#3B4452]'
                      }`}>
                        {step.tag}
                      </span>
                      <span className="block text-[10px] text-[#3B4452]/70">
                        {step.time}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* DYNAMIC FEATURED STAGE SPOTLIGHT CARD (STAGE REVEAL) */}
          <div className="max-w-[840px] mx-auto transition-all duration-300">
            {activeWorkflowStep === 0 && (
              <div className="aayu-card bg-white border-2 border-[#1E7F6A] rounded-[24px] p-8 shadow-lg shadow-[#1E7F6A]/10 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8ECEF] mb-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-mono-data font-bold text-[#1E7F6A] block mb-1">
                      STAGE 1 OF 6 · DAY 0 INITIAL BOOKING
                    </span>
                    <h3 className="font-fraunces font-bold text-2xl text-[#182033]">
                      Priya books cardiology appointment
                    </h3>
                  </div>
                  <span className="text-xs font-mono-data font-bold bg-[#1E7F6A]/10 text-[#1E7F6A] px-3.5 py-1.5 rounded-full">
                    PORTAL BOOKING
                  </span>
                </div>

                <p className="text-[15px] text-[#3B4452] leading-relaxed mb-6">
                  Priya books Dr. Mehta (Cardiology) for July 3 via the patient portal. Instant WhatsApp confirmation is automatically dispatched to her phone.
                </p>

                <div className="bg-white border border-[#E8ECEF] rounded-[16px] p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-data text-[#182033]">
                  <div>
                    <span className="text-[#3B4452] block">BOOKING ID</span>
                    <strong className="text-sm">APL-2026-0847</strong>
                  </div>
                  <div>
                    <span className="text-[#3B4452] block">SPECIALTY</span>
                    <strong className="text-sm">Cardiology (Dr. Mehta)</strong>
                  </div>
                  <div>
                    <span className="text-[#3B4452] block">OPD FEE</span>
                    <strong className="text-sm text-[#1E7F6A]">₹800 Paid</strong>
                  </div>
                </div>
              </div>
            )}

            {activeWorkflowStep === 1 && (
              <div className="aayu-card bg-white border-2 border-[#1E7F6A] rounded-[24px] p-8 shadow-lg shadow-[#1E7F6A]/10 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8ECEF] mb-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-mono-data font-bold text-[#1E7F6A] block mb-1">
                      STAGE 2 OF 6 · PERSONA PROFILING
                    </span>
                    <h3 className="font-fraunces font-bold text-2xl text-[#182033]">
                      Persona preference set via WhatsApp
                    </h3>
                  </div>
                  <span className="text-xs font-mono-data font-bold bg-[#1E7F6A]/10 text-[#1E7F6A] px-3.5 py-1.5 rounded-full">
                    PERSONA ENGINE
                  </span>
                </div>

                <p className="text-[15px] text-[#3B4452] leading-relaxed mb-6">
                  WhatsApp asks how she wants to be reminded. She replies '1' — Working Professional. System automatically schedules 48h + 24h + morning reminders tailored to her schedule.
                </p>

                <div className="bg-white border border-[#E8ECEF] rounded-[16px] p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-data text-[#182033]">
                  <div>
                    <span className="text-[#3B4452] block">SELECTED PERSONA</span>
                    <strong className="text-sm text-[#1E7F6A]">Working Professional</strong>
                  </div>
                  <div>
                    <span className="text-[#3B4452] block">REMINDER CADENCE</span>
                    <strong className="text-sm">48h notice + 24h notice + 9 AM</strong>
                  </div>
                </div>
              </div>
            )}

            {activeWorkflowStep === 2 && (
              <div className="aayu-card bg-[#B8623F]/5 border-2 border-[#B8623F] rounded-[24px] p-8 shadow-lg shadow-[#B8623F]/10 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-[#B8623F]/20 mb-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-mono-data font-bold text-[#B8623F] block mb-1">
                      STAGE 3 OF 6 · PROPRIETARY ML RISK ENGINE
                    </span>
                    <h3 className="font-fraunces font-bold text-2xl text-[#182033]">
                      XGBoost ML scores her no-show risk
                    </h3>
                  </div>
                  <span className="text-xs font-mono-data font-bold bg-[#B8623F] text-white px-3.5 py-1.5 rounded-full">
                    84% HIGH RISK
                  </span>
                </div>

                <p className="text-[15px] text-[#3B4452] leading-relaxed mb-6">
                  XGBoost ML model evaluates 18 clinical & environmental features. Risk score is flagged at 84% HIGH.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-data">
                  <div className="bg-white p-3 rounded-[12px] border border-[#B8623F]/20">
                    <span className="text-[#3B4452] block">DISTANCE</span>
                    <strong className="text-[#B8623F]">38 km (+32%)</strong>
                  </div>
                  <div className="bg-white p-3 rounded-[12px] border border-[#B8623F]/20">
                    <span className="text-[#3B4452] block">PAST NO-SHOWS</span>
                    <strong className="text-[#B8623F]">2 / 6 (+28%)</strong>
                  </div>
                  <div className="bg-white p-3 rounded-[12px] border border-[#B8623F]/20">
                    <span className="text-[#3B4452] block">LEAD TIME</span>
                    <strong className="text-[#B8623F]">21 Days (+18%)</strong>
                  </div>
                  <div className="bg-white p-3 rounded-[12px] border border-[#B8623F]/20">
                    <span className="text-[#3B4452] block">RAIN FORECAST</span>
                    <strong className="text-[#B8623F]">Moderate (+6%)</strong>
                  </div>
                </div>
              </div>
            )}

            {activeWorkflowStep === 3 && (
              <div className="aayu-card bg-white border-2 border-[#1E7F6A] rounded-[24px] p-8 shadow-lg shadow-[#1E7F6A]/10 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8ECEF] mb-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-mono-data font-bold text-[#1E7F6A] block mb-1">
                      STAGE 4 OF 6 · AUTOMATED DISPATCH
                    </span>
                    <h3 className="font-fraunces font-bold text-2xl text-[#182033]">
                      48-Hour WhatsApp reminder sent
                    </h3>
                  </div>
                  <span className="text-xs font-mono-data font-bold bg-[#1E7F6A]/10 text-[#1E7F6A] px-3.5 py-1.5 rounded-full">
                    DISPATCH DELIVERED
                  </span>
                </div>

                <div className="bg-white/40 border border-[#1E7F6A]/20 rounded-[18px] p-5 mb-6">
                  <p className="text-xs font-mono-data font-bold text-[#1E7F6A] mb-2">WHATSAPP MESSAGE DISPATCHED TO PRIYA:</p>
                  <p className="text-[14.5px] text-[#182033] leading-relaxed italic">
                    "Hi Priya! Your appointment with Dr. Mehta is in 48 hours. Plan your leave today. Reply 1 to confirm, 2 to reschedule."
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono-data text-[#3B4452]">
                  <span>Channel: WhatsApp Business API</span>
                  <span className="text-[#1E7F6A] font-bold">Status: Delivered & Read</span>
                </div>
              </div>
            )}

            {activeWorkflowStep === 4 && (
              <div className="aayu-card bg-white border-2 border-[#EAF7F2] rounded-[24px] p-8 shadow-lg animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-[#EAF7F2]/40 mb-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-mono-data font-bold text-[#182033] block mb-1">
                      STAGE 5 OF 6 · INTERACTIVE CANCELLATION
                    </span>
                    <h3 className="font-fraunces font-bold text-2xl text-[#182033]">
                      Priya replies '2' — Reschedule
                    </h3>
                  </div>
                  <span className="text-xs font-mono-data font-bold bg-white text-[#182033] px-3.5 py-1.5 rounded-full">
                    SLOT FREED
                  </span>
                </div>

                <p className="text-[15px] text-[#3B4452] leading-relaxed mb-6">
                  Priya cannot make it. She replies '2'. Instantly, the slot opens on the staff dashboard, the waitlist algorithm scans for matched patients, and Rahul Verma gets notified.
                </p>

                <div className="bg-white border border-[#EAF7F2]/60 rounded-[16px] p-4 flex justify-between items-center text-xs font-mono-data">
                  <span>Waitlist Scan: 3 matched patients</span>
                  <span className="font-bold text-[#B8623F]">Revenue at Risk: ₹2,500</span>
                </div>
              </div>
            )}

            {activeWorkflowStep === 5 && (
              <div className="aayu-card bg-white border-2 border-[#1E7F6A] rounded-[24px] p-8 shadow-xl shadow-[#1E7F6A]/15 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-[#1E7F6A]/20 mb-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-mono-data font-bold text-[#1E7F6A] block mb-1">
                      STAGE 6 OF 6 · AUTOMATED RECOVERY SUCCESS
                    </span>
                    <h3 className="font-fraunces font-bold text-2xl text-[#182033]">
                      Slot recovered — Rahul booked in &lt; 2 minutes
                    </h3>
                  </div>
                  <span className="text-xs font-mono-data font-bold bg-[#1E7F6A] text-white px-3.5 py-1.5 rounded-full">
                    ₹2,500 RECOVERED
                  </span>
                </div>

                <p className="text-[15px] text-[#3B4452] leading-relaxed mb-6">
                  Rahul confirms via WhatsApp. The slot is filled. Revenue ticker updates automatically on the hospital dashboard. Dr. Mehta receives a notification: "Your 10 AM slot changed to Rahul."
                </p>

                <div className="bg-white border border-[#1E7F6A]/30 rounded-[16px] p-4 flex justify-between items-center text-xs font-mono-data text-[#1E7F6A] font-bold">
                  <span>Recovery Speed: &lt; 2 Minutes</span>
                  <span>Hospital Revenue Saved: ₹2,500</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* SECTION 7 — DASHBOARD PREVIEW (Dark Section) */}
      <section className="gsap-reveal-section bg-[#165B52] py-16 lg:py-24 text-center">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          <span className="text-[12px] uppercase tracking-widest text-[#F3FBF8]/70 block mb-3 font-semibold">
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
                className="mt-8 py-3 px-5 bg-white text-primary-teal rounded-lg text-[14px] hover:bg-white transition-colors block text-center font-medium"
              >
                Book Appointment &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FEATURES BENTO GRID */}
      <section id="features" className="gsap-reveal-section bg-white py-16 lg:py-24">
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
            <div className="bg-white rounded-2xl p-8 min-h-[240px] flex flex-col justify-between border border-[#f5e2b3] hover:shadow-sm transition-all duration-200">
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
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 flex flex-col md:flex-row justify-between gap-6 border border-[#c6f0d4] hover:shadow-sm transition-all duration-200">
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
              <p className="text-[14px] text-[#3B4452] leading-relaxed">
                Connect secondary phone numbers for dependent relatives. Automatically loop family members into reminder loops.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 9 — RESULTS */}
      <section id="results" className="gsap-reveal-section bg-white py-16 lg:py-24 border-y border-[#E8ECEF]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          {/* Section Header */}
          <div className="max-w-[500px] mb-16 text-center mx-auto font-inter">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-[#1E7F6A] block mb-3">
              Impact
            </span>
            <h2 className="font-fraunces font-bold text-[30px] lg:text-[40px] text-[#182033] leading-tight tracking-tight">
              Numbers That Matter
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
            
            {/* Card 1 */}
            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[16px] p-6 text-center shadow-2xs hover:shadow-xs transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-white text-[#1E7F6A] flex items-center justify-center mx-auto mb-4 shrink-0">
                <TrendingDown className="h-6 w-6" />
              </div>
              <p className="font-mono-data font-bold text-[32px] text-[#1E7F6A] leading-none">
                40%
              </p>
              <h4 className="text-[14px] font-semibold text-[#182033] mt-3 mb-1">
                No-show reduction
              </h4>
              <p className="text-[12px] text-[#3B4452]">
                After implementing smart persona-based reminders
              </p>
            </div>

            {/* Card 2 */}
            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[16px] p-6 text-center shadow-2xs hover:shadow-xs transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-white text-[#1E7F6A] flex items-center justify-center mx-auto mb-4 shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p className="font-mono-data font-bold text-[32px] text-[#1E7F6A] leading-none">
                ₹38.5L
              </p>
              <h4 className="text-[14px] font-semibold text-[#182033] mt-3 mb-1">
                Revenue recovered / month
              </h4>
              <p className="text-[12px] text-[#3B4452]">
                From slot recovery + waitlist notifications
              </p>
            </div>

            {/* Card 3 */}
            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[16px] p-6 text-center shadow-2xs hover:shadow-xs transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-white/30 text-[#182033] flex items-center justify-center mx-auto mb-4 shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <p className="font-mono-data font-bold text-[32px] text-[#182033] leading-none">
                127 hrs
              </p>
              <h4 className="text-[14px] font-semibold text-[#182033] mt-3 mb-1">
                Doctor time saved / month
              </h4>
              <p className="text-[12px] text-[#3B4452]">
                Eliminating idle waiting for no-show patients
              </p>
            </div>

            {/* Card 4 */}
            <div className="aayu-card bg-white border border-[#E8ECEF] rounded-[16px] p-6 text-center shadow-2xs hover:shadow-xs transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-white text-[#1E7F6A] flex items-center justify-center mx-auto mb-4 shrink-0">
                <RefreshCw className="h-6 w-6" />
              </div>
              <p className="font-mono-data font-bold text-[32px] text-[#1E7F6A] leading-none">
                89
              </p>
              <h4 className="text-[14px] font-semibold text-[#182033] mt-3 mb-1">
                Slots reused this month
              </h4>
              <p className="text-[12px] text-[#3B4452]">
                Cancelled appointments filled from waitlist
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 10 — FAQ */}
      <section id="faq" className="gsap-reveal-section bg-white py-16 lg:py-24">
        <div className="max-w-[768px] mx-auto px-6 md:px-8 font-inter">
          {/* Section Header */}
          <div className="max-w-[500px] mb-12 text-center mx-auto">
            <span className="text-[12px] uppercase tracking-[0.15em] font-semibold text-[#1E7F6A] block mb-3">
              FAQ
            </span>
            <h2 className="font-fraunces font-bold text-[32px] text-[#182033] leading-tight tracking-tight">
              Common Questions
            </h2>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            
            {/* Q1 */}
            <details className="aayu-card group border border-[#E8ECEF] rounded-[14px] bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-[#182033] pr-4 select-none">
                  How does the ML model predict no-shows?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-[#3B4452] shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-[#3B4452] leading-relaxed">
                  Our XGBoost machine learning model analyzes 18 distinct parameters (including patient historical attendance, travel distance, lead time from booking, and weather forecast) to output a risk score from 0-100%.
                </p>
              </div>
            </details>

            {/* Q2 */}
            <details className="aayu-card group border border-[#E8ECEF] rounded-[14px] bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-[#182033] pr-4 select-none">
                  Is the WhatsApp integration real?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-[#3B4452] shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-[#3B4452] leading-relaxed">
                  Yes, the system supports 2-way real-time messaging using standard WhatsApp templates. Patients can confirm, cancel, or trigger reschedules directly by replying with numbers.
                </p>
              </div>
            </details>

            {/* Q3 */}
            <details className="aayu-card group border border-[#E8ECEF] rounded-[14px] bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-[#182033] pr-4 select-none">
                  What about elderly patients who don't use WhatsApp?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-[#3B4452] shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-[#3B4452] leading-relaxed">
                  We have automated voice calls in Hindi (or regional languages) that read out the slot timings and capture responses, plus the option to notify their family contact chain.
                </p>
              </div>
            </details>

            {/* Q4 */}
            <details className="aayu-card group border border-[#E8ECEF] rounded-[14px] bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-[#182033] pr-4 select-none">
                  What is SHAP explainability?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-[#3B4452] shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-[#3B4452] leading-relaxed">
                  SHAP breaks down the model output into contributions. Instead of just giving a score, it displays 'Distance +32%, Past no-show +28%' so staff can understand the context.
                </p>
              </div>
            </details>

            {/* Q5 */}
            <details className="aayu-card group border border-[#E8ECEF] rounded-[14px] bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-[#182033] pr-4 select-none">
                  How does slot recovery work?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-[#3B4452] shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-[#3B4452] leading-relaxed">
                  When a patient replies to cancel or reschedule, the slot opens instantly. Our engine checks the waitlist, sends notifications, and secures a replacement booking within minutes.
                </p>
              </div>
            </details>

            {/* Q6 */}
            <details className="aayu-card group border border-[#E8ECEF] rounded-[14px] bg-white transition-all duration-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[14px] font-medium text-[#182033] pr-4 select-none">
                  Can this integrate with hospital HMS?
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-[#3B4452] shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <p className="text-[14px] text-[#3B4452] leading-relaxed">
                  Yes, we expose a full REST API that syncs with standard HMS platforms like Practo Ray, MediXcel, and ABDM/ABHA configurations.
                </p>
              </div>
            </details>

          </div>
        </div>
      </section>

      {/* SECTION 11 — CTA */}
      <section className="gsap-reveal-section bg-[#165B52] py-20 text-center font-inter">
        <div className="max-w-[768px] mx-auto px-6 md:px-8">
          <h2 className="font-fraunces font-bold text-[36px] lg:text-[40px] text-white tracking-tight leading-tight">
            Stop Losing Patients. Start Recovering Revenue.
          </h2>
          <p className="text-[16px] text-white/80 mt-4 max-w-[460px] mx-auto leading-relaxed">
            Aayu OPD Intelligence is ready for your hospital.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-[#182033] font-semibold text-[16px] rounded-[6px] hover:bg-white/80 transition-all duration-200 shadow-md"
            >
              Book Appointment
            </Link>
            <a
              href="http://localhost:5173/staff/login"
              className="px-8 py-4 border border-white/30 text-white font-medium text-[16px] rounded-[6px] hover:border-white/60 transition-all duration-200"
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
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-poppins font-bold text-[20px] text-[#182033] tracking-tight">Aayu<span className="text-[#1E7F6A] ml-1">OPD</span></span>
            <span className="hidden md:inline text-text-light">&#183;</span>
            <span className="text-text-light">Demo Day 2026</span>
          </div>

          {/* Right Group */}
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/login" className="text-text-light hover:text-[#374151] transition-colors duration-200">
              Patient Portal
            </Link>
            <a
              href="https://aayu-staff.vercel.app/staff/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-light hover:text-[#374151] transition-colors duration-200"
            >
              Staff Login
            </a>
            <span className="text-gray-300">Built by Team Aayu</span>
          </div>
        </div>
      </footer>

    </div>

    {/* Video Demo & Competitor Showdown Modal */}
    <VideoDemoModal
      isOpen={showVideoModal}
      onClose={() => setShowVideoModal(false)}
      onLaunchDemo={handleTryDemo}
    />
    </>
  );
}
